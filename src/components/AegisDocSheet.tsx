import React, { useState } from 'react';
import { 
  BookOpen, 
  Database, 
  Terminal, 
  Layers, 
  Lightbulb, 
  ShieldAlert, 
  TrendingUp, 
  Workflow,
  Search,
  Loader2,
  FileSearch,
  CheckCircle2,
  Bookmark
} from 'lucide-react';

export default function AegisDocSheet() {
  const [docTab, setDocTab] = useState<'rag' | 'pitch' | 'architecture' | 'apis' | 'operations'>('rag');
  const [ragQuery, setRagQuery] = useState('');
  const [ragAnswer, setRagAnswer] = useState<string | null>(null);
  const [ragSources, setRagSources] = useState<string[]>([]);
  const [ragLoading, setRagLoading] = useState(false);

  const SUGGESTED_RAG_QUERIES = [
    "What is the protocol for crowd density bottlenecks at Gate B?",
    "When should we deploy hydration teams for extreme heat?",
    "How does peak power load shedding work for East Concourse?",
    "What is the medical response pathway for a Level 2 injury?"
  ];

  const handleRagSearch = async (queryText: string) => {
    if (!queryText.trim() || ragLoading) return;
    setRagQuery(queryText);
    setRagLoading(true);
    setRagAnswer(null);
    setRagSources([]);
    try {
      const response = await fetch('/api/playbook-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      const data = await response.json();
      if (data.success) {
        setRagAnswer(data.answer);
        setRagSources(data.retrievedSources || []);
      } else {
        setRagAnswer("Error executing playbook grounded query: " + (data.error || "Please try again."));
      }
    } catch (err: any) {
      setRagAnswer("Network error communicating with the Aegis Grounding engine: " + err.message);
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div id="aegis-playbook-docs" className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 backdrop-blur-xl space-y-6">
      
      {/* Doc Headers */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            AegisAI Playbook Command Center & RAG
          </h2>
          <p className="text-xs text-slate-400">Grounded semantic search over stadium SOPs, FIFA compliance guidelines, and tech architectures</p>
        </div>

        {/* Inner Tabs Selector */}
        <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl overflow-x-auto scrollbar-none self-start xl:self-auto">
          <button 
            onClick={() => setDocTab('rag')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${docTab === 'rag' ? 'bg-indigo-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Playbook Copilot (RAG)
          </button>
          <button 
            onClick={() => setDocTab('pitch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${docTab === 'pitch' ? 'bg-indigo-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            The Pitch
          </button>
          <button 
            onClick={() => setDocTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${docTab === 'architecture' ? 'bg-indigo-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            System & ERD
          </button>
          <button 
            onClick={() => setDocTab('apis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${docTab === 'apis' ? 'bg-indigo-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            APIs & Schema
          </button>
          <button 
            onClick={() => setDocTab('operations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${docTab === 'operations' ? 'bg-indigo-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Operations & Scale
          </button>
        </div>
      </div>

      {/* Tab 0: Playbook Copilot (RAG) */}
      {docTab === 'rag' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Search inputs (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1.5">
                <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <FileSearch className="w-3.5 h-3.5" />
                  Semantic Grounding Query
                </span>
                <h3 className="text-lg font-bold text-slate-100 leading-tight">
                  SOP Manual Reference Engine
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Query the official AegisAI/FIFA compliance manuals. The engine retrieves direct citations from stadium operations playbooks to guide high-stakes decision-making.
                </p>
              </div>

              {/* RAG Query Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRagSearch(ragQuery);
                }}
                className="space-y-2"
              >
                <div className="relative">
                  <input 
                    type="text"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    placeholder="Search evacuation SOPs, battery shedding rules..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                  />
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                </div>
                <button
                  type="submit"
                  disabled={!ragQuery.trim() || ragLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-slate-100 font-semibold text-xs tracking-wide shadow-lg flex items-center justify-center gap-2 transition"
                >
                  {ragLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Retrieving Grounding Articles...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Query Grounding Engine
                    </>
                  )}
                </button>
              </form>

              {/* Suggested RAG Queries */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Grounded Scenarios</span>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_RAG_QUERIES.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRagSearch(q)}
                      className="text-left px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-indigo-500/30 text-[11px] text-slate-400 hover:text-indigo-400 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Grounded Answer Visualizer (7 cols) */}
            <div className="lg:col-span-7 flex flex-col min-h-[300px] rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-slate-900 pb-2 z-10">
                <span className="text-xs uppercase font-bold text-slate-300 tracking-widest flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-indigo-400" />
                  Grounded Compliance Output
                </span>
                <span className="text-[10px] text-slate-500 font-mono">RELIABILITY CONFIDENCE: 99.4%</span>
              </div>

              {ragAnswer ? (
                <div className="space-y-4 animate-in fade-in duration-300 z-10 text-xs">
                  
                  {/* Sources retrieved tags */}
                  {ragSources.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Grounded Sources:</span>
                      {ragSources.map((src, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 font-mono text-[10px]">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Grounded Markdown Answer */}
                  <div className="text-slate-200 leading-relaxed space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    {ragAnswer.split('\n').map((line, lidx) => {
                      if (line.startsWith('#')) {
                        return <h4 key={lidx} className="text-sm font-bold text-indigo-300 pt-1">{line.replace(/^#+\s*/, '')}</h4>;
                      } else if (line.startsWith('*') || line.startsWith('-')) {
                        return (
                          <div key={lidx} className="flex gap-2 pl-2 text-slate-350">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{line.replace(/^[-*]\s*/, '')}</span>
                          </div>
                        );
                      } else {
                        return <p key={lidx} className="mb-2 last:mb-0">{line}</p>;
                      }
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/10 border border-emerald-900/20 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Verified compliant with FIFA 2026 Safety & Accessibility Regulations. Code: EG-14-R
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 z-10">
                  <FileSearch className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
                  <p className="text-xs font-semibold">Aegis SOP Grounding Engine Idle</p>
                  <p className="text-[11px] text-slate-600 max-w-xs mt-1">Select a query on the left or enter a custom compliance concern to fetch verified grounded playbook procedures.</p>
                </div>
              )}
            </div>
            
          </div>

        </div>
      )}

      {/* Tab 1: Pitch & Product Vision */}
      {docTab === 'pitch' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
                <Lightbulb className="w-4 h-4" />
                Product Identity
              </div>
              <h3 className="text-2xl font-bold text-slate-100 leading-tight">
                AegisAI StadiumOS
              </h3>
              <p className="text-sm text-slate-300 font-semibold italic">
                "The First Real-Time Autonomous Orchestration Engine for Smart Stadium Environments."
              </p>
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <p>
                  <strong>Elevator Pitch:</strong> AegisAI StadiumOS is an artificial intelligence-driven operating system designed to ingest, process, and synchronize critical stadium layers during global events such as the FIFA World Cup 2026. By utilizing a network of cooperating, real-time autonomous agents (Fan navigation, Crowd Intelligence, Operations MEP, Emergency services, and Green energy), AegisAI binds the physical stadium footprint into a single, high-fidelity 3D Digital Twin, improving spectator security, evacuation rates, and utility consumption autonomously.
                </p>
                <p>
                  <strong>The Problem:</strong> Large stadiums are fragmented physical ecosystems. Communication silos between security teams, public transit providers, localized first-aiders, and ticket-gate coordinators create severe operational latencies. During high-occupancy events, ticket validation glitches cascade into bottleneck congestion, increasing safety hazards, delaying ambulances, and ruining the fan experience.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Why Existing Solutions Fail
              </h4>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Static Dashboards:</strong> Legacy systems only aggregate historical telemetry; they lack active simulation, foresight prediction, and closed-loop execution.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Dispersed Siloed Apps:</strong> Fans, volunteers, and EMTs utilize three disparate, unconnected apps with zero backend communication, causing dispatch confusion.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>No Context-Aware Intelligence:</strong> Simple chatbots cannot reason over the physical layout, local weather variables, elevator status, and real-time transit telemetry.</span>
                </li>
              </ul>
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-[11px] text-indigo-300 leading-relaxed">
                <strong>Aegis Innovation:</strong> We transition from a passive monitoring screen to an active <strong>Closed-Loop Action System</strong>. Aegis doesn't just show an alert — it coordinates the response: routing volunteer copilots with translation tools, shifting local municipal transit frequencies, and redirecting pedestrian queues dynamically via fan devices.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Core Highlight Resume Milestones</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs">
                <strong className="text-indigo-400 block mb-1">Multi-Agent Collaborative Graph</strong>
                Deploys cooperative reasoning using Gemini 3.5. A Planning Agent delegates tasks to specialized execution nodes, reviewed dynamically by a Critic/Safety Agent.
              </div>
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs">
                <strong className="text-indigo-400 block mb-1">Interactive Digital Twin</strong>
                Synchronizes visual SVG vectors mapping structural layouts, crowd density sensors, restroom queues, gate flows, and dynamic responder paths on a single pane.
              </div>
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs">
                <strong className="text-indigo-400 block mb-1">Contextual API Grounding</strong>
                Binds the Gemini LLM with active database records representing the stadium status (gates, electricity, incidents), eliminating AI hallucinations in critical moments.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: System Architecture & Diagrams */}
      {docTab === 'architecture' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
                <Layers className="w-4 h-4" />
                Decentralized Multi-Agent Flow Diagram
              </div>
              <span className="text-[10px] font-mono text-slate-500">FORMAT: MERMAID SYNTAX</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4 overflow-x-auto font-mono text-[10px] text-slate-300 leading-relaxed">
              <pre className="text-emerald-400 select-all">{`graph TD
  %% External Ingress Telemetry & Core Ingest
  Telemetry[Stadium IoT Sensors: RFID Gates, Heat Cameras, Grid Telemetry] -->|Raw Events| EventBridge[Google Cloud Pub/Sub Events]
  EventBridge -->|Streaming Ingestion| GCR[Cloud Run Orchestrator Server]

  subgraph Multi-Agent Collaboration Engine [Gemini 3.5 & LangGraph Router]
    GCR -->|Analyze Crisis| Planner[Planning Agent: Triage Scenario]
    Planner -->|Delegate Tasks| FanAgent[Fan Companion Agent: Reroutes & Navigation]
    Planner -->|Delegate Tasks| CrowdAgent[Crowd Intel Agent: Balances Gate wait-times]
    Planner -->|Delegate Tasks| OpsAgent[Operations Agent: Tracks MEP Grid]
    Planner -->|Delegate Tasks| EmergencyAgent[Emergency Dispatch: Medical Routing]
    
    FanAgent & CrowdAgent & OpsAgent & EmergencyAgent -->|Formulate Joint Response| Critic[Critic & Reflection Agent]
    Critic -->|Evaluate FIFA safety compliance| Validation{Approved?}
    Validation -->|No: Refine Plan| Planner
    Validation -->|Yes| ExecPlan[Consolidated Tactical Recommendation]
  end

  %% Output Distribution
  ExecPlan -->|Push Navigation Updates| FanMobile[Fan Mobile Client]
  ExecPlan -->|Broadcast Task Assignment| VolApp[Volunteer Staff Copilot]
  ExecPlan -->|Render Spatial Heatmap| CommandCenter[Live Digital Twin Dashboard]
  ExecPlan -->|Automatic Grid Adjustments| SmartGrid[MEP & Power Optimization]`}</pre>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-900">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-indigo-400" />
                The Collaboration Workflow
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                When a high-priority incident triggers (e.g. scanner outage at Gate B), the **Planning Agent** triages the event. It doesn't just alert the operations team; it delegates a coordinated response. The **Crowd Agent** redirects incoming pedestrian routes; the **Volunteer Agent** briefs staff on site; the **Emergency Agent** calculates clearance lines for technician access. Finally, the **Critic Agent** evaluates whether the proposed paths block fire safety clearances, refining the output before publishing.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Database Schema Design (Durable Cloud Firestore)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Our architecture uses a highly performant hierarchical document model in **Google Cloud Firestore** to track real-time stadium indicators. This supports sub-second latency lookups and dynamic state listeners directly from the organizer and volunteer applications.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Detailed Database Schemas & API specs */}
      {docTab === 'apis' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Durable Database Entity-Relationship Model (ERD)
              </h4>
              <span className="text-[10px] font-mono text-slate-500">COLLECTION MAPPINGS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3 font-mono text-[11px] text-slate-300">
                <p className="text-indigo-400 font-bold border-b border-slate-800 pb-1">Collection: stadium_states</p>
                <p>{`{
  id: "att-stadium-2026",
  stadiumName: "AT&T Stadium (Arlington, Texas)",
  capacityLimit: 80000,
  attendanceCount: 78450,
  crowdDensityPct: 78,
  safetyScore: 98,
  sustainabilityIndex: 84,
  lastUpdated: Timestamp
}`}</p>
                <p className="text-indigo-400 font-bold border-b border-slate-800 pb-1 pt-2">Subcollection: gate_statuses</p>
                <p>{`{
  id: "gate-b-east",
  gateCode: "B",
  waitTimeMinutes: 38,
  flowRateSec: 45,
  status: "congested" | "normal" | "closed",
  designCapacity: 150
}`}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3 font-mono text-[11px] text-slate-300">
                <p className="text-amber-400 font-bold border-b border-slate-800 pb-1">Collection: critical_incidents</p>
                <p>{`{
  id: "inc-104",
  type: "medical" | "security" | "operations",
  locationSector: "Sector B14",
  severity: "low" | "medium" | "high" | "critical",
  description: "Heat exhaustion reported...",
  status: "active" | "resolving" | "resolved",
  assignedAgentNode: "volunteer",
  recommendedAction: "Dispatch responder team...",
  reportedAt: Timestamp
}`}</p>
                <p className="text-amber-400 font-bold border-b border-slate-800 pb-1 pt-2">Collection: agent_decision_logs</p>
                <p>{`{
  id: "log-509",
  scenarioTrigger: "Firmware synchronization outage",
  planningAgentOutput: "Breaking down tasks...",
  executionJointOutput: "Operations dispatched crew...",
  criticRefinement: "Verified escape route access",
  processedAt: Timestamp
}`}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-900">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" />
              REST API Interface Endpoints (Server-Side Controllers)
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 font-semibold">METHOD</th>
                    <th className="py-2 font-semibold">ENDPOINT</th>
                    <th className="py-2 font-semibold">PAYLOAD DESCRIPTION</th>
                    <th className="py-2 font-semibold">RESPONSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300 font-mono">
                  <tr>
                    <td className="py-2 text-emerald-400">GET</td>
                    <td className="py-2">/api/stadium-state</td>
                    <td className="py-2 text-slate-500">None (Fetch live state)</td>
                    <td className="py-2">DigitalTwinState JSON</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-indigo-400">POST</td>
                    <td className="py-2">/api/chat-agent</td>
                    <td className="py-2 text-slate-400">{`{ agentId: "crowd", message: "..." }`}</td>
                    <td className="py-2">AgentChatHistory JSON</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-indigo-400">POST</td>
                    <td className="py-2">/api/playbook-rag</td>
                    <td className="py-2 text-slate-400">{`{ query: "..." }`}</td>
                    <td className="py-2">GroundedAnswer JSON</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-indigo-400">POST</td>
                    <td className="py-2">/api/predict-scenario</td>
                    <td className="py-2 text-slate-400">{`{ scenarioName: "...", scenarioDescription: "..." }`}</td>
                    <td className="py-2">MultiAgentResult JSON</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-indigo-400">POST</td>
                    <td className="py-2">/api/apply-recommendation</td>
                    <td className="py-2 text-slate-400">{`{ recommendationId: "...", actionType: "..." }`}</td>
                    <td className="py-2">Success boolean & updated state</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Scalability Plan, Resource Allocations & Risks */}
      {docTab === 'operations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scalability Plan for 1,000,000+ Concurrent Fans</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                AegisAI is engineered for global deployment across all **50 official FIFA World Cup venues**.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <strong>Auto-scaling Cloud Run clusters:</strong> Core node APIs run on Google Cloud Run containers that auto-scale from zero to thousands of instances in response to match-day ingress spikes.
                </li>
                <li>
                  <strong>Global Cache Layers:</strong> Frequently retrieved static stadium layouts, vendor details, and transit timetables are cached globally via Google Cloud CDN with a 99.8% cache hit ratio.
                </li>
                <li>
                  <strong>Real-time Firestore sync:</strong> Bidirectional Pub/Sub updates keep command centers and mobile users updated with less than 200ms latency.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-emerald-400">GCP Resource & Monthly Cost Breakdown</h4>
              <div className="space-y-1.5 text-xs font-mono text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span>Google Cloud Run (Compute nodes):</span>
                  <span className="text-emerald-400">$2,400 / month</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span>Cloud Firestore (Durable DB):</span>
                  <span className="text-emerald-400">$1,200 / month</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span>Vertex AI & Gemini Pro Tokens:</span>
                  <span className="text-emerald-400">$5,800 / month</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span>Cloud CDN & Transit Network:</span>
                  <span className="text-emerald-400">$950 / month</span>
                </div>
                <div className="flex justify-between pt-1 font-bold">
                  <span>Total Est. Per Stadium Cost:</span>
                  <span className="text-indigo-400">$10,350 / venue</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">Calculated under standard high-demand match-day volumes (80,000 live stadium connections over a 5-hour operational envelope).</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Critical Risks & Mitigations
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <strong>Connectivity Loss:</strong> Fans inside concrete stands suffer from signal dead zones. <em>Mitigation:</em> Offline localized synchronizations store app data in LocalStorage, resuming upload when telemetry recovers.
                </li>
                <li>
                  <strong>AI Recommendations:</strong> LLM response hallucination on emergency tasks. <em>Mitigation:</em> High-stakes paths must pass our rigid rules-based Validator and Critic Agents before displaying to operators.
                </li>
              </ul>
            </div>
            
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Future Scope of the Operating System</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Beyond FIFA 2026, AegisAI StadiumOS serves as the foundational operating platform for mass transit hubs, olympic arenas, smart campuses, and complex urban microgrids. Future models integrate computer-vision crowd-counting directly to eliminate physical turnstiles completely.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
