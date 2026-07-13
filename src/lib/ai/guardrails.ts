// AegisAI StadiumOS — Safety & Input Guardrails
// Implements real-time input sanitization, blocklists, and prompt-injection detection.

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  sanitizedMessage: string;
}

const FORBIDDEN_WORDS = [
  "gemini_api_key",
  "process.env",
  "ignore previous instructions",
  "system instructions",
  "system prompt",
  "bypass safety",
  "jailbreak",
  "hakai",
];

const STADIUM_TOPIC_KEYWORDS = [
  "gate", "turnstile", "queue", "wait", "crowd", "traffic", "shuttle", "metro",
  "parking", "heat", "hydration", "water", "restroom", "bathroom", "toilet",
  "concession", "food", "beer", "security", "police", "medical", "injury",
  "incident", "alert", "route", "playbook", "sop", "france", "spain", "fifa",
  "stadium", "match", "kickoff", "roof", "cooling", "volunteers", "accessible",
  "wheelchair", "elevator", "ramp", "help", "how", "where", "which", "ticket",
  "hello", "hi", "hey"
];

export function runInputGuardrails(input: string): GuardrailResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // 1. Minimum/Maximum length checks
  if (trimmed.length === 0) {
    return { passed: false, reason: "Input is empty.", sanitizedMessage: "" };
  }
  if (trimmed.length > 800) {
    return { passed: false, reason: "Input exceeds maximum allowed limit of 800 characters.", sanitizedMessage: trimmed.substring(0, 800) };
  }

  // 2. Scan for prompt injection / leak patterns
  for (const pattern of FORBIDDEN_WORDS) {
    if (lower.includes(pattern)) {
      return {
        passed: false,
        reason: `Potential safety policy violation: '${pattern}' detected.`,
        sanitizedMessage: trimmed.replace(new RegExp(pattern, "gi"), "[REDACTED]")
      };
    }
  }

  // 3. Off-topic classifier: ensure queries are loosely connected to stadium operations
  // If the query is long but shares no stadium keywords, we flag it.
  if (trimmed.length > 20) {
    const hasStadiumContext = STADIUM_TOPIC_KEYWORDS.some(kw => lower.includes(kw));
    if (!hasStadiumContext) {
      return {
        passed: false,
        reason: "The query does not appear relevant to smart stadium operations, transit routing, or event guidelines.",
        sanitizedMessage: trimmed
      };
    }
  }

  return {
    passed: true,
    sanitizedMessage: trimmed
  };
}
