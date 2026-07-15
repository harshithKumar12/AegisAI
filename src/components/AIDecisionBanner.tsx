import React from 'react';
import { Recommendation } from '../types';

interface AIDecisionBannerProps {
  recommendations: Recommendation[];
  isRec1Rejected: boolean;
  isRec2Rejected: boolean;
  setIsRec1Rejected: (rejected: boolean) => void;
  setIsRec2Rejected: (rejected: boolean) => void;
  handleApplyRecommendation: (recId: string) => void;
  setActiveAgentId: (agentId: any) => void;
  addLog: (log: string) => void;
}

export const AIDecisionBanner: React.FC<AIDecisionBannerProps> = React.memo(({
  recommendations,
  isRec1Rejected,
  isRec2Rejected,
  setIsRec1Rejected,
  setIsRec2Rejected,
  handleApplyRecommendation,
  setActiveAgentId,
  addLog
}) => {
  return (
    <div className="rounded-3xl border border-slate-900 bg-gradient-to-r from-slate-950 via-slate-950 to-indigo-950/20 p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-start justify-between" id="ai-decision-banner">
      
      {/* Abstract decorative graphic elements matching FIFA OS vibes */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none"></div>
      <div className="absolute left-0 bottom-0 top-0 w-24 bg-[radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.02),transparent_70%)] pointer-events-none"></div>

      {/* Card Body */}
      <div className="flex-1 space-y-4">
        
        {/* Header line with badge indicator */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            ACTIVE OPERATIONAL INTERVENTION ALERT
          </span>
          <span className="text-[10px] text-slate-500 font-mono">ID: AEGIS-OS-DIRECTIVE-1</span>
        </div>

        {/* Main Heading depending on State */}
        {!recommendations.find(r => r.id === "rec-1")?.applied && !isRec1Rejected ? (
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <span className="text-rose-500 animate-pulse">⚠️</span>
              Predictive Bottleneck: Gate B Turnstiles Overloading
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
              <strong>AI Forecast:</strong> Spectator queue at <span className="text-amber-400 font-semibold font-mono">Gate B (East Plaza Entry)</span> is forecasted to exceed safe density limits in <span className="text-rose-400 font-bold font-mono">9 minutes</span>. Dynamic ingress sensors record flow rates at <span className="text-rose-400 font-semibold">38m wait times</span>. 
            </p>
            <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/60 max-w-3xl space-y-3">
              <p className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                <span className="text-indigo-400">🤖</span>
                <span><strong>Recommended SOP Directive:</strong> Redirect <span className="text-indigo-300 font-bold">15% of approaching East-lot ticket arrivals</span> to the de-congested <span className="text-emerald-400 font-semibold">Gate C (West Plaza Plaza)</span>. Launch multilingual volunteer announcements.</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono border-t border-slate-800/40 pt-2 text-slate-400">
                <span className="text-indigo-400">Confidence Score: 97%</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">↓ Gate B Wait: -22 mins</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">↑ Safety Coherence: +4%</span>
              </div>
            </div>
          </div>
        ) : !recommendations.find(r => r.id === "rec-2")?.applied && !isRec2Rejected ? (
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <span className="text-amber-500">🔥</span>
              Thermal Distress Alarm: Sector B14 Solar Exposure Heat
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
              <strong>AI Forecast:</strong> Thermal telemetry near sun-exposed seats in <span className="text-amber-400 font-semibold font-mono">Sector B14</span> has hit <span className="text-rose-400 font-bold font-mono">39°C (102°F)</span>. Ground sensors estimate high dehydration fatigue risk for 14 active spectators.
            </p>
            <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/60 max-w-3xl space-y-3">
              <p className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                <span className="text-indigo-400">🤖</span>
                <span><strong>Recommended SOP Directive:</strong> Dispatch <span className="text-amber-300 font-bold">Volunteer Hydration Squad #4</span> with insulated ice packs and electrolyte replenishment tubes directly to Sector B14.</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono border-t border-slate-800/40 pt-2 text-slate-400">
                <span className="text-indigo-400">Confidence Score: 95%</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">↓ Dehydration Rate: -78%</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400">↑ Volunteer Efficacy: +35%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight text-emerald-400 flex items-center gap-2">
              <span className="text-emerald-500 animate-pulse">🛡️</span>
              Closed-Loop Cognitive Shield Fully Operational
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
              AegisAI OS has neutralized all pending turnstile congestion bottlenecks, HVAC cooling strains, and medical telemetry anomalies. Operating environment is fully stabilized.
            </p>
            <div className="bg-slate-900/30 rounded-2xl p-4 border border-emerald-950/20 max-w-3xl text-xs text-slate-400 leading-relaxed font-mono flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Continuous reinforcement models monitoring 12 concurrent stadium sensor streams at 4 Hz. System Health: 100%.</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Panel */}
      <div className="flex flex-col gap-2.5 w-full md:w-auto shrink-0 self-end md:self-center">
        {!recommendations.find(r => r.id === "rec-1")?.applied && !isRec1Rejected ? (
          <>
            <button 
              onClick={() => {
                handleApplyRecommendation("rec-1");
                addLog("Bypassed pedestrian overload at Gate B. Rerouted 15% traffic to Gate C.");
              }}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 w-full md:w-44 border border-indigo-500/30"
            >
              <span>⚡ Approve Reroute</span>
            </button>
            <button 
              onClick={() => {
                setIsRec1Rejected(true);
                addLog("[AI WARNING] Supervisor rejected Gate B pedestrian rerouting directive.");
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold text-xs border border-slate-800 hover:border-slate-750 transition cursor-pointer flex items-center justify-center gap-2 w-full md:w-44"
            >
              <span>Dismiss Directive</span>
            </button>
            <button 
              onClick={() => {
                setActiveAgentId('crowd');
                addLog("Supervisor requested trace reasoning for Gate B.");
                setTimeout(() => {
                  document.getElementById('agent-chat-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 text-indigo-400 font-semibold text-xs border border-indigo-950 hover:border-indigo-900 transition cursor-pointer flex items-center justify-center gap-2 w-full md:w-44"
            >
              <span>🔍 Explain Reasoning</span>
            </button>
          </>
        ) : !recommendations.find(r => r.id === "rec-2")?.applied && !isRec2Rejected ? (
          <>
            <button 
              onClick={() => {
                handleApplyRecommendation("rec-2");
                addLog("Dispatched Hydration Squad #4 with dry-ice water packs to Sector B14.");
              }}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 w-full md:w-44 border border-indigo-500/30"
            >
              <span>⚡ Dispatch Squad</span>
            </button>
            <button 
              onClick={() => {
                setIsRec2Rejected(true);
                addLog("[AI WARNING] Supervisor dismissed Sector B14 thermal mitigation directive.");
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold text-xs border border-slate-800 hover:border-slate-750 transition cursor-pointer flex items-center justify-center gap-2 w-full md:w-44"
            >
              <span>Dismiss Directive</span>
            </button>
            <button 
              onClick={() => {
                setActiveAgentId('emergency');
                addLog("Supervisor requested trace reasoning for Sector B14.");
                setTimeout(() => {
                  document.getElementById('agent-chat-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 text-indigo-400 font-semibold text-xs border border-indigo-950 hover:border-indigo-900 transition cursor-pointer flex items-center justify-center gap-2 w-full md:w-44"
            >
              <span>🔍 Explain Reasoning</span>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => {
                addLog("[AegisAI OS Diagnostic] Executing full-stadium HVAC, gate turnstile, and regional light-rail telemetry diagnostic...");
                setTimeout(() => {
                  addLog("[AegisAI OS Diagnostic SUCCESS] Completed all check loops. No operational drifts or structural anomalies detected.");
                }, 1200);
              }}
              className="px-5 py-3 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 font-bold text-xs border border-emerald-900/40 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 w-full md:w-44 shadow-lg shadow-emerald-950/20"
            >
              <span>⚙️ Run Diagnostics</span>
            </button>
            <button 
              onClick={() => {
                setActiveAgentId('command');
                addLog("Supervisor initiated chat session with Command Center Orchestrator.");
                setTimeout(() => {
                  document.getElementById('agent-chat-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold text-xs border border-slate-800 hover:border-slate-750 transition cursor-pointer flex items-center justify-center gap-2 w-full md:w-44"
            >
              <span>Consult Command AI</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export default AIDecisionBanner;
