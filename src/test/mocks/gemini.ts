// AegisAI StadiumOS — Gemini API Mock Service
// Provides fast, deterministic, offline mock implementations of GoogleGenAI models for test isolation.

export interface MockGenerateOptions {
  model: string;
  contents: string | any[];
  config?: {
    temperature?: number;
    systemInstruction?: string;
    tools?: any[];
  };
}

export interface MockGenerateResponse {
  text?: string;
  functionCalls?: Array<{
    name: string;
    args: any;
  }>;
  candidates?: Array<{
    content: {
      role: string;
      parts: Array<any>;
    };
  }>;
}

export class MockGoogleGenAI {
  public apiKey: string;
  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
  }

  get models() {
    return {
      generateContent: async (options: MockGenerateOptions): Promise<MockGenerateResponse> => {
        const textPrompt = Array.isArray(options.contents)
          ? JSON.stringify(options.contents)
          : options.contents;
        
        const lowerPrompt = textPrompt.toLowerCase();

        // Scenario 1: User asking about wait times or gate congestion
        if (lowerPrompt.includes("gate") || lowerPrompt.includes("wait") || lowerPrompt.includes("shortest")) {
          return {
            functionCalls: [{
              name: "get_gate_status",
              args: { gateId: lowerPrompt.includes("gate c") ? "C" : "B" }
            }],
            candidates: [{
              content: {
                role: "model",
                parts: [{ text: "Determining real-time gate telemetry status." }]
              }
            }]
          };
        }

        // Scenario 2: Rerouting or congestion alerts
        if (lowerPrompt.includes("reroute") || lowerPrompt.includes("bottleneck") || lowerPrompt.includes("crowd")) {
          return {
            functionCalls: [{
              name: "trigger_rerouting_protocol",
              args: { fromGate: "B", toGate: "C" }
            }],
            candidates: [{
              content: {
                role: "model",
                parts: [{ text: "Initiating active crowd-routing override procedures." }]
              }
            }]
          };
        }

        // Scenario 3: Playbook FAQ search
        if (lowerPrompt.includes("playbook") || lowerPrompt.includes("sop") || lowerPrompt.includes("heat")) {
          return {
            functionCalls: [{
              name: "search_playbook_sop",
              args: { query: "heat stress hydration volunteer" }
            }],
            candidates: [{
              content: {
                role: "model",
                parts: [{ text: "Searching official FIFA 2026 Manual for safety guidelines." }]
              }
            }]
          };
        }

        // Fallback simple text answer
        return {
          text: "AegisAI StadiumOS running in simulation-intelligent mode. Telemetry parameters are within nominal safety limits.",
          candidates: [{
            content: {
              role: "model",
              parts: [{ text: "AegisAI StadiumOS running in simulation-intelligent mode. Telemetry parameters are within nominal safety limits." }]
            }
          }]
        };
      }
    };
  }
}
