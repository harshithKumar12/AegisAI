# AegisAI StadiumOS — Core System Architecture & Design
*AegisAI Stadium Operating System (AegisAI StadiumOS)*

AegisAI StadiumOS is a high-performance, full-stack, multi-agent smart stadium management platform built explicitly for high-density public venues. This document outlines the structural blocks, data loops, and architectural choices governing the deployment.

---

## 1. High-Level Architectural Diagram

```text
       ┌────────────────────────────────────────────────────────┐
       │                 CLIENT BROWSER (Vite + React)          │
       │                                                        │
       │  ┌──────────────────────┐    ┌──────────────────────┐  │
       │  │  Interactive SVG Map │◄───┼─ Real-time Telemetry │  │
       │  │    (Digital Twin)    │    │   (Local State Tick) │  │
       │  └──────────┬───────────┘    └──────────────────────┘  │
       │             │                                          │
       │             ▼                                          │
       │  ┌──────────────────────┐    ┌──────────────────────┐  │
       │  │ Agent Chat Interfaces│───►│ Firebase Supervisor  │  │
       │  │ (Fan / Coord / Ops)  │    │     Auth / Sign-In   │  │
       │  └──────────┬───────────┘    └──────────────────────┘  │
       └─────────────┼──────────────────────────────────────────┘
                     │ HTTPS / API Requests (JSON)
                     ▼
       ┌────────────────────────────────────────────────────────┐
       │                 BACKEND SERVER (Node.js + Express)     │
       │                                                        │
       │  ┌──────────────────────┐    ┌──────────────────────┐  │
       │  │   API Proxy Router   │───►│   Input Guardrails   │  │
       │  │   (/api/chat-agent)  │    │   (Sanitize / Block) │  │
       │  └──────────┬───────────┘    └──────────────────────┘  │
       │             │                                          │
       │             ▼                                          │
       │  ┌──────────────────────┐    ┌──────────────────────┐  │
       │  │  Google GenAI SDK    │───►│  Local Tool Registry │  │
       │  │  (gemini-3.5-flash)  │◄───│  (executeToolLocal)  │  │
       │  └──────────┬───────────┘    └──────────────────────┘  │
       │             │                                          │
       │             ▼                                          │
       │  ┌──────────────────────┐    ┌──────────────────────┐  │
       │  │ In-Memory RAG Engine │───►│  Grounded playbooks  │  │
       │  │  (Score & Citation)  │    │     (SOP manual)     │  │
       │  └──────────────────────┘    └──────────────────────┘  │
       └────────────────────────────────────────────────────────┘
```

---

## 2. Component Design & Responsibilities

### A. Core Telemetry Simulation (The Live State Loop)
Stadium parameters (such as turnstile queue rates, crowd density, water liters, and electricity demand) mutate on a continuous **3500ms server-side setInterval interval** managed inside `server.ts`. 
- **Flushing and Flux:** Real-time metrics surge slightly and gate wait-times fluctuate based on current congestion modifiers.
- **Immutable Updates:** Rather than mutating objects in-place, state is returned as a fresh state copy via `mutateStadiumState(state)` to avoid concurrency issues during concurrent requests.

### B. Cognitive Multi-Agent Orchestration
We configure 9 specialized agents in the companion panel. To avoid hardcoding, prompts and capabilities are decoupled:
1. **Prompt Manager (`/src/lib/ai/prompts.ts`):** Holds centralized string instructions for all roles, including specific situational context (e.g., thermal thresholds, rematch team details).
2. **Tool-Calling Schema Registry (`/src/lib/ai/tools.ts`):** Formalizes function schemas used by Gemini, mapping directly to functional executions inside `executeToolLocal` in `server.ts`.
3. **Safety Guardrails (`/src/lib/ai/guardrails.ts`):** Intercepts messages, sanitizing forbidden keywords or off-topic queries prior to server dispatch, preventing injection attempts or PII leaks.

### C. Grounded RAG Manual Search (`/src/lib/ai/rag.ts`)
The playbook search engine indexes ~15 critical articles of the official FIFA Stadium manual.
- **Token/Keyword Retrieval:** Computes a phrase-overlap and keyword density score to pick the top 2 articles as context.
- **Explicit Citation Generation:** Automatically attaches precise section, article, and page number annotations (e.g., `[FIFA Stadium Manual 2026, Section 7. Environmental Safety, Article 7.3, p. 24]`) so that operators can review official SOP protocols before authorizing overrides.

---

## 3. Technology Stack Choice

- **Frontend:** React 18, Vite (Asset compiler), Tailwind CSS (Aesthetic styling), Lucide React (Visual icons), Framer Motion (State-change animations).
- **Backend:** Node.js, Express (API routes and static hosting), Google GenAI SDK (Modern Gemini API interfaces).
- **Security & DB:** Firebase Auth (Secure coordinate logins), Firestore (Persistent schemas for User and Incident tables), `firestore.rules` (Strict Attribute-Based Access Control).
- **Testing:** Vitest (Fast unit testing), Playwright (Complete end-to-end integration flows).
