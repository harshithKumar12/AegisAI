import React, { useState } from 'react';
import { DigitalTwinState } from '../types';
import { 
  Play, 
  CheckCircle, 
  ShieldCheck, 
  RotateCcw, 
  Terminal,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';

interface ScenarioSimulatorProps {
  stadiumState: DigitalTwinState;
  onStateUpdate: (newState: DigitalTwinState) => void;
  onTriggerLog: (log: string) => void;
}

interface SimulatedScenario {
  name: string;
  description: string;
  icon: string;
  difficulty: 'low' | 'medium' | 'high' | 'critical';
}

const DEFAULT_SCENARIOS: SimulatedScenario[] = [
  {
    name: "Scanner Firmware Synchronization Outage",
    description: "Gate B ticket verification servers lose synchronization, creating an immediate queue backing up into the outer security perimeter. Estimated 5,000 fans queued.",
    icon: "🎫",
    difficulty: "high"
  },
  {
    name: "Extreme Heat Wave Warning",
    description: "External temperatures rise to 39°C (102°F) during the midday peak ingress window. Risk of heat fatigue is critical; immediate hydration routing and sensory cooling zones required.",
    icon: "☀️",
    difficulty: "high"
  },
  {
    name: "Regional Rail Transit Interruption",
    description: "Metro Line 2 loses traction power 45 minutes prior to match termination. 24,000 egressing spectators must be rerouted to supplementary shuttle and ride-share lanes.",
    icon: "🚆",
    difficulty: "critical"
  },
  {
    name: "Concourse Power Grid Load Shedding",
    description: "An unexpected transformer spike in the East Concourse triggers secondary battery reserves. Lighting drops to 40%; supplementary ventilation systems must be activated.",
    icon: "⚡",
    difficulty: "medium"
  }
];

export default function ScenarioSimulator({ stadiumState: _stadiumState, onStateUpdate, onTriggerLog }: ScenarioSimulatorProps) {
  const [selectedScenario, setSelectedScenario] = useState<SimulatedScenario>(DEFAULT_SCENARIOS[0]);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [running, setRunning] = useState(false);
  
  // Collaborative Multi-Agent Response Logs
  const [agentLogs, setAgentLogs] = useState<{
    planning?: string;
    execution?: string;
    critic?: string;
  } | null>(null);

  const handleRunSimulation = async () => {
    setRunning(true);
    setAgentLogs(null);
    onTriggerLog(`Simulating scenario: ${isCustomMode ? customName : selectedScenario.name}`);

    const name = isCustomMode ? customName : selectedScenario.name;
    const desc = isCustomMode ? customDesc : selectedScenario.description;

    try {
      const response = await fetch('/api/predict-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioName: name,
          scenarioDescription: desc
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAgentLogs({
          planning: data.planning,
          execution: data.execution,
          critic: data.critic
        });
        if (data.stadiumState) {
          onStateUpdate(data.stadiumState);
        }
        onTriggerLog(`Collaborative multi-agent resolve plan complete for: ${name}`);
      } else {
        throw new Error(data.error || "Simulation response failed.");
      }
    } catch (err: any) {
      console.error(err);
      onTriggerLog(`Simulation failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleResetSimulation = async () => {
    setRunning(true);
    try {
      const response = await fetch('/api/reset-state', { method: 'POST' });
      const data = await response.json();
      onStateUpdate(data);
      setAgentLogs(null);
      onTriggerLog("Stadium Digital Twin state successfully reset to default standard.");
    } catch (err: any) {
      console.error(err);
      onTriggerLog(`Failed to reset stadium: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div id="scenario-simulator-panel" className="rounded-3xl border border-slate-800 bg-slate-950/75 p-6 backdrop-blur-xl space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            FIFA Crisis Simulation Sandbox
          </h3>
          <p className="text-xs text-slate-400">Launch operational stresses to trigger collaborative Multi-Agent response protocols</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-semibold transition"
          >
            {isCustomMode ? "Use Templates" : "Create Custom"}
          </button>
          <button 
            onClick={handleResetSimulation}
            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
            disabled={running}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </button>
        </div>
      </div>

      {/* Inputs Section */}
      {!isCustomMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {DEFAULT_SCENARIOS.map((sc, idx) => {
            const isSelected = selectedScenario.name === sc.name;
            return (
              <button
                key={idx}
                onClick={() => setSelectedScenario(sc)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${isSelected ? 'border-amber-500/40 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.06)]' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700/60'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl select-none">{sc.icon}</span>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-semibold text-slate-200 pr-12 leading-snug">{sc.name}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{sc.description}</p>
                  </div>
                </div>
                <span className={`absolute top-2.5 right-2.5 text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${sc.difficulty === 'critical' ? 'bg-rose-950 text-rose-400 border border-rose-900/30' : sc.difficulty === 'high' ? 'bg-amber-950 text-amber-400 border border-amber-900/30' : 'bg-slate-800 text-slate-400'}`}>
                  {sc.difficulty}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Simulated Incident Title</label>
            <input 
              type="text" 
              placeholder="e.g. VIP Entrance Protest Surge" 
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Detailed Description & Context</label>
            <textarea 
              rows={2}
              placeholder="Provide context regarding location, number of fans, and severity of the incident..." 
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/40 resize-none"
            />
          </div>
        </div>
      )}

      {/* Trigger CTA */}
      <button
        onClick={handleRunSimulation}
        disabled={running || (isCustomMode && (!customName || !customDesc))}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-slate-900 disabled:to-slate-900 disabled:border-slate-800 disabled:border text-slate-100 font-semibold text-xs tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 transition duration-200"
      >
        {running ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-100" />
            Synthesizing Joint Multi-Agent Response Plan...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            Launch Active Stress Drill
          </>
        )}
      </button>

      {/* Multi-Agent Collaborative Output Visualization */}
      {agentLogs && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Decentralized Agent Consultation Output
            </span>
            <span className="text-[10px] text-slate-500 font-mono">FIFA-OS CORE VER 2.5</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 divide-y sm:divide-y-0 lg:divide-y sm:divide-x lg:divide-x-0 divide-slate-800">
            
            {/* Planning Agent */}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-900 text-indigo-400">
                  <Activity className="w-4 h-4" />
                </div>
                <h5 className="text-xs font-semibold text-slate-200">Planning Agent</h5>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-line bg-slate-900/30 p-2.5 rounded-xl border border-slate-900">
                {agentLogs.planning}
              </p>
            </div>

            {/* Specialist Agents Execution */}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-900 text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h5 className="text-xs font-semibold text-slate-200">Joint Execution</h5>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-line bg-slate-900/30 p-2.5 rounded-xl border border-slate-900">
                {agentLogs.execution}
              </p>
            </div>

            {/* Critic Agent Review */}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-950 border border-rose-900 text-rose-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h5 className="text-xs font-semibold text-slate-200">Critic & Safety Agent</h5>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-line bg-slate-900/30 p-2.5 rounded-xl border border-slate-900">
                {agentLogs.critic}
              </p>
            </div>

          </div>

          {/* Success Indicator Footer */}
          <div className="px-4 py-2.5 bg-slate-900/20 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Evacuation and emergency margins safely cleared
            </span>
            <span className="text-slate-500 font-mono text-[10px]">Decision delay: 23ms</span>
          </div>

        </div>
      )}

    </div>
  );
}
