# AegisAI StadiumOS — AI Agents & Tools Documentation

This document describes the cognitive layer of **AegisAI StadiumOS**: individual agent roles, their operational capabilities, system-prompt guidelines, and the formalized tool-calling schemas.

---

## 1. Agent Inventory & Capabilities

AegisAI StadiumOS features a modular network of **9 specialized operational agents** designed to collaborate on-demand. The three primary agents coordinating active stadium events are:

| Agent Identifier | Role Name | Primary Objective | Key Capabilities |
| :--- | :--- | :--- | :--- |
| `fan` | **Aegis Fan Companion** | Guide spectators and improve fan experiences. | - Turns/Gate wait times<br>- Navigation routes<br>- Accessibility/ADA elevator guides |
| `crowd` | **Aegis Crowd Intelligence** | Monitor spectator density and rebalance queues. | - Gate bottleneck detection<br>- Fan-group segregation guides<br>- Diversion routing triggers |
| `command` | **Command Center Orchestrator** | High-stakes event routing and multi-agent sync. | - Multi-issue triage coordination<br>- Grounded RAG manual searches<br>- Safety rule audits |

The 6 auxiliary infrastructural agents are:
- `operations` (Smart grid, rest-stops, concession levels, HVAC power loads)
- `emergency` (High-priority medical corridors, fire evacuations, police sync)
- `volunteer` (Translation assistant, staff rosters, onboarding FAQ)
- `accessibility` (Neurodiverse quiet spaces, priority lift paths, assistive translation)
- `sustainability` (Carbon scores, solar tracking, waste recyclables, leftovers prediction)
- `transport` (Metro schedules, shuttle lines, rideshare queues, highway alerts)

---

## 2. Centralized Prompt Manager

All system prompts are centralized inside `/src/lib/ai/prompts.ts` to keep the codebase modular, clean, and easily hot-swappable. 

Example snippet for `fan` agent:
> *"You are the Fan Mobile Companion Agent for AT&T Stadium (Arlington, Texas) during the intense FIFA World Cup 2026 Semifinal between France and Spain. Guide spectators with real-time turnstile wait-times, accessibility paths, and parking. Because temperatures outside are 39°C (102°F) and the retractable roof is closed, direct fans to indoor hydration zones and cooling corridors..."*

---

## 3. Tool-Calling Schema Registry

Agents communicate with the physical stadium telemetry using 7 core tools declared inside `/src/lib/ai/tools.ts` and executed inside `server.ts`'s `executeToolLocal` method.

### A. Gate Telemetry Status (`get_gate_status`)
- **Description:** Queries live wait times, entry flow rates, and scanner statuses.
- **Parameters:**
  ```json
  {
    "gateId": { "type": "string", "description": "Gate letter ID (A, B, C, D)" }
  }
  ```

### B. Facility Status Tracker (`get_facility_status`)
- **Description:** Checks bathroom queues, concession stocks, and medical zone occupancy.
- **Parameters:**
  ```json
  {
    "facilityId": { "type": "string", "description": "e.g., wc_east, wc_west, food_north, food_south" }
  }
  ```

### C. Zone Occupancy Density (`get_zone_occupancy`)
- **Description:** Returns crowd percentages and bottleneck hazard alerts.
- **Parameters:**
  ```json
  {
    "zoneId": { "type": "string", "description": "Zone name (North, East, South, West)" }
  }
  ```

### D. Rerouting Control Trigger (`trigger_rerouting_protocol`)
- **Description:** Shuts turnstiles and triggers directional routing arrows inside the fan app.
- **Parameters:**
  ```json
  {
    "fromGate": { "type": "string" },
    "toGate": { "type": "string" }
  }
  ```

### E. Grounded Manual Search (`search_playbook_sop`)
- **Description:** Searches the official FIFA Stadium Operations Manual for step-by-step guidelines.
- **Parameters:**
  ```json
  {
    "query": { "type": "string", "description": "Search phrase (e.g., 'heat index', 'scanner failure')" }
  }
  ```

---

## 4. Grounded RAG Search Flow

When an agent requests playbook information or a user searches via `/api/playbook-rag`:
1. **Keyword Scoring:** Query words are cross-referenced with `PLAYBOOK_MANUAL_DB` to compute phrase relevance.
2. **Citation Injector:** The top matching articles are compiled with formal tags.
3. **Response Rendering:** The system merges the source text with the agent instructions, prompting the model to answer *strictly* grounded in the manual references.
