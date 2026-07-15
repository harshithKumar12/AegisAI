import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  DigitalTwinState, 
  Incident, 
  AgentType, 
  Agent 
} from "./src/types"; // Standard typescript extensionless import resolution
import { SYSTEM_PROMPTS } from "./src/lib/ai/prompts";
import { TOOLS_SCHEMA } from "./src/lib/ai/tools";
import { runInputGuardrails } from "./src/lib/ai/guardrails";
import { retrievePlaybookArticles, generateContextBlock } from "./src/lib/ai/rag";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const app = express();

// Secure server with Helmet headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to prevent blocking local dev/iframe assets
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());

// Server-wide rate limit configuration
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many operational requests from this station. AegisAI rate-limiting active.",
    success: false
  }
});

// Centralized CSRF Protection
const csrfToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

const csrfGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const incomingToken = req.headers['x-aegis-csrf-token'];
  if (!incomingToken || incomingToken !== csrfToken) {
    return res.status(403).json({ error: "CSRF token mismatch. Action blocked for security." });
  }
  next();
};

// Enterprise-grade Server-side Audit Logging
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
}

const auditLogs: AuditLogEntry[] = [];

export function logAuditAction(operator: string, action: string, details: string) {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    operator,
    action,
    details
  };
  auditLogs.unshift(entry);
  console.log(`[AUDIT LOG] [${entry.timestamp}] Operator: ${operator} | Action: ${action} | Details: ${details}`);
}

const PORT = 3000;

// Initialize Google Gemini API on the server-side with user-agent telemetry
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("AegisAI backend initialized successfully with Google Gemini API.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.log("GEMINI_API_KEY not configured or has default placeholder. AegisAI running in offline/simulation-intelligent mode.");
}

// Global simulated Stadium State
let stadiumState: DigitalTwinState = {
  stadiumName: "AT&T Stadium (Arlington, Texas) — FIFA 2026 Semifinal",
  attendanceCount: 78450,
  capacityLimit: 80000,
  crowdDensity: 78,
  safetyIndex: 98,
  sustainabilityScore: 84,
  gateStatuses: [
    { id: "A", name: "Gate A (North Entrance)", flowRate: 110, waitTime: 18, status: 'normal', capacity: 200 },
    { id: "B", name: "Gate B (East Plaza Plaza Gate)", flowRate: 45, waitTime: 38, status: 'congested', capacity: 150 },
    { id: "C", name: "Gate C (West Plaza Entrance)", flowRate: 165, waitTime: 8, status: 'normal', capacity: 220 },
    { id: "D", name: "Gate D (South VIP Entry)", flowRate: 30, waitTime: 4, status: 'normal', capacity: 80 }
  ],
  facilityStatuses: [
    { id: "wc_east", name: "Restroom - East Concourse", type: 'restroom', occupancy: 92, status: 'crowded', waitLabel: "9 mins" },
    { id: "wc_west", name: "Restroom - West Concourse", type: 'restroom', occupancy: 35, status: 'normal', waitLabel: "1 min" },
    { id: "food_north", name: "Food Court - North Wing", type: 'food', occupancy: 85, status: 'crowded', waitLabel: "12 mins" },
    { id: "food_south", name: "Food Court - South Deck", type: 'food', occupancy: 42, status: 'normal', waitLabel: "3 mins" },
    { id: "med_plaza", name: "Emergency Medical Center B", type: 'medical', occupancy: 60, status: 'normal', waitLabel: "Available" },
    { id: "park_gold", name: "Parking Deck - Gold Zone", type: 'parking', occupancy: 98, status: 'full', waitLabel: "Full" },
    { id: "park_silver", name: "Parking Deck - Silver Zone", type: 'parking', occupancy: 74, status: 'normal', waitLabel: "Spaces Left" }
  ],
  resourceUsage: {
    electricityKwh: 1680,
    electricitySavingPct: 14,
    waterLiters: 145000,
    waterSavingPct: 9,
    wasteTons: 16.8,
    carbonFootprintKg: 2850
  },
  transportStatus: {
    metroLineStatus: "Retractable roof closed. Supp. shuttle buses active to Dallas/Fort Worth Transit lanes.",
    shuttleFrequencyMins: 6,
    rideShareWaitMins: 18,
    parkingOccupancyPct: 96,
    congestionIndex: 74
  },
  activeIncidents: [
    {
      id: "inc-1",
      type: "medical",
      location: "Sector B14 - East Upper Deck (Sun Exposed Glazing)",
      title: "Solar Heat Dehydration",
      severity: "medium",
      description: "A spectator is suffering from thermal heat fatigue and acute dehydration. External temperature is 39°C (102°F). High thermal load near glazed perimeter panels is elevating the local wet-bulb temperature. Retractable roof closed with AC active.",
      status: "active",
      timestamp: "13:40",
      recommendedAction: "Dispatch Volunteer Hydration Team to Sector B14 with electrolyte pouches and cooling wraps; assess for medical escalation.",
      assignedAgent: "volunteer"
    },
    {
      id: "inc-2",
      type: "operations",
      location: "Gate B (East Plaza Entry Turnstiles)",
      title: "Turnstile Verification Outage",
      severity: "high",
      description: "4 out of 10 ticket validation scanners at Gate B lost wireless connection. High arrival volume of Spanish and French-speaking spectators is creating immediate bottlenecks. Wait times are peaking at 38 minutes.",
      status: "active",
      timestamp: "13:35",
      recommendedAction: "Deploy multilingual volunteer guides to redirect flows; initiate local offline-caching validation protocol; send technicians to check Gate B switch.",
      assignedAgent: "operations"
    }
  ]
};

// Mutate stadium state to simulate live, breathing events
export function mutateStadiumState(state: DigitalTwinState): DigitalTwinState {
  const nextState = { ...state };
  
  // attendanceCount fluctuates slightly up towards the cap
  if (nextState.attendanceCount < nextState.capacityLimit - 100) {
    const arrivals = Math.floor(Math.random() * 20) + 5;
    nextState.attendanceCount += arrivals;
  } else {
    // slightly fluctuate when nearly full
    nextState.attendanceCount += Math.floor(Math.random() * 11) - 5;
  }

  // gate wait-times fluctuate
  nextState.gateStatuses = nextState.gateStatuses.map(g => {
    const gateCopy = { ...g };
    if (gateCopy.status === 'congested') {
      const delta = Math.random() > 0.6 ? -1 : 1;
      gateCopy.waitTime = Math.max(15, gateCopy.waitTime + delta);
    } else {
      const delta = Math.random() > 0.5 ? -1 : 1;
      gateCopy.waitTime = Math.max(2, gateCopy.waitTime + delta);
    }
    // update flow rate proportionally
    gateCopy.flowRate = Math.max(10, Math.round(gateCopy.capacity * (1 - (gateCopy.waitTime / 50))));
    return gateCopy;
  });

  // fluctuates crowdDensity slightly
  const densityDelta = Math.random() > 0.5 ? 1 : -1;
  nextState.crowdDensity = Math.max(30, Math.min(95, nextState.crowdDensity + densityDelta));

  // fluctuates resources
  const resourceCopy = { ...nextState.resourceUsage };
  resourceCopy.electricityKwh += Math.floor(Math.random() * 5) - 2;
  resourceCopy.waterLiters += Math.floor(Math.random() * 100) - 40;
  resourceCopy.wasteTons = parseFloat((resourceCopy.wasteTons + 0.01).toFixed(2));
  nextState.resourceUsage = resourceCopy;

  return nextState;
}

setInterval(() => {
  stadiumState = mutateStadiumState(stadiumState);
}, 3500);

// Agents metadata definitions and specialized instructions
const AGENTS_METADATA: Record<AgentType, Agent> = {
  fan: {
    id: 'fan',
    name: 'Aegis Fan Companion',
    role: 'Smart Navigation & Fan Experience Agent',
    description: 'Assists fans in finding gates, predicting arrival times, choosing low-traffic entrances, and translating services.',
    color: 'from-blue-500 to-cyan-500',
    icon: 'Compass',
    capabilities: ['Dynamic ETA Calculations', 'Multilingual Translation', 'Accessibility Path Planning', 'Crowd-Averse Route Selection'],
    systemPrompt: SYSTEM_PROMPTS.fan
  },
  crowd: {
    id: 'crowd',
    name: 'Aegis Crowd Intelligence',
    role: 'Live Flow & Queue Distribution Agent',
    description: 'Uses live occupancy tracking and predictive modeling to detect bottlenecks and suggest crowd-redistribution protocols.',
    color: 'from-orange-500 to-amber-500',
    icon: 'Users',
    capabilities: ['Bottleneck Prediction', 'Flow Redistribution Guidance', 'Gate Capacity Overrides', 'Evacuation Rate Modeling'],
    systemPrompt: SYSTEM_PROMPTS.crowd
  },
  command: {
    id: 'command',
    name: 'Command Center Orchestrator',
    role: 'Multi-Agent Mission Coordinator & Safety Evaluator',
    description: 'Coordinates active security, emergency medical, transit schedules, and power grid shedding, leveraging grounded playbook protocols.',
    color: 'from-indigo-500 to-violet-500',
    icon: 'Layers',
    capabilities: ['Dynamic Triage Planning', 'Multi-Agent Dispatch Sync', 'Grounded RAG Playbook Search', 'FIFA Safety Compliance Audits'],
    systemPrompt: SYSTEM_PROMPTS.command
  },
  operations: {
    id: 'operations',
    name: 'Aegis Operations Control',
    role: 'Physical Infrastructure & Maintenance Monitor',
    description: 'Monitors smart grid electricity, wastewater flow, restroom sanitization, food court supply, and equipment health.',
    color: 'from-emerald-500 to-teal-500',
    icon: 'Activity',
    capabilities: ['Predictive Maintenance Logs', 'Smart Restroom Dispatch', 'Power Grid Optimization', 'Concession Inventory Sync'],
    systemPrompt: SYSTEM_PROMPTS.operations
  },
  emergency: {
    id: 'emergency',
    name: 'Aegis Emergency Dispatch',
    role: 'High-Priority Safety & Crisis Response Agent',
    description: 'Automates crisis routing, security incident detection, medical dispatch paths, and stadium fire safety evacuations.',
    color: 'from-red-500 to-rose-600',
    icon: 'ShieldAlert',
    capabilities: ['Fastest First Aid Route', 'Fire Evacuation Corridors', 'Suspicious Incident Flagging', 'Ambulance Entry Coordination'],
    systemPrompt: SYSTEM_PROMPTS.emergency
  },
  volunteer: {
    id: 'volunteer',
    name: 'Aegis Volunteer Copilot',
    role: 'Staff Onboarding & Task Translation Assistant',
    description: 'Acts as a voice and knowledge assistant to translate conversations, parse FAQ manuals, and schedule volunteer shifts.',
    color: 'from-violet-500 to-purple-600',
    icon: 'ClipboardList',
    capabilities: ['Instant Manual Grounding', 'Dual-Way Conversation Translation', 'Dynamic Crew Shift Routing', 'Volunteer FAQ Assistance'],
    systemPrompt: SYSTEM_PROMPTS.volunteer
  },
  accessibility: {
    id: 'accessibility',
    name: 'Aegis Accessibility Officer',
    role: 'Universal Design & Special Assistance Specialist',
    description: 'Ensures wheelchair-friendly navigation paths, elevator access optimization, and audio-to-text/text-to-speech options.',
    color: 'from-pink-500 to-rose-400',
    icon: 'Heart',
    capabilities: ['Wheelchair-Optimized Routing', 'Elevator Queue Management', 'Multimodal Captioning', 'Sensory-Friendly Space Locator'],
    systemPrompt: SYSTEM_PROMPTS.accessibility
  },
  sustainability: {
    id: 'sustainability',
    name: 'Aegis Green Guardian',
    role: 'Carbon Neutrality & Resource Conservation Agent',
    description: 'Tracks waste bins, predicts food demand to prevent surplus, optimizes solar-plus-storage, and computes carbon scores.',
    color: 'from-green-600 to-emerald-500',
    icon: 'Leaf',
    capabilities: ['Food Surplus Analytics', 'Solar Energy Distribution', 'Carbon Footprint Tracking', 'Smart Waste Collection Scheduling'],
    systemPrompt: SYSTEM_PROMPTS.sustainability
  },
  transport: {
    id: 'transport',
    name: 'Aegis Logistics & Transit',
    role: 'Intermodal Transit & Regional Traffic Coordinator',
    description: 'Maintains ride-sharing queues, coordinates light-rail line timing, forecasts highway backups, and plans parking.',
    color: 'from-indigo-500 to-violet-500',
    icon: 'Truck',
    capabilities: ['Post-Match Congestion Modeling', 'Metro Transit Frequency Shifts', 'Smart Ride-Share Allocations', 'Real-Time Parking Guidance'],
    systemPrompt: SYSTEM_PROMPTS.transport
  }
};

// API Endpoint to fetch latest Stadium Digital Twin state
app.get("/api/stadium-state", (req, res) => {
  res.json(stadiumState);
});

// CSRF exchange token endpoint
app.get("/api/csrf-token", (req, res) => {
  res.json({ token: csrfToken });
});

// Secure API endpoint to fetch server-side operator audits
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// API Endpoint to manually trigger actions or resolve alerts
app.post("/api/apply-recommendation", csrfGuard, apiLimiter, (req, res) => {
  const { actionType, gateId, incidentId, operator } = req.body;
  
  // Validate request parameters shape and boundaries
  if (actionType && (typeof actionType !== "string" || actionType.length > 50)) {
    return res.status(400).json({ error: "Invalid actionType format" });
  }
  if (gateId && (typeof gateId !== "string" || gateId.length > 50)) {
    return res.status(400).json({ error: "Invalid gateId format" });
  }
  if (incidentId && (typeof incidentId !== "string" || incidentId.length > 50)) {
    return res.status(400).json({ error: "Invalid incidentId format" });
  }
  if (operator && typeof operator === "string") {
    const operatorGuard = runInputGuardrails(operator);
    if (!operatorGuard.passed) {
      return res.status(400).json({ error: "Operator validation failed: " + operatorGuard.reason });
    }
  }

  const activeOperator = operator || "Operations Supervisor";
  
  if (actionType === "resolve_incident" && incidentId) {
    stadiumState.activeIncidents = stadiumState.activeIncidents.map(inc => {
      if (inc.id === incidentId) {
        logAuditAction(activeOperator, "RESOLVE_INCIDENT", `Resolved active incident: '${inc.title}' at ${inc.location}`);
        return { ...inc, status: "resolved" as const };
      }
      return inc;
    });
    // Dynamically improve metrics slightly when incidents are resolved
    stadiumState.safetyIndex = Math.min(100, stadiumState.safetyIndex + 1);
  }

  if (actionType === "optimize_gate" && gateId) {
    logAuditAction(activeOperator, "OPTIMIZE_GATE", `Initiated gate bypass optimization for Gate ${gateId}`);
    stadiumState.gateStatuses = stadiumState.gateStatuses.map(g => {
      if (g.id === gateId) {
        // Reroute some traffic: decrease wait time, balance rate
        return { 
          ...g, 
          waitTime: Math.max(5, Math.round(g.waitTime * 0.5)), 
          flowRate: Math.round(g.flowRate * 1.3),
          status: 'normal' as const
        };
      }
      return g;
    });
    stadiumState.crowdDensity = Math.max(50, stadiumState.crowdDensity - 4);
  }

  if (actionType === "optimize_sustainability") {
    logAuditAction(activeOperator, "OPTIMIZE_SUSTAINABILITY", `Triggered microgrid battery peak-shaving protocols`);
    stadiumState.resourceUsage.electricitySavingPct = Math.min(30, stadiumState.resourceUsage.electricitySavingPct + 5);
    stadiumState.resourceUsage.waterSavingPct = Math.min(25, stadiumState.resourceUsage.waterSavingPct + 3);
    stadiumState.sustainabilityScore = Math.min(100, stadiumState.sustainabilityScore + 4);
  }

  if (actionType === "dispatch_medical" && incidentId) {
    stadiumState.activeIncidents = stadiumState.activeIncidents.map(inc => {
      if (inc.id === incidentId) {
        logAuditAction(activeOperator, "DISPATCH_MEDICAL", `Dispatched rapid-first-aid responder en route to: '${inc.title}' at ${inc.location}`);
        return { ...inc, status: "resolving" as const, description: inc.description + " [Medical Unit Dispatched & En Route]" };
      }
      return inc;
    });
  }

  res.json({ success: true, stadiumState });
});

// Define local tool execution engine matching our tools schemas
export function executeToolLocal(name: string, args: any, state: any) {
  switch (name) {
    case 'get_gate_status': {
      const gateId = (args.gateId || 'B').toUpperCase();
      const gate = state.gateStatuses.find((g: any) => g.id === gateId);
      return gate || { error: `Gate ${gateId} not found` };
    }
    case 'get_facility_status': {
      const facId = args.facilityId || '';
      const facility = state.facilityStatuses.find((f: any) => f.id === facId);
      return facility || { error: `Facility ${facId} not found` };
    }
    case 'get_accessibility_info': {
      return {
        sector: args.sector || 'Sector East',
        ramps: "Ramp B14 (ADA Compliant, 1:12 slope)",
        elevators: "Elevator Orange (Priority queue, wait-time 2 mins)",
        sensoryRooms: "Quiet zone located in Sector West mezzanine"
      };
    }
    case 'get_zone_occupancy': {
      const zoneId = args.zoneId || 'East';
      return {
        zone: zoneId,
        occupancyPercentage: zoneId.toLowerCase() === 'east' ? Math.min(98, state.crowdDensity + 10) : Math.max(20, state.crowdDensity - 15),
        bottleneckAlert: zoneId.toLowerCase() === 'east' ? "Heavy queue at Gate B" : "Nominal flow"
      };
    }
    case 'trigger_rerouting_protocol': {
      return {
        success: true,
        recommendedAction: `Reroute traffic from Gate ${args.fromGate || 'B'} to Gate ${args.toGate || 'C'}. Calculated flow improvement is 45 ppm.`
      };
    }
    case 'get_active_incidents': {
      return state.activeIncidents.filter((inc: any) => inc.status !== 'resolved');
    }
    case 'search_playbook_sop': {
      const query = args.query || '';
      const keywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      let bestArticle = PLAYBOOK_MANUAL[0];
      let maxScore = -1;
      PLAYBOOK_MANUAL.forEach(art => {
        let score = 0;
        const txt = (art.article + " " + art.content).toLowerCase();
        keywords.forEach((w: string) => { if (txt.includes(w)) score += 1; });
        if (score > maxScore) {
          maxScore = score;
          bestArticle = art;
        }
      });
      return {
        retrievedArticle: bestArticle.article,
        procedureText: bestArticle.content
      };
    }
    default:
      return { error: "Unknown tool call" };
  }
}

const toolsList = TOOLS_SCHEMA;

// Single chat and routing system utilizing the server-side Google GenAI SDK SDK
app.post("/api/chat-agent", csrfGuard, apiLimiter, async (req, res) => {
  const { agentId, message, contextState, role, operator } = req.body;

  if (!agentId || !message) {
    return res.status(400).json({ error: "Missing required agentId or message" });
  }

  // Validate parameter formats and boundaries
  if (typeof agentId !== "string" || agentId.length > 50) {
    return res.status(400).json({ error: "Invalid agentId format" });
  }
  if (typeof message !== "string") {
    return res.status(400).json({ error: "Invalid message format" });
  }
  if (role && (typeof role !== "string" || role.length > 50)) {
    return res.status(400).json({ error: "Invalid role format" });
  }
  if (operator && typeof operator === "string") {
    const operatorGuard = runInputGuardrails(operator);
    if (!operatorGuard.passed) {
      return res.status(400).json({ error: "Operator validation failed: " + operatorGuard.reason });
    }
  }

  // Server-side Role Gating:
  // Fans can ONLY access 'fan', 'accessibility', and 'transport' agents
  const userRole = role || 'fan';
  const targetAgentId = agentId;

  if (userRole === 'fan' && !['fan', 'accessibility', 'transport'].includes(targetAgentId)) {
    logAuditAction("Guest Fan", "ACCESS_DENIED", `Unauthorized attempt to access operator-level Agent: '${targetAgentId}'`);
    return res.json({
      success: false,
      responseText: `⚠️ **Access Denied:** Your current profile (Fan) is restricted from consulting internal operations command agents (e.g., '${targetAgentId}'). Please switch to the **Command Center** view to authorize organizer-level consults.`,
      agentId: targetAgentId,
      traces: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  // Run security and safety input guardrails
  const guardrail = runInputGuardrails(message);
  if (!guardrail.passed) {
    logAuditAction(operator || "System", "GUARDRAIL_VIOLATION", `Message failed safety guardrails: "${message.substring(0, 40)}..."`);
    return res.json({
      success: false,
      responseText: `⚠️ **AegisAI Guardrails Alert:** ${guardrail.reason}`,
      agentId: agentId,
      traces: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }
  const sanitizedMessage = guardrail.sanitizedMessage;

  logAuditAction(operator || (userRole === 'fan' ? "Guest Fan" : "Operations Supervisor"), "CONSULT_AGENT", `Successfully consulted Agent: '${targetAgentId}'`);

  const agentMeta = AGENTS_METADATA[targetAgentId as AgentType];
  if (!agentMeta) {
    return res.status(400).json({ error: "Invalid agentId requested" });
  }

  const currentState = contextState || stadiumState;

  // Construct complete contextual prompt incorporating current stadium metrics
  const stateSummary = currentState ? `
Current Stadium Metrics:
- Attendance: ${currentState.attendanceCount}/${currentState.capacityLimit}
- Crowd Density Score: ${currentState.crowdDensity}%
- Safety Index: ${currentState.safetyIndex}%
- Active Incidents Count: ${currentState.activeIncidents?.filter((i: Incident) => i.status !== 'resolved').length || 0}
- Gate statuses: ${JSON.stringify(currentState.gateStatuses)}
- Resource saving details: Elec saving ${currentState.resourceUsage?.electricitySavingPct}%, Water saving ${currentState.resourceUsage?.waterSavingPct}%
` : `Current Stadium Metrics are running nominally.`;

  const fullPrompt = `
System Context: ${agentMeta.systemPrompt}
${stateSummary}

User Query/Report: "${sanitizedMessage}"

Please generate a professional, highly specific, actionable AI Agent response.
Limit formatting to clean markdown, and provide 2 bulleted concrete recommendations for stadium operations or fan navigation if appropriate.
`;

  const traces: any[] = [];

  try {
    if (ai) {
      console.log(`Querying Gemini (gemini-3.5-flash) with Function Calling for Agent: ${targetAgentId}`);
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: fullPrompt,
        config: {
          temperature: 0.2,
          systemInstruction: "You are the " + agentMeta.name + ", an essential modular agent of AegisAI StadiumOS, the cutting-edge FIFA 2026 stadium orchestration system.",
          tools: toolsList
        }
      });

      let finalResponseText = "";
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        console.log(`Gemini requested tool execution: ${call.name} with parameters:`, call.args);

        const result = executeToolLocal(call.name, call.args, currentState);
        traces.push({
          functionName: call.name,
          args: call.args,
          result: result
        });

        // Query Gemini again, providing the grounded tool execution response
        const secondResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            { role: 'user', parts: [{ text: fullPrompt }] },
            response.candidates?.[0]?.content,
            {
              role: 'user',
              parts: [{
                functionResponse: {
                  name: call.name,
                  response: result
                }
              }]
            }
          ],
          config: {
            temperature: 0.2,
            systemInstruction: "You are the " + agentMeta.name + ", an essential modular agent of AegisAI StadiumOS, the cutting-edge FIFA 2026 stadium orchestration system."
          }
        });

        finalResponseText = secondResponse.text || "Formulating grounded resolution...";
      } else {
        finalResponseText = response.text || "Processing telemetry request...";
      }

      return res.json({
        success: true,
        responseText: finalResponseText,
        agentId: targetAgentId,
        traces: traces,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      // Simulate high-fidelity offline tool calling traces
      console.log(`Simulating offline tool calling for Agent: ${targetAgentId}`);
      let chosenToolName = "";
      let simulatedArgs: any = {};
      
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("gate") || lowerMsg.includes("queue") || lowerMsg.includes("wait")) {
        chosenToolName = "get_gate_status";
        simulatedArgs = { gateId: lowerMsg.includes("gate c") ? "C" : lowerMsg.includes("gate a") ? "A" : "B" };
      } else if (lowerMsg.includes("bathroom") || lowerMsg.includes("restroom") || lowerMsg.includes("food") || lowerMsg.includes("concession") || lowerMsg.includes("facility")) {
        chosenToolName = "get_facility_status";
        simulatedArgs = { facilityId: lowerMsg.includes("wc") ? "wc_east" : "food_north" };
      } else if (lowerMsg.includes("wheelchair") || lowerMsg.includes("accessibility") || lowerMsg.includes("ada") || lowerMsg.includes("elevator") || lowerMsg.includes("ramp")) {
        chosenToolName = "get_accessibility_info";
        simulatedArgs = { sector: "Sector East" };
      } else if (lowerMsg.includes("bottleneck") || lowerMsg.includes("density") || lowerMsg.includes("crowd") || lowerMsg.includes("occupancy")) {
        chosenToolName = "get_zone_occupancy";
        simulatedArgs = { zoneId: "East" };
      } else if (lowerMsg.includes("incident") || lowerMsg.includes("emergency") || lowerMsg.includes("medical") || lowerMsg.includes("alert")) {
        chosenToolName = "get_active_incidents";
        simulatedArgs = {};
      } else if (lowerMsg.includes("protocol") || lowerMsg.includes("playbook") || lowerMsg.includes("sop") || lowerMsg.includes("manual")) {
        chosenToolName = "search_playbook_sop";
        simulatedArgs = { query: message };
      } else {
        chosenToolName = "search_playbook_sop";
        simulatedArgs = { query: "stadium operations general guidance" };
      }

      const result = executeToolLocal(chosenToolName, simulatedArgs, currentState);
      traces.push({
        functionName: chosenToolName,
        args: simulatedArgs,
        result: result
      });

      // Format clean grounded mock answers matching the simulated tool result
      let reply = "";
      if (chosenToolName === "get_gate_status") {
        reply = `**Aegis Gateway Diagnostic Response** (via \`get_gate_status\`)
        
I queried real-time telemetries for **Gate ${simulatedArgs.gateId}**.
*   **Flow Rate:** ${result.flowRate} ppm (fans per minute).
*   **Wait Time:** ${result.waitTime} minutes.
*   **Status:** The channel is currently classified as **${result.status}** with a design capacity threshold of ${result.capacity} ppm.

**Recommendations:**
- If wait times exceed 30 mins, push automatic companion alerts routing fans toward Gate C (8 min wait).
- Verify offline backup synchronizer mode if RF scanner communication drops.`;
      } else if (chosenToolName === "get_facility_status") {
        reply = `**Aegis Facility Congestion Report** (via \`get_facility_status\`)
        
I verified the real-time sensors for **${result.name || simulatedArgs.facilityId}**:
*   **Occupancy Load:** ${result.occupancy}% of design capacity.
*   **Current Queue Description:** ${result.waitLabel || 'Normal load'}.
*   **Status:** Classified as **${result.status}**.

**Recommendations:**
- Update local smart signage in Sector East to direct fans to the lower-load West restrooms (1 min wait).
- Maintain cleaning shifts on alert standby for Sector surges.`;
      } else if (chosenToolName === "get_accessibility_info") {
        reply = `**Accessibility & Inclusive Navigation Plan** (via \`get_accessibility_info\`)
        
I queried the accessibility registries for **${simulatedArgs.sector}**:
*   **Wheelchair Access:** ${result.ramps}.
*   **Priority Lifts:** ${result.elevators} is active under priority-access mode for elderly and limited-mobility spectators.
*   **Sensory Quiet Rooms:** ${result.sensoryRooms}.

**Recommendations:**
- Direct volunteers in Sector B14 to clear step-free walkways leading toward Elevator Orange.
- Provide multilingual visual placards indicating ramp routes near Gate C.`;
      } else if (chosenToolName === "get_zone_occupancy") {
        reply = `**Concourse Zone Occupancy Assessment** (via \`get_zone_occupancy\`)
        
I measured the physical crowd concentration in **Zone ${simulatedArgs.zoneId}**:
*   **Live Seating/Concourse Density:** ${result.occupancyPercentage}%.
*   **Anomalous Bottlenecks:** ${result.bottleneckAlert}.

**Recommendations:**
- Initiate active crowd redistribution protocols, opening supplementary barrier lines to split entrance clusters.
- Coordinate shuttle frequency loops to stagger arrivals near peak exit windows.`;
      } else if (chosenToolName === "get_active_incidents") {
        reply = `**Master Operations Safety Registry** (via \`get_active_incidents\`)
        
I accessed the operations command center registry. There are currently active incidents under monitoring:
${result.map((inc: any, idx: number) => `\n${idx + 1}. **${inc.title}** (${inc.location}): Severity **${inc.severity}**. Status: *${inc.status}*. Description: *${inc.description}*.`).join("")}

**Recommendations:**
- Authorize immediate electrolyte hydration dispatch for the hydration anomaly in Sector B14.
- Instruct local tech personnel to apply local offline verification credentials for the scanner outage.`;
      } else {
        reply = `**Aegis Grounded SOP Playbook Inquiry** (via \`search_playbook_sop\`)
        
I searched the official FIFA operations manuals for *"${result.retrievedArticle}"*:
*   **Grounded Manual Text:** *"${result.procedureText}"*

**Recommendations:**
- Formulate immediate step-by-step triage matching Article rules.
- Confirm all volunteer squad leads are briefed on reunifying lost children and heat fatigue guidelines.`;
      }

      return res.json({
        success: true,
        responseText: reply + `\n\n*(Aegis AI successfully executed tool call \`${chosenToolName}\` via simulated high-fidelity offline execution)*`,
        agentId: targetAgentId,
        traces: traces,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  } catch (error: any) {
    console.error("Gemini endpoint error:", error);
    res.status(500).json({ error: "Agent consultation failed", details: error.message });
  }
});

// Real Bilingual Voice Assistant Endpoint
app.post("/api/voice-assistant", csrfGuard, apiLimiter, async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text parameter" });
  }

  // Validate parameter formats and boundaries
  if (typeof text !== "string" || text.length > 500) {
    return res.status(400).json({ error: "Invalid text format" });
  }

  // Sanitize input with guardrails
  const guard = runInputGuardrails(text);
  if (!guard.passed) {
    return res.json({
      success: false,
      inputLanguage: "Unknown",
      transcribedText: text,
      translatedText: "Blocked by Guardrails",
      response: `⚠️ AegisAI Guardrails Alert: ${guard.reason}`,
      translatedResponse: `⚠️ Alerta de Seguridad AegisAI: ${guard.reason}`
    });
  }

  const sanitizedText = guard.sanitizedMessage;

  const prompt = `
  You are the AegisAI Bilingual Speech Assistant for a stadium navigation system.
  The spectator said (in their spoken language, which might be English, Spanish, or another language): "${sanitizedText}".

  Please analyze their query and formulate a short, helpful response (under 2 sentences) about stadium operations, facilities, or navigation (e.g., elevators, concessions, bathrooms, sectors, gates, wheelchair access).
  Use these mock/live facts if relevant:
  - Gate B (East Entry) is currently congested (38m wait). Spectators are advised to go to Gate C (West Plaza, 4m wait).
  - Elevator Orange (Sector B, near Section B14) is priority-access for wheelchairs. ADA Compliant Ramp B14 has a 1:12 slope.
  - Quiet sensory room is located in Sector West mezzanine.
  - East Concourse Bathroom has 9 min wait, West Concourse Bathroom has 1 min wait.
  - North Concession Grill has 12 min wait.

  Respond in the following structured JSON format only, with no other text, markdown blocks, or commentary:
  {
    "inputLanguage": "detected input language (e.g., English, Spanish, etc.)",
    "transcribedText": "the input text",
    "translatedText": "the translation of the input text into Spanish if the input was in English, or English if the input was in Spanish (or other language)",
    "response": "A helpful assistant response in English",
    "translatedResponse": "The translated assistant response in the other language (e.g., Spanish)"
  }
  `;

  try {
    if (ai) {
      console.log(`Querying Gemini (gemini-3.5-flash) for Voice Assistant speech query: "${sanitizedText.substring(0, 30)}"`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });
      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText.trim());
      return res.json({ success: true, ...parsed });
    } else {
      // Offline high-fidelity fallback if Gemini is not available
      console.log(`Simulating offline voice assistant for: "${sanitizedText.substring(0, 30)}"`);
      const lower = sanitizedText.toLowerCase();
      let inputLanguage = "English";
      let translatedText = "¿Dónde está el ascensor de accesibilidad?";
      let resText = "Elevator Orange (Sector B, near Section B14) is transitioned to priority-access. Ramps are 20m straight ahead.";
      let translatedResponse = "El ascensor naranja (Sector B, cerca de la Sección B14) ha cambiado a acceso prioritario. Las rampas están a 20 metros directo hacia adelante.";

      if (lower.includes("elevator") || lower.includes("wheelchair") || lower.includes("accessibility") || lower.includes("ascensor")) {
        inputLanguage = lower.includes("ascensor") || lower.includes("donde") ? "Spanish" : "English";
        translatedText = inputLanguage === "Spanish" ? "Where is the elevator?" : "¿Dónde está el ascensor?";
        resText = "Elevator Orange (Sector B, near Section B14) is transitioned to priority-access. Ramps are 20m straight ahead.";
        translatedResponse = "El ascensor naranja (Sector B, cerca de la Sección B14) está en acceso de prioridad. Las rampas están a 20m al frente.";
      } else if (lower.includes("bathroom") || lower.includes("toilet") || lower.includes("restroom") || lower.includes("baño")) {
        inputLanguage = lower.includes("baño") ? "Spanish" : "English";
        translatedText = inputLanguage === "Spanish" ? "Where are the restrooms?" : "¿Dónde están los baños?";
        resText = "The West Concourse Bathroom has a 1-minute wait. The East Concourse Bathroom has a 9-minute wait.";
        translatedResponse = "El baño del West Concourse tiene 1 minuto de espera. El baño del East Concourse tiene 9 minutos de espera.";
      } else if (lower.includes("food") || lower.includes("grill") || lower.includes("eat") || lower.includes("comida")) {
        inputLanguage = lower.includes("comida") ? "Spanish" : "English";
        translatedText = inputLanguage === "Spanish" ? "Where is the food?" : "¿Dónde puedo comer?";
        resText = "North Concession Grill is open but currently has a 12-minute wait time.";
        translatedResponse = "El North Concession Grill está abierto pero tiene un tiempo de espera de 12 minutos.";
      } else if (lower.includes("gate") || lower.includes("puerta") || lower.includes("entrada")) {
        inputLanguage = lower.includes("puerta") || lower.includes("entrada") ? "Spanish" : "English";
        translatedText = inputLanguage === "Spanish" ? "What's with Gate B?" : "¿Qué pasa con la Puerta B?";
        resText = "Gate B is congested with a 38-minute wait. Please use Gate C (West Plaza) which has a 4-minute wait.";
        translatedResponse = "La Puerta B está congestionada con 38 minutos de espera. Use la Puerta C (West Plaza) que tiene 4 minutos.";
      } else {
        inputLanguage = "English";
        translatedText = `Traducción: "${sanitizedText}"`;
        resText = `Aegis received: "${sanitizedText}". All facilities are running nominally under safety threshold.`;
        translatedResponse = `Aegis recibió: "${sanitizedText}". Todas las instalaciones funcionan nominalmente bajo el umbral de seguridad.`;
      }

      return res.json({
        success: true,
        inputLanguage,
        transcribedText: sanitizedText,
        translatedText,
        response: resText,
        translatedResponse
      });
    }
  } catch (error) {
    console.error("Voice assistant backend error:", error);
    return res.status(500).json({ error: "Failed to process voice assistant query" });
  }
});

// Advanced Collaborative Multi-Agent Scenario Predictor (Planning -> Execution -> Critic)
app.post("/api/predict-scenario", csrfGuard, apiLimiter, async (req, res) => {
  const { scenarioName, scenarioDescription, operator } = req.body;

  if (!scenarioName) {
    return res.status(400).json({ error: "Missing scenarioName parameter" });
  }

  // Validate parameter shapes and lengths
  if (typeof scenarioName !== "string" || scenarioName.length > 100) {
    return res.status(400).json({ error: "Invalid scenarioName format or length" });
  }
  if (scenarioDescription && (typeof scenarioDescription !== "string" || scenarioDescription.length > 500)) {
    return res.status(400).json({ error: "Invalid scenarioDescription format or length" });
  }
  if (operator && typeof operator === "string") {
    const operatorGuard = runInputGuardrails(operator);
    if (!operatorGuard.passed) {
      return res.status(400).json({ error: "Operator validation failed: " + operatorGuard.reason });
    }
  }

  const activeOperator = operator || "Operations Supervisor";

  // Run security and safety input guardrails for scenario name
  const nameGuardrail = runInputGuardrails(scenarioName);
  if (!nameGuardrail.passed) {
    logAuditAction(activeOperator, "PREDICT_SCENARIO_FAIL", `Scenario name failed safety guardrails: "${scenarioName}"`);
    return res.json({
      success: false,
      scenarioName: scenarioName,
      planning: `⚠️ **AegisAI Guardrails Alert (Scenario Name):** ${nameGuardrail.reason}`,
      execution: "Execution halted due to security guardrail alert.",
      critic: "Review and adjustments aborted.",
      stadiumState: stadiumState
    });
  }
  const sanitizedName = nameGuardrail.sanitizedMessage;

  logAuditAction(activeOperator, "PREDICT_SCENARIO", `Initiated critical Multi-Agent simulation for scenario: "${sanitizedName}"`);

  // Run security and safety input guardrails for scenario description
  if (scenarioDescription) {
    const descGuardrail = runInputGuardrails(scenarioDescription);
    if (!descGuardrail.passed) {
      return res.json({
        success: false,
        scenarioName: sanitizedName,
        planning: `⚠️ **AegisAI Guardrails Alert (Scenario Description):** ${descGuardrail.reason}`,
        execution: "Execution halted due to security guardrail alert.",
        critic: "Review and adjustments aborted.",
        stadiumState: stadiumState
      });
    }
  }
  const sanitizedDesc = scenarioDescription ? runInputGuardrails(scenarioDescription).sanitizedMessage : "";

  const promptText = `
We are testing the FIFA World Cup 2026 Smart Stadium OS ("AegisAI StadiumOS").
Analyze and resolve this simulated crisis scenario:
Scenario Name: "${sanitizedName}"
Description: "${sanitizedDesc}"

You must collaborate through 3 virtual agents:
1. **Planning Agent**: Breaks down the critical situation into steps and delegates to specific stadium operations agents (e.g. Emergency AI, Crowd Intel, Sustainability).
2. **Specialist Agents Response**: Draft concrete actions taken by the relevant agents.
3. **Critic/Reflection Agent**: Reviews safety, feasibility, and accessibility requirements, ensuring the plans comply with professional FIFA safety guidelines.

Provide the response in structured JSON with these exact properties:
{
  "planning": "The plan formulated...",
  "execution": "The joint actions taken by specialized agents...",
  "critic": "The review and adjustments made by the critic agent...",
  "newIncidents": [
    {
      "type": "medical | security | traffic | operations | resource",
      "location": "location string",
      "title": "title string",
      "severity": "low | medium | high | critical",
      "description": "incident detail",
      "recommendedAction": "immediate recommendation"
    }
  ]
}
`;

  try {
    if (ai) {
      console.log(`Formulating Multi-Agent collaborative solution for scenario: ${sanitizedName}`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());

      // Insert the new simulated incident into the global stadium state to show live dashboard reactivity!
      if (result.newIncidents && Array.isArray(result.newIncidents) && result.newIncidents.length > 0) {
        result.newIncidents.forEach((inc: any, index: number) => {
          const freshIncident: Incident = {
            id: `inc-dyn-${Date.now()}-${index}`,
            type: inc.type || "operations",
            location: inc.location || "Arena Perimeter",
            title: inc.title || "Dynamic AI Alert",
            severity: inc.severity || "high",
            description: inc.description || "Generated from scenario.",
            status: "active",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            recommendedAction: inc.recommendedAction || "Monitor and resolve in command center.",
            assignedAgent: inc.type === 'medical' ? 'emergency' : (inc.type === 'security' ? 'emergency' : 'operations')
          };
          stadiumState.activeIncidents.unshift(freshIncident);
        });
        
        // Dynamically shift metrics based on simulation severity
        stadiumState.crowdDensity = Math.min(95, stadiumState.crowdDensity + 10);
        stadiumState.safetyIndex = Math.max(70, stadiumState.safetyIndex - 8);
      }

      return res.json({
        success: true,
        scenarioName: sanitizedName,
        planning: result.planning || "Formulating triage paths...",
        execution: result.execution || "Initiating active agent directives...",
        critic: result.critic || "Evaluating compliance standards...",
        stadiumState
      });
    } else {
      // High-quality mock response if Gemini API key is offline
      const mockResult = {
        planning: `[Planning Agent Blueprint]: Scenario "${sanitizedName}" triggers immediate Level 3 Operations protocol. 
1. Dispatch Crowd Intelligence to monitor Gate overflow.
2. Direct emergency medical responders to establish perimeter standby.
3. Inform Accessibility officer to verify barrier-free evacuation gates.`,
        execution: `[Collaborative Execution Summary]:
- **Crowd Intelligence**: Initiated automated fan re-routing via companion app pushes, resulting in a 25% traffic diversion to West gate within 4 minutes.
- **Emergency AI**: Calculated the shortest hazard-free ingress corridor for support units, shaving 90 seconds off the standard medical dispatch time.
- **Sustainability AI**: Shed non-essential facility lighting to conserve power reserves for supplementary medical systems.`,
        critic: `[Critic Review & Safety Reflection]: The primary evacuation plan conforms with FIFA Stadium Safety Regulation Article 14. 
- Ensure high-density visual translation is active on the displays.
- Confirm elevator standby systems are prioritized for mobility-restricted spectators.`,
        newIncidents: [
          {
            type: "operations",
            location: "Main Ingress Boulevard",
            title: "Simulated Scenario Surge",
            severity: "high",
            description: `Active response testing under scenario "${sanitizedName}". High density bottlenecks detected.`,
            recommendedAction: "Reroute oncoming pedestrian flows immediately."
          }
        ]
      };

      // Add to global state
      const freshIncident: Incident = {
        id: `inc-dyn-${Date.now()}`,
        type: "operations",
        location: "Main Plaza",
        title: `Simulated: ${sanitizedName}`,
        severity: "high",
        description: `Active crisis simulation testing: "${sanitizedDesc}"`,
        status: "active",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedAction: "Activate secondary volunteer crowd control corridors.",
        assignedAgent: "crowd"
      };
      
      stadiumState.activeIncidents.unshift(freshIncident);
      stadiumState.crowdDensity = Math.min(95, stadiumState.crowdDensity + 12);
      stadiumState.safetyIndex = Math.max(75, stadiumState.safetyIndex - 10);

      return res.json({
        success: true,
        scenarioName: sanitizedName,
        planning: mockResult.planning,
        execution: mockResult.execution,
        critic: mockResult.critic,
        stadiumState
      });
    }
  } catch (error: any) {
    console.error("Scenario simulation failed:", error);
    res.status(500).json({ error: "Scenario simulation failed", details: error.message });
  }
});

// Grounded FIFA Playbook SOP Database for RAG
const PLAYBOOK_MANUAL = [
  {
    article: "Article 4.1: High Crowd Concentration & Gate Bottlenecks",
    content: "When crowd density at any gate exceeds 80% design capacity or queue wait-times exceed 30 minutes, operators must immediately: 1. Push dynamic rerouting alerts to fans within 500 meters via the companion app; 2. Open auxiliary turnstiles and activate overflow queue corrals; 3. Divert incoming intermodal traffic to secondary gates."
  },
  {
    article: "Article 7.3: Thermal Management & Heat Stress Mitigation",
    content: "At external ambient temperatures exceeding 35°C (95°F) or solar heat-index extremes, the Operations Command must deploy active Volunteer Hydration Squads. Squads must be dispatched directly to solar-exposed seating (Sectors B14-B18, East Concourse). Priority cooling shelters, water-station locations, and wheelchair accessibility guides must be highlighted on stadium navigation boards."
  },
  {
    article: "Article 9.2: Smart Grid MEP & Peak Power Shedding",
    content: "Under localized electrical transformer stress or grid voltage instability, operations managers are authorized to trigger MEP Peak Power Shedding. Protocols include: 1. Dimming non-essential concourse architectural lighting by up to 60%; 2. De-energizing peripheral marketing/concession digital screens; 3. Discharging integrated battery backup arrays to support medical center HVAC."
  },
  {
    article: "Article 12.5: Medical Incident Evacuation & Response Corridors",
    content: "Priority medical emergencies require dispatching a first-aid crew with an target arrival under 3 minutes. Personnel routes must leverage dedicated emergency corridors (e.g., Corridor 4 near Sector B) and high-priority transit elevators (Elevator Orange/Green). Command centers must coordinate with regional 911 dispatch and clear vehicle ingress loops."
  },
  {
    article: "Article 15.1: Regional Transport Disruptions",
    content: "If metropolitan light-rail or regional rail transit experiences delays within 1 hour of match egress, operators must: 1. Coordinate with rideshare platforms to expand geofenced pickup capacity in Zone Silver; 2. Increase loop shuttle frequencies to 5-minute headways; 3. Display delay warnings on stadium screens, prompting fans to remain for post-match entertainment to stagger exit demand."
  }
];

// Playbook RAG search and AI grounding endpoint
app.post("/api/playbook-rag", csrfGuard, apiLimiter, async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  const guardrail = runInputGuardrails(query);
  if (!guardrail.passed) {
    return res.json({
      success: false,
      answer: `⚠️ **AegisAI Guardrails Alert:** ${guardrail.reason}`,
      retrievedSources: []
    });
  }
  const sanitizedQuery = guardrail.sanitizedMessage;

  // Retrieve matching articles from our new centralized RAG engine
  const topArticles = retrievePlaybookArticles(sanitizedQuery, 2);
  const contextBlock = generateContextBlock(topArticles);

  const promptText = `
You are the AegisAI Grounded RAG playbooks officer.
You are helping a stadium operations manager answer a critical query.

Grounding Context from FIFA 2026 Stadium Operations Manual:
${contextBlock}

User Question: "${sanitizedQuery}"

Please provide a highly professional, operational, exact answer.
You must:
1. Refer directly to the specific Article number(s) in the context if they are relevant.
2. Formulate 3 distinct operational steps based on the grounded protocol.
3. Keep the tone concise, expert, and command-focused.
4. Output in clean markdown.
`;

  try {
    if (ai) {
      console.log(`Querying Gemini RAG (gemini-3.5-flash) for Playbook inquiry: "${sanitizedQuery}"`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          temperature: 0.2,
          systemInstruction: "You are the Aegis Grounded Playbooks Officer. You only provide responses directly grounded in the official stadium manual and SOP codes."
        }
      });

      return res.json({
        success: true,
        answer: response.text || "No grounded resolution compiled.",
        retrievedSources: topArticles.map(a => a.article)
      });
    } else {
      // High-fidelity local grounding answer when Gemini is offline
      const bestMatch = topArticles[0];
      const matchText = bestMatch.score > 0 
        ? `Based on **${bestMatch.article}**, the following procedure is activated:\n\n1. **Acknowledge and Alert**: Trigger localized operations response for "${sanitizedQuery}".\n2. **Protocol Alignment**: Follow rule guidelines which dictate: "${bestMatch.content}"\n3. **Staff Coordination**: Dispatch specialized team agents (Volunteer, Emergency, Transit) via the command hub.`
        : `Based on standard **stadium operations playbooks**, here is the grounded resolution:\n\n1. **Deploy Perimeter Security**: Secure affected sectors immediately.\n2. **Reroute Channels**: Direct fans to low-congestion gates (Gate C).\n3. **Telemetry Validation**: Monitor the Live Digital Twin for immediate flow changes.`;

      return res.json({
        success: true,
        answer: `${matchText}\n\n*(Aegis RAG running in local semantic offline mode. Retrieving matching manual articles based on keyword score. Real-time reasoning grounded by Gemini 3.5 requires GEMINI_API_KEY)*`,
        retrievedSources: topArticles.map(a => a.article)
      });
    }
  } catch (err: any) {
    console.error("RAG endpoint failed:", err);
    res.status(500).json({ error: "RAG lookup failed", details: err.message });
  }
});

// Reset simulation state
app.post("/api/reset-state", csrfGuard, apiLimiter, (req, res) => {
  logAuditAction("SYSTEM", "RESET_STATE", "Stadium metrics and active incident logs recalibrated to base parameters.");
  stadiumState = {
    stadiumName: "AT&T Stadium (Arlington, Texas) — FIFA 2026 Semifinal",
    attendanceCount: 78450,
    capacityLimit: 80000,
    crowdDensity: 78,
    safetyIndex: 98,
    sustainabilityScore: 84,
    gateStatuses: [
      { id: "A", name: "Gate A (North Entrance)", flowRate: 110, waitTime: 18, status: 'normal', capacity: 200 },
      { id: "B", name: "Gate B (East Plaza Plaza Gate)", flowRate: 45, waitTime: 38, status: 'congested', capacity: 150 },
      { id: "C", name: "Gate C (West Plaza Entrance)", flowRate: 165, waitTime: 8, status: 'normal', capacity: 220 },
      { id: "D", name: "Gate D (South VIP Entry)", flowRate: 30, waitTime: 4, status: 'normal', capacity: 80 }
    ],
    facilityStatuses: [
      { id: "wc_east", name: "Restroom - East Concourse", type: 'restroom', occupancy: 92, status: 'crowded', waitLabel: "9 mins" },
      { id: "wc_west", name: "Restroom - West Concourse", type: 'restroom', occupancy: 35, status: 'normal', waitLabel: "1 min" },
      { id: "food_north", name: "Food Court - North Wing", type: 'food', occupancy: 85, status: 'crowded', waitLabel: "12 mins" },
      { id: "food_south", name: "Food Court - South Deck", type: 'food', occupancy: 42, status: 'normal', waitLabel: "3 mins" },
      { id: "med_plaza", name: "Emergency Medical Center B", type: 'medical', occupancy: 60, status: 'normal', waitLabel: "Available" },
      { id: "park_gold", name: "Parking Deck - Gold Zone", type: 'parking', occupancy: 98, status: 'full', waitLabel: "Full" },
      { id: "park_silver", name: "Parking Deck - Silver Zone", type: 'parking', occupancy: 74, status: 'normal', waitLabel: "Spaces Left" }
    ],
    resourceUsage: {
      electricityKwh: 1680,
      electricitySavingPct: 14,
      waterLiters: 145000,
      waterSavingPct: 9,
      wasteTons: 16.8,
      carbonFootprintKg: 2850
    },
    transportStatus: {
      metroLineStatus: "Retractable roof closed. Supp. shuttle buses active to Dallas/Fort Worth Transit lanes.",
      shuttleFrequencyMins: 6,
      rideShareWaitMins: 18,
      parkingOccupancyPct: 96,
      congestionIndex: 74
    },
    activeIncidents: [
      {
        id: "inc-1",
        type: "medical",
        location: "Sector B14 - East Upper Deck (Sun Exposed Glazing)",
        title: "Solar Heat Dehydration",
        severity: "medium",
        description: "A spectator is suffering from thermal heat fatigue and acute dehydration. External temperature is 39°C (102°F). High thermal load near glazed perimeter panels is elevating the local wet-bulb temperature. Retractable roof closed with AC active.",
        status: "active",
        timestamp: "13:40",
        recommendedAction: "Dispatch Volunteer Hydration Team to Sector B14 with electrolyte pouches and cooling wraps; assess for medical escalation.",
        assignedAgent: "volunteer"
      },
      {
        id: "inc-2",
        type: "operations",
        location: "Gate B (East Plaza Entry Turnstiles)",
        title: "Turnstile Verification Outage",
        severity: "high",
        description: "4 out of 10 ticket validation scanners at Gate B lost wireless connection. High arrival volume of Spanish and French-speaking spectators is creating immediate bottlenecks. Wait times are peaking at 38 minutes.",
        status: "active",
        timestamp: "13:35",
        recommendedAction: "Deploy multilingual volunteer guides to redirect flows; initiate local offline-caching validation protocol; send technicians to check Gate B switch.",
        assignedAgent: "operations"
      }
    ]
  };
  res.json(stadiumState);
});


// Vite middleware / client SPA static router configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
