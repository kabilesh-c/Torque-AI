"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useVapi } from "@/hooks/use-vapi";
import { OrbVisualizer } from "@/components/interview/OrbVisualizer";
import { TranscriptPanel } from "@/components/interview/TranscriptPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, PhoneOff, Clock, ChevronDown, ChevronUp, Zap } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InterviewSessionPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { status, transcript, isMuted, volumeLevel, startCall, endCall, toggleMute, error } = useVapi();

  const [sessionData, setSessionData] = useState<{
    openingMessage?: string;
    interviewType?: string;
    graphState?: object;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [callStarted, setCallStarted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Fetch session data + opening message
  useEffect(() => {
    async function loadSession() {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();

      // Get the first AI turn as opening
      const firstAITurn = data.session.transcript?.find(
        (t: { speaker: string }) => t.speaker === "AI"
      );

      setSessionData({
        openingMessage: firstAITurn?.text || "",
        interviewType: data.session.interviewType,
      });
      setLoading(false);
    }
    loadSession();
  }, [id, router]);

  // Timer
  useEffect(() => {
    if (status !== "active" && status !== "ai-speaking" && status !== "user-speaking") return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStartCall = useCallback(async () => {
    if (!sessionData?.openingMessage) return;
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      appUrl = window.location.origin;
    }
    if (!appUrl && typeof window !== "undefined") {
      appUrl = window.location.origin;
    }

    const assistantConfig = {
      name: "Torque",
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
      },
      model: {
        provider: "custom-llm",
        url: `${appUrl}/api/sessions/${id}/turn`,
        model: "gpt-4o-mini",
      },
      firstMessage: sessionData.openingMessage,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 1800,
    };

    await startCall(assistantConfig);
    setCallStarted(true);
  }, [sessionData, id, startCall]);

  const handleEndCall = useCallback(async () => {
    setIsEnding(true);
    endCall();

    // End session + generate report
    await fetch(`/api/sessions/${id}/end`, { method: "POST" });
    router.push(`/dashboard/${id}`);
  }, [endCall, id, router]);

  const typeLabel: Record<string, string> = {
    BEHAVIORAL: "Behavioral",
    TECHNICAL: "Technical",
    SYSTEM_DESIGN: "System Design",
    HR_CULTURE: "HR / Culture",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Preparing your interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <Zap size={12} className="text-black" />
            </div>
          </Link>
          {sessionData?.interviewType && (
            <Badge variant="muted">{typeLabel[sessionData.interviewType] || sessionData.interviewType}</Badge>
          )}
          {(status === "active" || status === "ai-speaking" || status === "user-speaking") && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
              Live
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {callStarted && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] tabular-nums">
              <Clock size={12} />
              {formatTime(elapsedSeconds)}
            </div>
          )}

          {/* Transcript toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1.5 rounded-md hover:bg-[var(--surface-elevated)]"
          >
            Transcript
            {showTranscript ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </header>

      {/* Main area */}
      <main className="flex-1 flex flex-col items-center justify-center relative p-8">
        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              status === "ai-speaking"
                ? "radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.04) 0%, transparent 70%)"
                : status === "active" || status === "user-speaking"
                ? "radial-gradient(ellipse at 50% 50%, rgba(232,255,0,0.03) 0%, transparent 70%)"
                : "none",
            transition: "background 1s ease",
          }}
        />

        {/* Error state */}
        {error && (
          <div className="mb-8 px-4 py-3 rounded-[var(--radius)] bg-[var(--destructive-dim)] border border-[rgba(239,68,68,0.3)] text-sm text-[var(--destructive)] max-w-sm text-center">
            {error}
          </div>
        )}

        {/* Orb */}
        <div className="flex flex-col items-center gap-16">
          <OrbVisualizer status={status} volumeLevel={volumeLevel} className="mb-4" />

          {/* Status text */}
          <div className="text-center space-y-1 mt-4">
            {!callStarted && status === "idle" && (
              <>
                <p className="text-lg font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-geist)" }}>
                  Ready when you are
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  The AI will introduce itself and start the interview
                </p>
              </>
            )}
            {status === "connecting" && (
              <p className="text-sm text-[var(--text-secondary)]">Connecting to interviewer...</p>
            )}
            {status === "ai-speaking" && (
              <p className="text-sm text-[var(--accent)]" style={{ fontFamily: "var(--font-geist)" }}>
                Interviewer speaking
              </p>
            )}
            {status === "active" && callStarted && (
              <p className="text-sm text-[var(--text-secondary)]">Listening to you...</p>
            )}
            {status === "user-speaking" && (
              <p className="text-sm text-[var(--accent)]">You&apos;re speaking</p>
            )}
            {status === "ended" && (
              <p className="text-sm text-[var(--text-secondary)]">Session ended — generating your report...</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!callStarted ? (
              <Button
                onClick={handleStartCall}
                variant="primary"
                size="lg"
                loading={status === "connecting"}
                id="start-call-btn"
                className="gap-2"
              >
                <Mic size={16} />
                Start interview
              </Button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  id="toggle-mute-btn"
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    isMuted
                      ? "bg-[var(--destructive-dim)] border-[rgba(239,68,68,0.4)] text-[var(--destructive)]"
                      : "bg-[var(--surface-elevated)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <Button
                  onClick={handleEndCall}
                  variant="destructive"
                  size="md"
                  loading={isEnding}
                  id="end-call-btn"
                  className="gap-2"
                >
                  <PhoneOff size={14} />
                  End interview
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Transcript drawer */}
        {showTranscript && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] bg-[var(--surface)] animate-slide-up">
            <div className="max-w-2xl mx-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Live Transcript</span>
                <span className="text-xs text-[var(--text-muted)]">Read only — for reference</span>
              </div>
              <TranscriptPanel
                entries={transcript}
                className="h-48"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
