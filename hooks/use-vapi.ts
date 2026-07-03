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

    const vapi = new Vapi(apiKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setStatus("active");
      setError(null);
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

    vapi.on("error", (err: Error) => {
      console.error("[VAPI ERROR]", err);
      setError(err.message || "Voice call error");
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
      await vapi.start(assistant as any, overrides as any);
    } catch (err) {
      console.error("[VAPI START ERROR]", err);
      setError("Failed to start voice call. Check microphone permissions.");
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
