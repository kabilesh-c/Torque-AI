"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Vapi from "@vapi-ai/web";

export type CallStatus = "idle" | "connecting" | "active" | "ai-speaking" | "user-speaking" | "ended" | "error";

export interface TranscriptEntry {
  role: "assistant" | "user";
  text: string;
  timestamp: Date;
}

export interface UseVapiReturn {
  status: CallStatus;
  transcript: TranscriptEntry[];
  isMuted: boolean;
  volumeLevel: number;
  startCall: (assistant: string | object, overrides?: object) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  error: string | null;
}

// Vapi emits errors in several shapes (Error, {error: {message}}, SDK event
// objects, plain strings). Pull out something human-readable.
function describeVapiError(err: unknown): string {
  if (!err) return "Voice call error";
  if (typeof err === "string") return err;
  const e = err as { message?: unknown; error?: { message?: unknown } | string; errorMsg?: unknown };
  const inner = typeof e.error === "string" ? e.error : e.error?.message;
  // Vapi error events are loosely shaped — any of these may be a non-string
  const msg = [e.message, inner, e.errorMsg].find(
    (m): m is string => typeof m === "string" && m.length > 0
  );
  if (msg && (msg === "Failed to fetch" || msg.includes("fetch"))) {
    return "Couldn't reach the voice service. Check your internet connection, and disable adblockers or shields for this site.";
  }
  if (msg?.includes("ejection") || msg?.includes("Meeting has ended")) {
    return "The call was ended by the voice service — usually because no microphone audio was received. Check that the right mic is selected and not muted, then try again.";
  }
  return msg || "Voice call error";
}

export function useVapi(): UseVapiReturn {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_VAPI_API_KEY not set — Vapi will not initialize");
      return;
    }

    // Route Vapi REST calls through our own domain (/api/vapi/*) — direct
    // browser requests to api.vapi.ai are often blocked by adblockers,
    // Brave shields, firewalls, or ISPs, which kills call creation.
    const vapi = new Vapi(apiKey, `${window.location.origin}/api/vapi`);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setStatus("active");
      setError(null);

      // The SDK force-enables Krisp noise cancellation after joining. Its WASM
      // frequently fails to load (blocked/unsupported), which crashes the mic
      // processor and leaves Vapi receiving no customer audio — the call then
      // gets ejected with "assistant-did-not-receive-customer-audio".
      // Disable the processor and make sure the mic track is live.
      const daily = vapi.getDailyCallObject();
      if (daily) {
        Promise.resolve(
          daily.updateInputSettings({ audio: { processor: { type: "none" } } })
        )
          .then(() => daily.setLocalAudio(true))
          .catch((e) => console.warn("[VAPI] could not disable audio processor", e));
      }
    });

    vapi.on("call-end", () => {
      setStatus("ended");
    });

    vapi.on("speech-start", () => {
      setStatus("ai-speaking");
    });

    vapi.on("speech-end", () => {
      setStatus("active");
    });

    // Volume level 0-1 from Vapi
    vapi.on("volume-level", (vol: number) => {
      setVolumeLevel(vol);
    });

    vapi.on("message", (msg: { type: string; role?: string; transcript?: string; transcriptType?: string }) => {
      if (msg.type === "transcript" && msg.transcriptType === "final" && msg.role && msg.transcript) {
        setTranscript((prev) => [
          ...prev,
          {
            role: msg.role as "assistant" | "user",
            text: msg.transcript as string,
            timestamp: new Date(),
          },
        ]);

        // Track speaking state
        if (msg.role === "user") {
          setStatus("user-speaking");
          setTimeout(() => setStatus("active"), 500);
        }
      }
    });

    vapi.on("error", (err: unknown) => {
      console.error("[VAPI ERROR]", err);
      setError(describeVapiError(err));
      setStatus("error");
    });

    return () => {
      vapi.stop();
    };
  }, []);

  const startCall = useCallback(async (assistant: string | object, overrides?: object) => {
    const vapi = vapiRef.current;
    if (!vapi) {
      setError("Vapi not initialized. Check NEXT_PUBLIC_VAPI_API_KEY.");
      return;
    }

    try {
      setStatus("connecting");
      setError(null);

      // Request mic access up front so permission failures are reported
      // distinctly from network/Vapi failures.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setError("Microphone access denied. Allow microphone permissions for this site and try again.");
        setStatus("error");
        return;
      }

      await vapi.start(assistant as any, overrides as any);
    } catch (err) {
      console.error("[VAPI START ERROR]", err);
      setError(describeVapiError(err));
      setStatus("error");
    }
  }, []);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
    setStatus("ended");
  }, []);

  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const newMuted = !isMuted;
    vapi.setMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  return {
    status,
    transcript,
    isMuted,
    volumeLevel,
    startCall,
    endCall,
    toggleMute,
    error,
  };
}
