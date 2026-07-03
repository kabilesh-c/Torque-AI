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
      voiceId: "rachel", // Standard ElevenLabs voice
    },
    model: {
      provider: "custom-llm",
      url: `${appUrl}/api/sessions/${config.sessionId}/turn`,
      model: "gpt-4o-mini",
    },
    firstMessage: config.openingMessage,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    silenceTimeoutSeconds: 30, // Faster timeout detection
    maxDurationSeconds: 1800, // 30 min max
    endCallFunctionEnabled: false,
    recordingEnabled: false,
    metadata: {
      sessionId: config.sessionId,
      interviewType: config.interviewType,
    },
  };
}
