import React from 'react';
import { CheckCircle } from 'lucide-react';
import { DigitalTwinState, Incident } from '../types';

interface IncidentLogPanelProps {
  stadiumState: DigitalTwinState;
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;
  handleApplyAction: (actionType: string, params: { gateId?: string, incidentId?: string }) => void;
  t: {
    tacticalLogs: string;
  };
}

export const IncidentLogPanel: React.FC<IncidentLogPanelProps> = React.memo(({
  stadiumState,
  selectedIncident,
  setSelectedIncident,
  handleApplyAction,
  t
}) => {
  return (
    <div id="active-incidents-panel" className="rounded-3xl border border-slate-900 bg-slate-950/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">{t.tacticalLogs}</h3>
        <span className="text-[10px] bg-rose-950/30 text-rose-400 border border-rose-900/30 px-1.5 py-0.5 rounded font-mono">
          {stadiumState.activeIncidents.filter(i => i.status !== 'resolved').length} Active
        </span>
      </div>

      <div className="space-y-3">
        {stadiumState.activeIncidents.map((inc) => (
          <button
            key={inc.id}
            onClick={() => setSelectedIncident(inc)}
            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col gap-2 ${selectedIncident?.id === inc.id ? 'border-indigo-500/50 bg-indigo-950/10' : 'border-slate-800/60 bg-slate-900/30 hover:border-slate-700/60'}`}
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-current" style={{ color: inc.severity === 'high' || inc.severity === 'critical' ? '#ef4444' : '#f59e0b' }} />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-100">{inc.title}</span>
              <span className="text-[9px] text-slate-500 font-mono">{inc.timestamp}</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{inc.description}</p>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500 font-mono">Sector: {inc.location}</span>
              <span className={`capitalize font-semibold ${inc.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>{inc.status}</span>
            </div>
          </button>
        ))}
      </div>

      {selectedIncident && (
        <div className="mt-4 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Incident Diagnostic & Fix</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold ${selectedIncident.severity === 'high' || selectedIncident.severity === 'critical' ? 'bg-rose-950/50 text-rose-400 border border-rose-900/30' : 'bg-amber-950/50 text-amber-400 border border-amber-900/30'}`}>
              {selectedIncident.severity}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">{selectedIncident.title}</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{selectedIncident.description}</p>
          </div>
          {selectedIncident.status !== 'resolved' ? (
            <div className="space-y-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-900 text-[10px] text-slate-400 space-y-1">
                <strong className="text-indigo-300 block">SOP Response Guideline:</strong>
                <p>{selectedIncident.recommendedAction}</p>
              </div>
              <div className="flex gap-2">
                {selectedIncident.status === 'active' && (
                  <button
                    onClick={() => handleApplyAction("dispatch_medical", { incidentId: selectedIncident.id })}
                    className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-semibold text-[10px] tracking-wider transition-all cursor-pointer"
                  >
                    Deploy Response
                  </button>
                )}
                <button
                  onClick={() => handleApplyAction("resolve_incident", { incidentId: selectedIncident.id })}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Resolve Incident
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5 justify-center py-2 bg-slate-900/40 rounded-xl border border-emerald-900/20">
              <CheckCircle className="w-3.5 h-3.5" />
              Threat Neutralized / Resolved
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default IncidentLogPanel;
