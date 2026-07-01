"use client";

import { cn } from "@/lib/utils";
import { CallStatus } from "@/hooks/use-vapi";

interface OrbVisualizerProps {
  status: CallStatus;
  volumeLevel?: number;
  className?: string;
}

export function OrbVisualizer({ status, volumeLevel = 0, className }: OrbVisualizerProps) {
  const isAISpeaking = status === "ai-speaking";
  const isListening = status === "active" || status === "user-speaking";
  const isConnecting = status === "connecting";

  // Dynamic scale based on volume
  const scale = 1 + volumeLevel * 0.12;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outermost ripple ring */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-300",
          isAISpeaking && "animate-ping opacity-20",
          isListening && "animate-ping opacity-10",
        )}
        style={{
          width: 280,
          height: 280,
          background: isAISpeaking
            ? "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)"
            : isListening
            ? "radial-gradient(circle, rgba(232,255,0,0.1) 0%, transparent 70%)"
            : "transparent",
          animationDuration: isAISpeaking ? "1.5s" : "2s",
        }}
      />

      {/* Middle glow ring */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-500",
          isAISpeaking && "animate-pulse",
        )}
        style={{
          width: 220,
          height: 220,
          background: isAISpeaking
            ? "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)"
            : "transparent",
          animationDuration: "2s",
        }}
      />

      {/* Core orb */}
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center transition-all duration-300",
          isAISpeaking && "animate-orb-speak",
          isListening && "animate-orb-listen",
          !isAISpeaking && !isListening && !isConnecting && "animate-orb-idle",
        )}
        style={{
          width: 160,
          height: 160,
          transform: `scale(${scale})`,
          background: isAISpeaking
            ? "radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 40%, #0369a1 80%, #082f49 100%)"
            : isListening
            ? "radial-gradient(circle at 35% 35%, #f0ff70 0%, #e8ff00 40%, #b3c900 80%, #454d00 100%)"
            : isConnecting
            ? "radial-gradient(circle at 35% 35%, #666 0%, #333 40%, #1a1a1a 80%, #000 100%)"
            : "radial-gradient(circle at 35% 35%, #333 0%, #1a1a1a 40%, #0d0d0d 80%, #000 100%)",
        }}
      >
        {/* Inner highlight */}
        <div
          className="absolute rounded-full opacity-60"
          style={{
            width: 60,
            height: 60,
            top: 22,
            left: 28,
            background: isAISpeaking
              ? "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)"
              : isListening
              ? "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Status icon */}
        <div className="relative z-10">
          {isConnecting && (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
          {isAISpeaking && (
            <SoundWaveIcon className="text-white opacity-70" size={28} />
          )}
          {(status === "idle" || status === "ended") && (
            <MicIcon className="text-[var(--text-muted)]" size={28} />
          )}
        </div>
      </div>

      {/* Status label */}
      <div className="absolute -bottom-10 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--text-muted)]">
          {status === "idle" && "Ready"}
          {status === "connecting" && "Connecting..."}
          {status === "active" && "Listening"}
          {status === "ai-speaking" && "AI Speaking"}
          {status === "user-speaking" && "Speaking"}
          {status === "ended" && "Session Ended"}
          {status === "error" && "Error"}
        </p>
      </div>
    </div>
  );
}

function SoundWaveIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" style={{ animation: "waveBar 1s ease-in-out infinite", animationDelay: "0ms" }} />
      <rect x="6" y="6" width="2" height="12" rx="1" fill="currentColor" style={{ animation: "waveBar 1s ease-in-out infinite", animationDelay: "150ms" }} />
      <rect x="10" y="3" width="2" height="18" rx="1" fill="currentColor" style={{ animation: "waveBar 1s ease-in-out infinite", animationDelay: "300ms" }} />
      <rect x="14" y="6" width="2" height="12" rx="1" fill="currentColor" style={{ animation: "waveBar 1s ease-in-out infinite", animationDelay: "150ms" }} />
      <rect x="18" y="9" width="2" height="6" rx="1" fill="currentColor" style={{ animation: "waveBar 1s ease-in-out infinite", animationDelay: "0ms" }} />
    </svg>
  );
}

function MicIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
