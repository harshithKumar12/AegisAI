import React, { useState } from 'react';
import { 
  Incident, 
  DigitalTwinState 
} from '../types';
import { 
  Users, 
  Shield, 
  Utensils, 
  Maximize2,
  Minimize2,
  Compass,
  ZoomIn,
  ZoomOut,
  Info
} from 'lucide-react';

interface DigitalTwinProps {
  state: DigitalTwinState;
  onApplyAction: (actionType: string, params: { gateId?: string, incidentId?: string }) => void;
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident | null) => void;
  activeLayer?: 'heat' | 'gates' | 'facilities' | 'security';
  onActiveLayerChange?: (layer: 'heat' | 'gates' | 'facilities' | 'security') => void;
}

export default function DigitalTwin({ 
  state, 
  onApplyAction: _onApplyAction, 
  selectedIncident, 
  onSelectIncident,
  activeLayer: controlledActiveLayer,
  onActiveLayerChange
}: DigitalTwinProps) {
  const [localActiveLayer, setLocalActiveLayer] = useState<'heat' | 'gates' | 'facilities' | 'security'>('heat');
  const activeLayer = controlledActiveLayer !== undefined ? controlledActiveLayer : localActiveLayer;
  const setActiveLayer = (layer: 'heat' | 'gates' | 'facilities' | 'security') => {
    if (onActiveLayerChange) {
      onActiveLayerChange(layer);
    } else {
      setLocalActiveLayer(layer);
    }
  };
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panSector, setPanSector] = useState<'all' | 'north' | 'east' | 'south' | 'west'>('all');
  const [isMaximized, setIsMaximized] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [explainableRec, setExplainableRec] = useState<{title: string, reason: string, citation: string} | null>(null);
  const [isAIOverlayActive, setIsAIOverlayActive] = useState<boolean>(true);

  // Stadium sectors map coordinates with realistic concentric curved oval athletic bowl paths
  const stadiumSectors = [
    { id: 'sec-north', name: 'Sector North (Main entrance)', d: 'M 115 84 A 120 80 0 0 1 285 84 L 257 105 A 80 50 0 0 0 143 105 Z', color: 'rgba(59, 130, 246, 0.45)', textX: 200, textY: 65, details: 'Flow limit: 12,000/hr. Real-time load is nominal.' },
    { id: 'sec-east', name: 'Sector East (Gate B)', d: 'M 285 84 A 120 80 0 0 1 285 196 L 257 175 A 80 50 0 0 0 257 105 Z', color: 'rgba(245, 158, 11, 0.55)', textX: 295, textY: 145, details: 'Congested. Gate B scanner firmware issues reported.' },
    { id: 'sec-south', name: 'Sector South (Gate D)', d: 'M 285 196 A 120 80 0 0 1 115 196 L 143 175 A 80 50 0 0 0 257 175 Z', color: 'rgba(59, 130, 246, 0.4)', textX: 235, textY: 210, details: 'Flow limit: 9,000/hr. Low occupancy deck.' },
    { id: 'sec-west', name: 'Sector West (Gate C)', d: 'M 115 196 A 120 80 0 0 1 115 84 L 143 105 A 80 50 0 0 0 143 175 Z', color: 'rgba(16, 185, 129, 0.4)', textX: 150, textY: 145, details: 'De-congested. Optimal alternative entrance.' },
  ];

  // Incidents mapped to exact visual coordinates on the axonometric SVG canvas
  const incidentCoords: Record<string, { x: number, y: number, area: string, citation: string, trigger: string }> = {
    'inc-1': { x: 280, y: 150, area: "Sector B14 - East Deck", citation: "FIFA SOP Article 7.3", trigger: "Ambient temperature sensor registered 39°C solar heat risk." },
    'inc-2': { x: 310, y: 105, area: "Gate B Entry Terminal", citation: "FIFA SOP Article 4.1", trigger: "Turnstile RF scanners offline. Local server synchronization lost." },
    'default': { x: 200, y: 140, area: "Arena Core", citation: "General SOP", trigger: "Nominal operational state." }
  };

  // Automatically switch to security layer & highlight XAI when selectedIncident changes from parent
  React.useEffect(() => {
    if (selectedIncident) {
      setActiveLayer('security');
      const coords = incidentCoords[selectedIncident.id] || incidentCoords.default;
      setExplainableRec({
        title: selectedIncident.title,
        reason: coords.trigger,
        citation: coords.citation
      });
      setPanSector('east');
      setZoomLevel(1.4);
    }
  }, [selectedIncident]);

  const handleSectorPan = (sector: 'all' | 'north' | 'east' | 'south' | 'west') => {
    setPanSector(sector);
    if (sector === 'all') {
      setZoomLevel(1.0);
    } else {
      setZoomLevel(1.6);
    }
  };

  const getTransformStyle = () => {
    let xOffset = 0;
    let yOffset = 0;
    if (panSector === 'north') { xOffset = 0; yOffset = 45; }
    else if (panSector === 'east') { xOffset = -55; yOffset = 0; }
    else if (panSector === 'south') { xOffset = 0; yOffset = -55; }
    else if (panSector === 'west') { xOffset = 55; yOffset = 0; }

    return {
      transform: `scale(${zoomLevel}) translate(${xOffset}px, ${yOffset}px)`,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    };
  };

  const content = (
    <>
      {/* Top Controls panel (Left Grid of layout) */}
      <div className={`flex flex-col gap-4 mb-6 w-full ${isMaximized ? 'md:w-1/3 md:pr-6 md:border-r md:border-slate-800 shrink-0' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Digital Twin — 2D (3D twin: Phase 2)
            </h3>
            <p className="text-xs text-slate-400 font-mono">STADIUM LAYER CONTEXTS</p>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              title="Toggle Layout Maximization"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* AI Analytics Overlay Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-900">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-200 block">AI Cognitive Layer</span>
            <span className="text-[9px] text-slate-500 block font-mono">PREDICTIVE ANNOTATION OVERLAY</span>
          </div>
          <button 
            onClick={() => setIsAIOverlayActive(!isAIOverlayActive)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide uppercase font-mono border transition-all cursor-pointer ${isAIOverlayActive ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' : 'bg-slate-900 border-slate-850 text-slate-500'}`}
          >
            {isAIOverlayActive ? "ON: COGNITIVE OS" : "OFF: RAW PHYSICAL"}
          </button>
        </div>

        {/* Tactical layers selector tab stack */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setActiveLayer('heat')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${activeLayer === 'heat' ? 'bg-orange-950/40 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}
          >
            <Users className="w-3.5 h-3.5" />
            Crowd Density
          </button>
          <button 
            onClick={() => setActiveLayer('gates')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${activeLayer === 'gates' ? 'bg-blue-950/40 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}
          >
            <Compass className="w-3.5 h-3.5" />
            Ingress Channels
          </button>
          <button 
            onClick={() => setActiveLayer('facilities')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${activeLayer === 'facilities' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Concessions
          </button>
          <button 
            onClick={() => setActiveLayer('security')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${activeLayer === 'security' ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}
          >
            <Shield className="w-3.5 h-3.5" />
            Tactical Security
          </button>
        </div>

        {/* 3D Focal Pan & Zoom controller console */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
          <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Model Zoom & Focal Sector</span>
          
          <div className="flex gap-2 items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.2))}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.2))}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
                Scale: {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            {/* Quick-Sector panning buttons */}
            <div className="flex flex-wrap gap-1 max-w-[140px] justify-end">
              {(['all', 'north', 'east', 'south', 'west'] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => handleSectorPan(sec)}
                  className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold border transition ${panSector === sec ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${state.crowdDensity > 80 ? 'bg-rose-500' : state.crowdDensity > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
              style={{ width: `${state.crowdDensity}%` }}
            />
          </div>
        </div>

        {/* Dynamic Legend and Explainable AI Recommendation Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 flex-1 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Telemetry Diagnostics</p>
          
          {activeLayer === 'heat' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Average Density Load:</span>
                <span className="font-mono text-orange-400 font-bold">{state.crowdDensity}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/40 p-2 rounded-xl border border-slate-900">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40"></span>Low</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/40"></span>Normal</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/40 animate-pulse"></span>Congestion</span>
              </div>
            </div>
          )}

          {activeLayer === 'gates' && (
            <div className="space-y-1.5 text-xs text-slate-300">
              {state.gateStatuses.map(g => (
                <div key={g.id} className="flex justify-between items-center bg-slate-900/30 p-2 rounded-xl border border-slate-850">
                  <span className="font-semibold">{g.name}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{g.flowRate} ppm</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${g.status === 'congested' ? 'bg-rose-950 text-rose-400 border border-rose-900/30' : 'bg-slate-800 text-emerald-400'}`}>
                      {g.waitTime}m wait
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeLayer === 'facilities' && (
            <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-300">
              {state.facilityStatuses.map(f => (
                <div key={f.id} className="flex justify-between items-center bg-slate-900/20 p-2 rounded-xl border border-slate-900">
                  <span className="truncate">{f.name}:</span>
                  <span className={`font-mono font-bold ${f.status === 'full' || f.status === 'crowded' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {f.occupancy}% ({f.waitLabel})
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeLayer === 'security' && (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-rose-950/10 border border-rose-900/30 text-rose-400 text-xs">
                <strong>Medical Emergency Responder ETA countdown:</strong> Active ambulance loop clear at Sector East gate. Priority corridors active.
              </div>
              <p className="text-[10px] text-slate-400 italic">Hover or click glowing alert beacons on map to read underlying sensor telemetry triggers and regulatory SOP codes.</p>
            </div>
          )}

          {/* Explainable AI block details when user hovers/clicks alerts */}
          {explainableRec ? (
            <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-200 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-indigo-900/20 pb-1">
                <span className="font-bold text-indigo-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  XAI Decision Trace
                </span>
                <span className="text-[9px] font-mono text-slate-500">{explainableRec.citation}</span>
              </div>
              <p className="font-semibold text-slate-100">{explainableRec.title}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">{explainableRec.reason}</p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-900/30 border border-slate-800 text-[10px] text-slate-500 text-center italic">
              Click warning beacons to inspect AI recommendation logic and rules manual.
            </div>
          )}
        </div>
      </div>

      {/* Axonometric Vector Canvas Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        
        {/* Hovered Sector Card overlay */}
        {hoveredSection && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/50 text-slate-200 text-xs shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <strong>{hoveredSection}</strong>
          </div>
        )}

        <div className={`relative w-full aspect-square rounded-2xl border border-slate-800/40 bg-slate-950/20 flex items-center justify-center p-2 overflow-hidden shadow-inner transition-all ${isMaximized ? 'max-w-[650px]' : 'max-w-[500px]'}`}>
          
          {/* Cybernetic background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.15)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>
          
          {/* Zoom and pan boundary wrapper */}
          <div style={getTransformStyle()} className="w-full h-full">
            <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-[0_0_35px_rgba(30,41,59,0.45)]">
              
              {/* Outer circular stadium perimeter guides */}
              <circle cx="200" cy="140" r="130" fill="none" stroke="#111827" strokeWidth="4" />
              <circle cx="200" cy="140" r="115" fill="none" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="1" strokeDasharray="6,4" />

              {/* Pedestrian Ingress Flow Vectors: sliding animated circles (active in "gates" mode) */}
              {activeLayer === 'gates' && (
                <>
                  {/* Gate B Congested vector lines */}
                  <path d="M 320 210 L 270 170" fill="none" stroke="rgba(244, 63, 94, 0.5)" strokeWidth="3" strokeDasharray="5,10" className="animate-[stroke-flow_1.5s_linear_infinite]" />
                  <path d="M 330 110 L 280 110" fill="none" stroke="rgba(244, 63, 94, 0.6)" strokeWidth="3" strokeDasharray="5,10" className="animate-[stroke-flow_1.5s_linear_infinite]" />
                  
                  {/* Gate C Fluid vector lines */}
                  <path d="M 70 130 L 130 110" fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="3" strokeDasharray="5,10" className="animate-[stroke-flow_1s_linear_infinite]" />
                  <path d="M 120 220 L 170 180" fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="3" strokeDasharray="5,10" className="animate-[stroke-flow_1s_linear_infinite]" />
                </>
              )}

              {/* Emergency ambulance priority corridor (active in "security" mode) */}
              {activeLayer === 'security' && (
                <>
                  <path d="M 350 240 L 280 150" fill="none" stroke="rgba(220, 38, 38, 0.6)" strokeWidth="5" strokeLinecap="round" className="animate-pulse" />
                  <text x="315" y="195" fill="#f43f5e" fontSize="8" fontWeight="bold" fontFamily="monospace" transform="rotate(-40, 315, 195)">EMERGENCY AMBULANCE LANES</text>
                </>
              )}

              {/* 🤖 COGNITIVE OS AI ANNOTATIONS */}
              {isAIOverlayActive && (
                <>
                  {/* Predicted Turnstile Overload Zones & Rerouting Arrows inside Gates view */}
                  {activeLayer === 'gates' && (
                    <>
                      {/* Gate B Congested highlight overlay */}
                      <circle cx="280" cy="140" r="24" fill="rgba(244, 63, 94, 0.12)" stroke="rgba(244, 63, 94, 0.45)" strokeWidth="1" strokeDasharray="3,3" className="animate-pulse" />
                      
                      {/* Text overlay indicator badge */}
                      <g transform="translate(280, 105)">
                        <rect x="-35" y="-7" width="70" height="13" rx="2.5" fill="#ef4444" opacity="0.95" />
                        <text x="0" y="2" fill="#ffffff" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          PREDICTED OVERLOAD
                        </text>
                      </g>
                      
                      {/* Re-routing Suggestion Arrows: directing traffic from East plaza down to West Gate C */}
                      <path d="M 270 70 Q 200 40 130 80" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4,4" className="animate-[stroke-flow_1.2s_linear_infinite]" />
                      <polygon points="128,83 133,76 134,81" fill="#10b981" />
                      
                      <g transform="translate(200, 48)">
                        <rect x="-42" y="-6" width="84" height="11" rx="2" fill="#10b981" />
                        <text x="0" y="2" fill="#022c22" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                          AUTO REDIRECT DIRECTION
                        </text>
                      </g>
                    </>
                  )}

                  {/* Thermal stress overlay highlights inside Heat/Density view */}
                  {activeLayer === 'heat' && (
                    <>
                      <circle cx="285" cy="175" r="20" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" strokeDasharray="4,2" className="animate-pulse" />
                      <g transform="translate(315, 175)">
                        <rect x="-24" y="-5" width="48" height="10" rx="1.5" fill="#f59e0b" />
                        <text x="0" y="2" fill="#000" fontSize="4.5" fontWeight="extrabold" textAnchor="middle" fontFamily="sans-serif">
                          THERMAL DISTRESS
                        </text>
                      </g>
                    </>
                  )}

                  {/* Secure priority evacuation lines inside Security view */}
                  {activeLayer === 'security' && (
                    <>
                      <path d="M 120 140 Q 200 170 270 140" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" opacity="0.65" strokeDasharray="6,4" className="animate-[stroke-flow_1s_linear_infinite]" />
                      <text x="200" y="152" fill="#34d399" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        PRIMARY SECURE EVACUATION CORRIDOR
                      </text>
                    </>
                  )}
                </>
              )}

              {/* STADIUM SECTORS */}
              <g id="sectors-mesh">
                {stadiumSectors.map((sector) => {
                  let fillColor = sector.color;
                  if (activeLayer === 'heat') {
                    if (sector.id === 'sec-east') fillColor = 'rgba(239, 68, 68, 0.4)'; // Hot zone
                    else if (sector.id === 'sec-north') fillColor = 'rgba(245, 158, 11, 0.35)'; // Medium
                    else fillColor = 'rgba(16, 185, 129, 0.25)'; // Low density
                  } else if (activeLayer === 'facilities') {
                    if (sector.id === 'sec-east') fillColor = 'rgba(239, 68, 68, 0.3)'; // Crowded food/bathrooms
                    else fillColor = 'rgba(30, 41, 59, 0.4)';
                  } else if (activeLayer === 'security') {
                    if (sector.id === 'sec-east') fillColor = 'rgba(220, 38, 38, 0.15)'; // High-alert sector
                    else fillColor = 'rgba(15, 23, 42, 0.6)';
                  }

                  const isHovered = hoveredSection === sector.name;

                  return (
                    <path
                      key={sector.id}
                      d={sector.d}
                      fill={fillColor}
                      stroke={isHovered ? '#818cf8' : 'rgba(51, 65, 85, 0.8)'}
                      strokeWidth={isHovered ? '2' : '1.5'}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredSection(sector.name)}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => setExplainableRec({
                        title: sector.name,
                        reason: sector.details,
                        citation: sector.id === 'sec-east' ? "FIFA Security Code Sec-D" : "Nominal Zone Code"
                      })}
                    />
                  );
                })}
              </g>

              {/* Pitch Field Ground Centerpiece inside Inner Oval */}
              <g id="football-pitch" transform="translate(150, 115)">
                {/* Turf Stripes Pattern */}
                <rect x="0" y="0" width="100" height="50" rx="3" fill="#15803d" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
                <rect x="20" y="0" width="20" height="50" fill="#166534" />
                <rect x="60" y="0" width="20" height="50" fill="#166534" />
                {/* Halfway line & Center Circle */}
                <circle cx="50" cy="25" r="10" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
                <line x1="50" y1="0" x2="50" y2="50" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
                {/* Penalty goal boxes */}
                <rect x="0" y="12" width="12" height="26" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
                <rect x="88" y="12" width="12" height="26" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
              </g>

              {/* INTERACTIVE ALERTS AND WARNING PULSING BEACONS */}
              {state.activeIncidents.filter(inc => inc.status !== 'resolved').map((inc) => {
                const coords = incidentCoords[inc.id] || incidentCoords.default;
                const isSelected = selectedIncident?.id === inc.id;

                return (
                  <g 
                    key={inc.id}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIncident(inc);
                      setExplainableRec({
                        title: inc.title,
                        reason: coords.trigger,
                        citation: coords.citation
                      });
                    }}
                  >
                    {/* Ring Pulse */}
                    <circle cx="0" cy="0" r={isSelected ? "14" : "10"} fill="none" stroke={inc.severity === 'critical' ? '#ef4444' : '#f59e0b'} strokeWidth="2" className="animate-ping" />
                    
                    {/* Inner glowing circle */}
                    <circle cx="0" cy="0" r="7" fill={inc.severity === 'critical' ? '#ef4444' : '#f59e0b'} className="shadow-lg" />
                    
                    {/* Dynamic floating micro tag */}
                    <g transform="translate(0, -14)" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect x="-40" y="-12" width="80" height="15" rx="3" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
                      <text x="0" y="-2" fill="#f1f5f9" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        {inc.title.substring(0, 15)}...
                      </text>
                    </g>
                  </g>
                );
              })}

            </svg>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div 
      id="digital-twin-canvas" 
      className={`rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl flex flex-col md:flex-row transition-all duration-300 ${isMaximized ? 'fixed inset-4 z-50 overflow-hidden' : 'relative gap-6'}`}
    >
      {content}
    </div>
  );
}
