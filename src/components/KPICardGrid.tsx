import React from 'react';
import { DigitalTwinState, Incident } from '../types';

interface KPICardGridProps {
  stadiumState: DigitalTwinState;
  attendancePercentage: number;
  activeAlertCount: number;
  t: {
    stadiumInflux: string;
    crowdFlow: string;
    safetyScore: string;
    sustainabilityIndex: string;
  };
  setActiveRole: (role: 'command' | 'fan' | 'docs') => void;
  setActiveMapLayer: (layer: 'heat' | 'gates' | 'facilities' | 'security') => void;
  setSelectedIncident: (incident: Incident | null) => void;
}

export const KPICardGrid: React.FC<KPICardGridProps> = React.memo(({
  stadiumState,
  attendancePercentage,
  activeAlertCount,
  t,
  setActiveRole,
  setActiveMapLayer,
  setSelectedIncident
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-live="polite" id="kpi-card-grid">
      {/* Card 1: Stadium Influx */}
      <button 
        onClick={() => {
          setActiveRole('command');
          setActiveMapLayer('gates');
          setTimeout(() => {
            document.getElementById('digital-twin-canvas')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between text-left hover:bg-slate-900/60 transition-all duration-300 hover:border-slate-800 hover:scale-[1.02] cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-label={`Stadium Influx: ${stadiumState.attendanceCount.toLocaleString()} fans, ${attendancePercentage}% capacity. Click to view gates on map.`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider group-hover:text-slate-400 transition-colors">{t.stadiumInflux}</span>
          <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/20 border border-indigo-900/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
            LIVE MODEL
          </span>
        </div>
        
        <div className="my-3 space-y-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">AI Prediction</span>
          <p className="text-xs font-semibold text-indigo-400 leading-tight">
            Capacity limit projected in 12 mins. Confidence: 98%.
          </p>
        </div>

        <div className="border-t border-slate-900/60 pt-2.5 w-full flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono font-medium">
            {stadiumState.attendanceCount.toLocaleString()} fans
          </span>
          <span className="text-slate-500 font-mono">
            {attendancePercentage}% capacity limit
          </span>
        </div>
      </button>

      {/* Card 2: Crowd Flow Density */}
      <button 
        onClick={() => {
          setActiveRole('command');
          setActiveMapLayer('heat');
          setTimeout(() => {
            document.getElementById('digital-twin-canvas')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between text-left hover:bg-slate-900/60 transition-all duration-300 hover:border-slate-800 hover:scale-[1.02] cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-label={`Crowd Flow Density: ${stadiumState.crowdDensity}%. Click to view heat map.`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider group-hover:text-slate-400 transition-colors">{t.crowdFlow}</span>
          <span className="text-[9px] font-mono text-amber-400 bg-amber-950/20 border border-amber-900/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></span>
            ACTIVE FLOW
          </span>
        </div>
        
        <div className="my-3 space-y-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">AI Insight</span>
          <p className={`text-xs font-semibold leading-tight ${stadiumState.crowdDensity > 80 ? 'text-rose-400' : 'text-amber-400'}`}>
            {stadiumState.gateStatuses.find(g => g.id === "B")?.status === 'congested'
              ? "Gate B bottleneck active. Predicted delay reduction: 21%."
              : "Gate B optimized. Rerouting bypass functioning nominally."}
          </p>
        </div>

        <div className="border-t border-slate-900/60 pt-2.5 w-full flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono font-medium">
            {stadiumState.crowdDensity}% flow index
          </span>
          <span className="text-slate-500 font-mono">
            {stadiumState.crowdDensity > 80 ? 'Heavy density' : 'Flow rates nominal'}
          </span>
        </div>
      </button>

      {/* Card 3: Stadium Safety Score */}
      <button 
        onClick={() => {
          setActiveRole('command');
          setActiveMapLayer('security');
          const firstActive = stadiumState?.activeIncidents.find(i => i.status !== 'resolved');
          if (firstActive) {
            setSelectedIncident(firstActive);
          }
          setTimeout(() => {
            document.getElementById('active-incidents-panel')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between text-left hover:bg-slate-900/60 transition-all duration-300 hover:border-slate-800 hover:scale-[1.02] cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.05)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-label={`Stadium Safety Score: ${stadiumState.safetyIndex}%. Click to view active incidents.`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider group-hover:text-slate-400 transition-colors">{t.safetyScore}</span>
          <span className="text-[9px] font-mono text-rose-400 bg-rose-950/20 border border-rose-900/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-rose-400 animate-pulse"></span>
            SOP RISK MODEL
          </span>
        </div>
        
        <div className="my-3 space-y-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">AI Prediction</span>
          <p className={`text-xs font-semibold leading-tight ${activeAlertCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {activeAlertCount > 0 
              ? `Scanner failure & heat stress active. Responder en route.` 
              : "All parameters secure. Threat likelihood: low (1.2%)."}
          </p>
        </div>

        <div className="border-t border-slate-900/60 pt-2.5 w-full flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono font-medium">
            {stadiumState.safetyIndex}% safe
          </span>
          <span className="text-slate-500 font-mono">
            {activeAlertCount > 0 ? `${activeAlertCount} active incidents` : 'System secure'}
          </span>
        </div>
      </button>

      {/* Card 4: Sustainability Score */}
      <button 
        onClick={() => {
          setActiveRole('command');
          setActiveMapLayer('facilities');
          setTimeout(() => {
            document.getElementById('digital-twin-canvas')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between text-left hover:bg-slate-900/60 transition-all duration-300 hover:border-slate-800 hover:scale-[1.02] cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-label={`Sustainability Index: ${stadiumState.sustainabilityScore}%. Click to view resources.`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider group-hover:text-slate-400 transition-colors">{t.sustainabilityIndex}</span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
            GRID CONTEXT
          </span>
        </div>
        
        <div className="my-3 space-y-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">AI Insight</span>
          <p className="text-xs font-semibold text-emerald-400 leading-tight">
            Peak-shaving active. Saving 50 kW on East concourse lighting.
          </p>
        </div>

        <div className="border-t border-slate-900/60 pt-2.5 w-full flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono font-medium">
            {stadiumState.sustainabilityScore}% index
          </span>
          <span className="text-slate-500 font-mono">
            Conserving {stadiumState.resourceUsage.electricitySavingPct}% energy
          </span>
        </div>
      </button>
    </section>
  );
});

export default KPICardGrid;
