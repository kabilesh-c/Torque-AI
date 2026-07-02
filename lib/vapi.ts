import Vapi from "@vapi-ai/web";

let _vapi: Vapi | null = null;

export function getVapiClient(): Vapi {
  if (!_vapi) {
    const key = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!key) throw new Error("NEXT_PUBLIC_VAPI_API_KEY is not set");
    _vapi = new Vapi(key);
  }
  return _vapi;
}

export interface VapiAssistantConfig {
  sessionId: string;
  candidateName: string;
  openingMessage: string;
  interviewType: string;
}

export function buildAssistantConfig(config: VapiAssistantConfig) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    name: "Torque",
    voice: {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM", // Standard ElevenLabs voice
      stability: 0.35,  // Emotive & faster generation
      similarityBoost: 0.75,
      style: 0.05,
      useSpeakerBoost: true,
      chunkPlan: {
        enabled: true,
        minChunks: 1, // Stream voice instantly
      }
    },
    model: {
      provider: "custom-llm",
      url: `${appUrl}/api/sessions/${config.sessionId}/turn`,
      model: "gpt-4o-mini",
      temperature: 0.7,
    },
    firstMessage: config.openingMessage,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    backchannelingEnabled: true, // Enables verbal nods (mm-hmm, uh-huh)
    backgroundSound: "office", // Faint background noise for realism
    interruptionThresholdSeconds: 0.35, // Interruption is detected in 350ms
    silenceTimeoutSeconds: 15, // Faster timeout detection
    maxDurationSeconds: 1800, // 30 min max
    endCallFunctionEnabled: false,
    recordingEnabled: false,
    metadata: {
      sessionId: config.sessionId,
      interviewType: config.interviewType,
    },
  };
}
