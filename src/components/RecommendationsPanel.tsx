import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Recommendation } from '../types';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  handleApplyRecommendation: (recId: string) => void;
  t: {
    autoInterventions: string;
    authorize: string;
    activeProtocol: string;
  };
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = React.memo(({
  recommendations,
  handleApplyRecommendation,
  t
}) => {
  return (
    <div className="rounded-3xl border border-slate-900 bg-slate-950/50 p-5 space-y-4" id="recommendations-panel">
      <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        {t.autoInterventions}
      </h3>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div 
            key={rec.id}
            className={`p-3.5 rounded-2xl border ${rec.applied ? 'border-slate-900 bg-slate-900/10 opacity-60' : 'border-indigo-500/20 bg-indigo-950/10'} space-y-2.5`}
          >
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span className="capitalize text-indigo-300">Agent: {rec.sourceAgent}</span>
              <span className="font-mono">{rec.timestamp}</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-200">{rec.title}</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">{rec.description}</p>
            
            {!rec.applied ? (
              <button
                onClick={() => handleApplyRecommendation(rec.id)}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-semibold text-[10px] tracking-wider transition-all"
              >
                {t.authorize}
              </button>
            ) : (
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 justify-center py-1 bg-slate-900/60 rounded-xl border border-slate-800">
                <CheckCircle className="w-3.5 h-3.5" />
                {t.activeProtocol}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default RecommendationsPanel;
