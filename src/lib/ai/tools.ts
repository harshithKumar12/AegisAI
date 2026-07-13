// AegisAI StadiumOS — Tool-Calling Schema Registry
// Formalizing the function schemas currently in use for local execution and model orchestration.

import { Type } from "@google/genai";

export const TOOLS_SCHEMA = [
  {
    functionDeclarations: [
      {
        name: "get_gate_status",
        description: "Retrieve real-time telemetry from stadium entrance gates, including flow rates, wait times, and congestion status.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            gateId: {
              type: Type.STRING,
              description: "The unique identifier of the gate, e.g., 'A', 'B', 'C', 'D'."
            }
          },
          required: ["gateId"]
        }
      },
      {
        name: "get_facility_status",
        description: "Query occupancy levels, queue wait descriptions, and operating status of restrooms, concession stands, parking zones, and medical facilities.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            facilityId: {
              type: Type.STRING,
              description: "The specific facility identifier, e.g., 'wc_east', 'wc_west', 'food_north', 'food_south'."
            }
          },
          required: ["facilityId"]
        }
      },
      {
        name: "get_accessibility_info",
        description: "Get real-time accessibility status, wheelchair ramp vectors, priority lift queues, and sensory-friendly stations for specific sectors.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            sector: {
              type: Type.STRING,
              description: "The targeted sector name, e.g., 'Sector North', 'Sector East', 'Sector South', 'Sector West'."
            }
          },
          required: ["sector"]
        }
      },
      {
        name: "get_zone_occupancy",
        description: "Retrieve dense crowd occupancy percentages and bottleneck alerts for specific stadium zones (North, East, South, West).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            zoneId: {
              type: Type.STRING,
              description: "The zone name: 'North', 'East', 'South', or 'West'."
            }
          },
          required: ["zoneId"]
        }
      },
      {
        name: "trigger_rerouting_protocol",
        description: "Propose an active crowd redistribution route, shifting traffic away from high-wait turnstiles to low-wait plazas.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            fromGate: {
              type: Type.STRING,
              description: "The congested source gate ID (e.g., 'B')."
            },
            toGate: {
              type: Type.STRING,
              description: "The recommended diversion target gate ID (e.g., 'C')."
            }
          },
          required: ["fromGate", "toGate"]
        }
      },
      {
        name: "get_active_incidents",
        description: "Check the master incident register for unresolved medical emergencies, safety events, or ticket scanner failures.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        }
      },
      {
        name: "search_playbook_sop",
        description: "Retrieve official grounded SOP guidelines from the FIFA Stadium Manual for emergencies, thermal stress, or light-rail transit delays.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "A query string focusing on the target issue (e.g., 'heat stress', 'scanner firmware', 'medical response corridor')."
            }
          },
          required: ["query"]
        }
      }
    ]
  }
];
