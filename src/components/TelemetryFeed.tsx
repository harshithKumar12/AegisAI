import React from 'react';

interface TelemetryFeedProps {
  systemLogs: string[];
  t: {
    liveTelemetry: string;
  };
}

export const TelemetryFeed: React.FC<TelemetryFeedProps> = React.memo(({
  systemLogs,
  t
}) => {
  return (
    <div className="rounded-3xl border border-slate-900 bg-slate-950/40 p-5 space-y-4" id="telemetry-feed">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">🤖 {t.liveTelemetry}</h3>
        <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">1 SOURCE OF TRUTH</span>
      </div>
      
      <div className="relative pl-4 border-l border-slate-900 space-y-4 h-[160px] overflow-y-auto scrollbar-thin pr-1" aria-live="polite">
        {systemLogs.map((log, i) => {
          // Parse timestamp [HH:MM:SS]
          const match = log.match(/^\[([^\]]+)\]\s*(.*)$/);
          const time = match ? match[1] : '';
          const msg = match ? match[2] : log;

          // Decide color coding and icons depending on keywords
          let colorClass = "bg-slate-700 text-slate-400 border-slate-800";
          let indicatorDot = "bg-slate-500";
          
          const lowerMsg = msg.toLowerCase();
          if (lowerMsg.includes("warning") || lowerMsg.includes("rejected") || lowerMsg.includes("dismissed")) {
            colorClass = "text-rose-400";
            indicatorDot = "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse";
          } else if (lowerMsg.includes("applied") || lowerMsg.includes("resolved") || lowerMsg.includes("optimized") || lowerMsg.includes("success") || lowerMsg.includes("calibrated")) {
            colorClass = "text-emerald-400";
            indicatorDot = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
          } else if (lowerMsg.includes("executing") || lowerMsg.includes("applying") || lowerMsg.includes("dispatching") || lowerMsg.includes("triggering")) {
            colorClass = "text-indigo-400 font-semibold";
            indicatorDot = "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-bounce";
          } else if (lowerMsg.includes("predictive") || lowerMsg.includes("forecast") || lowerMsg.includes("model") || lowerMsg.includes("loaded")) {
            colorClass = "text-amber-400";
            indicatorDot = "bg-amber-500";
          }

          return (
            <div key={i} className="relative text-[10px] space-y-1 group leading-relaxed">
              {/* Left node anchor marker */}
              <div className={`absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${indicatorDot}`} />
              
              <div className="flex items-center justify-between font-mono text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors">
                <span>TRACE EVENT</span>
                <span>{time}</span>
              </div>
              
              <p className={`font-mono leading-relaxed ${colorClass}`}>{msg}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default TelemetryFeed;
