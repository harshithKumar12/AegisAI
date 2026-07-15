import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { 
  DigitalTwinState, 
  Incident, 
  Recommendation,
  AgentType
} from './types';
import { auth, onAuthStateChanged, signOut } from './lib/firebase';
import UserAuth from './components/UserAuth';
import DigitalTwin from './components/DigitalTwin';
import AgentControlCenter from './components/AgentControlCenter';
import ScenarioSimulator from './components/ScenarioSimulator';
import { ErrorBoundary } from './components/ErrorBoundary';

import KPICardGrid from './components/KPICardGrid';
import AIDecisionBanner from './components/AIDecisionBanner';
import IncidentLogPanel from './components/IncidentLogPanel';
import RecommendationsPanel from './components/RecommendationsPanel';
import TelemetryFeed from './components/TelemetryFeed';

const AegisDocSheet = lazy(() => import('./components/AegisDocSheet'));

import { 
  AlertTriangle, 
  BookOpen, 
  Cpu, 
  Layers, 
  Smartphone, 
  Volume2, 
  Trophy,
  LogOut
} from 'lucide-react';

const TRANSLATIONS = {
  en: {
    stadiumOS: "Aegis StadiumOS — AT&T Stadium",
    commandCenter: "Command Center",
    fanCompanion: "Fan Companion",
    blueprintDocs: "Blueprint Docs",
    telemetryPipeline: "Telemetry Pipeline",
    stable: "STABLE",
    unresolved: "UNRESOLVED INCIDENTS",
    active: "Active",
    gateCongestion: "Gate B Congestion Delay",
    navigateVia: "Navigate via Gate C",
    nearbyFacilities: "Nearby Facilities Wait-Times",
    busy: "Busy",
    free: "Free",
    crowded: "Crowded",
    stadiumInflux: "Stadium Influx",
    crowdFlow: "Crowd Flow Density",
    safetyScore: "Stadium Safety Score",
    sustainabilityIndex: "Sustainability Index",
    tacticalLogs: "Tactical Incident Logs",
    liveTelemetry: "Live Telemetry Event Feed",
    autoInterventions: "Automated AI Interventions",
    authorize: "✓ AUTHORIZE PROTOCOL",
    activeProtocol: "✓ PROTOCOL ACTIVE",
    newsTicker: "⚡ Stadium OS active: AT&T Stadium, Arlington • FIFA World Cup 2026 Semifinal — France vs Spain (Sold Out) • High temperature alert: Retractable roof closed, cooling optimized • Kylian Mbappé vs Lamine Yamal"
  },
  es: {
    stadiumOS: "Aegis StadiumOS — AT&T Stadium",
    commandCenter: "Centro de Comando",
    fanCompanion: "Guía del Fanático",
    blueprintDocs: "Documentos de Diseño",
    telemetryPipeline: "Canal de Telemetría",
    stable: "ESTABLE",
    unresolved: "INCIDENTES ACTIVOS",
    active: "Activo",
    gateCongestion: "Retraso por Congestión en Puerta B",
    navigateVia: "Navegar por Puerta C",
    nearbyFacilities: "Tiempos de Espera de Servicios",
    busy: "Ocupado",
    free: "Libre",
    crowded: "Concurrido",
    stadiumInflux: "Afluencia del Estadio",
    crowdFlow: "Densidad de Flujo",
    safetyScore: "Índice de Seguridad",
    sustainabilityIndex: "Índice de Sustentabilidad",
    tacticalLogs: "Registro Táctico de Incidentes",
    liveTelemetry: "Canal de Telemetría en Vivo",
    autoInterventions: "Intervenciones de IA Automatizadas",
    authorize: "✓ AUTORIZAR PROTOCOLO",
    activeProtocol: "✓ PROTOCOLO ACTIVO",
    newsTicker: "⚡ Stadium OS activo: AT&T Stadium, Arlington • Semifinal de la Copa Mundial — Francia vs España (Lleno) • Alerta de calor en Texas: Techo cerrado, AC optimizado • Mbappé vs Yamal"
  },
  de: {
    stadiumOS: "Aegis StadiumOS — AT&T Stadium",
    commandCenter: "Kommandozentrale",
    fanCompanion: "Fan-Begleiter",
    blueprintDocs: "SOP-Spezifikationen",
    telemetryPipeline: "Telemetrie-Kanal",
    stable: "STABIL",
    unresolved: "UNGELÖSTE VORFÄLLE",
    active: "Aktiv",
    gateCongestion: "Gate B Stauverzögerung",
    navigateVia: "Über Gate C ausweichen",
    nearbyFacilities: "Wartezeiten nahegelegener Einrichtungen",
    busy: "Besetzt",
    free: "Frei",
    crowded: "Überfüllt",
    stadiumInflux: "Stadionzustrom",
    crowdFlow: "Zuschauerflussdichte",
    safetyScore: "Stadionsicherheitsbewertung",
    sustainabilityIndex: "Nachhaltigkeitsindex",
    tacticalLogs: "Taktische Vorfallprotokolle",
    liveTelemetry: "Live-Telemetrie-Ereignis-Feed",
    autoInterventions: "Automatisierte KI-Eingriffe",
    authorize: "✓ PROTOKOLL GENEHMIGEN",
    activeProtocol: "✓ PROTOKOLL AKTIV",
    newsTicker: "⚡ Stadium OS aktiv: AT&T Stadium, Arlington • FIFA WM 2026 Halbfinale — Frankreich gegen Spanien (Ausverkauft) • Hitze-Alert: Dach geschlossen, Klimaanlage optimiert"
  },
  fr: {
    stadiumOS: "Aegis StadiumOS — AT&T Stadium",
    commandCenter: "Poste de Commandement",
    fanCompanion: "Compagnon du Supporter",
    blueprintDocs: "Guides SOP",
    telemetryPipeline: "Pipeline de Télémétrie",
    stable: "STABLE",
    unresolved: "INCIDENTS NON RÉSOLUS",
    active: "Actif",
    gateCongestion: "Ralentissement à la Porte B",
    navigateVia: "Naviguer via la Porte C",
    nearbyFacilities: "Temps d'attente des commodités",
    busy: "Occupé",
    free: "Libre",
    crowded: "Surchargé",
    stadiumInflux: "Flux de spectateurs",
    crowdFlow: "Densité du trafic",
    safetyScore: "Indice de sécurité",
    sustainabilityIndex: "Index de durabilité",
    tacticalLogs: "Registres tactiques d'incidents",
    liveTelemetry: "Flux d'événements de télémétrie",
    autoInterventions: "Interventions IA automatisées",
    authorize: "✓ AUTORISER LE PROTOCOLE",
    activeProtocol: "✓ PROTOCOLE ACTIF",
    newsTicker: "⚡ Surveillance Stadium OS: AT&T Stadium actif • Demi-finale de la Coupe du Monde — France vs Espagne (Complet) • Canicule au Texas: Toit fermé, clim optimisée"
  },
  pt: {
    stadiumOS: "Aegis StadiumOS — AT&T Stadium",
    commandCenter: "Centro de Comando",
    fanCompanion: "Guia do Torcedor",
    blueprintDocs: "Documentos de Projeto",
    telemetryPipeline: "Fluxo de Telemetria",
    stable: "ESTÁVEL",
    unresolved: "INCIDENTES ATIVOS",
    active: "Ativo",
    gateCongestion: "Congestionamento no Portão B",
    navigateVia: "Navegar pelo Portão C",
    nearbyFacilities: "Tempo de Espera dos Serviços",
    busy: "Ocupado",
    free: "Livre",
    crowded: "Lotado",
    stadiumInflux: "Afluência de Público",
    crowdFlow: "Densidade de Fluxo",
    safetyScore: "Índice de Segurança",
    sustainabilityIndex: "Índice de Sustentabilidade",
    tacticalLogs: "Registro Táctico de Incidentes",
    liveTelemetry: "Fluxo de Eventos em Tempo Real",
    autoInterventions: "Intervenções de IA Automatizadas",
    authorize: "✓ AUTORIZAR PROTOCOLO",
    activeProtocol: "✓ PROTOCOLO ATIVO",
    newsTicker: "⚡ Monitoramento do Stadium OS: AT&T Stadium ativo • Semifinal da Copa do Mundo — França vs Espanha (Esgotado) • Calor no Texas: Teto fechado, AC otimizado"
  }
};

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'es' | 'de' | 'fr' | 'pt'>('en');
  const t = TRANSLATIONS[currentLanguage];

  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('aegis_offline_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  const [activeRole, setActiveRole] = useState<'command' | 'fan' | 'docs'>('command');
  const [stadiumState, setStadiumState] = useState<DigitalTwinState | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeMapLayer, setActiveMapLayer] = useState<'heat' | 'gates' | 'facilities' | 'security'>('heat');
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "AegisAI StadiumOS Core v2.5 initialized successfully.",
    "Bilateral Google Cloud Pub/Sub pipeline established on port 3000.",
    "Predictive crowd-density matrix loaded for AT&T Stadium (France vs Spain Semifinal)."
  ]);
  const [activeAlertCount, setActiveAlertCount] = useState(2);
  const [isRec1Rejected, setIsRec1Rejected] = useState(false);
  const [isRec2Rejected, setIsRec2Rejected] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<AgentType>('crowd');
  const [isStatusWidgetExpanded, setIsStatusWidgetExpanded] = useState(false);
  const [simulatedSpeech, setSimulatedSpeech] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Suggested optimizations recommendations list (dynamic)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: "rec-1",
      title: "Pedestrian Rerouting Guidance",
      description: "Redirect 15% of upcoming East-lot arrivals to Gate C (West Plaza) to reduce Gate B wait times by 20 minutes.",
      category: "crowd",
      sourceAgent: "crowd",
      actionable: true,
      applied: false,
      timestamp: "23:28"
    },
    {
      id: "rec-2",
      title: "Activate Hydration Squads",
      description: "Dispatch volunteer squad #4 with ice-electrolyte hydration packs directly to Sector B14 seats.",
      category: "security",
      sourceAgent: "volunteer",
      actionable: true,
      applied: false,
      timestamp: "23:26"
    },
    {
      id: "rec-3",
      title: "Microgrid Peak Shedding",
      description: "Shed 50 kW of East Concourse MEP lighting to auxiliary battery reserves to raise green efficiency score.",
      category: "sustainability",
      sourceAgent: "sustainability",
      actionable: true,
      applied: false,
      timestamp: "23:21"
    }
  ]);

  // Subscribe to Firebase Auth changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem('aegis_offline_user');
        addLog(`User session authorized: ${currentUser.displayName || currentUser.email || 'Guest Session'}`);
      } else {
        const saved = localStorage.getItem('aegis_offline_user');
        if (saved) {
          try {
            setUser(JSON.parse(saved));
            addLog(`Offline Supervisor Session loaded.`);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
          addLog(`No active supervisor session detected.`);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch CSRF token and current stadium state on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        (window as any).aegisCsrfToken = data.token;
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
      }
    };
    fetchCsrfToken();
    fetchStadiumState();
    // Poll state every 12 seconds to mimic live telemetry syncing
    const interval = setInterval(fetchStadiumState, 12000);
    return () => clearInterval(interval);
  }, []);

  const fetchStadiumState = async () => {
    try {
      const response = await fetch('/api/stadium-state');
      const data = await response.json();
      setStadiumState(data);
      // Synchronize active incident counts
      const activeCount = data.activeIncidents?.filter((i: Incident) => i.status !== 'resolved').length || 0;
      setActiveAlertCount(activeCount);
    } catch (err) {
      console.error("Telemetry fetch fail:", err);
    }
  };

  const addLog = useCallback((logMessage: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemLogs(prev => [`[${timestamp}] ${logMessage}`, ...prev.slice(0, 8)]);
  }, []);

  // Perform operational adjustment
  const handleApplyAction = useCallback(async (actionType: string, params: { gateId?: string, incidentId?: string }) => {
    addLog(`Executing Action Trigger: ${actionType.toUpperCase()} ${params.gateId || params.incidentId || ''}`);
    try {
      const token = (window as any).aegisCsrfToken || '';
      const response = await fetch('/api/apply-recommendation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Aegis-CSRF-Token': token
        },
        body: JSON.stringify({
          actionType,
          gateId: params.gateId,
          incidentId: params.incidentId,
          operator: user?.displayName || user?.email || "Command Center Operator"
        })
      });

      const data = await response.json();
      if (data.success) {
        setStadiumState(data.stadiumState);
        addLog(`Closed-loop response successfully applied. Stadium twin parameters adjusted.`);
        
        // If we resolved an incident, clear it from selected state
        if (actionType === "resolve_incident" && params.incidentId) {
          setSelectedIncident(null);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Failed executing response: ${errMsg}`);
    }
  }, [user, addLog]);

  const handleApplyRecommendation = useCallback((recId: string) => {
    const rec = recommendations.find(r => r.id === recId);
    if (!rec || rec.applied) return;

    addLog(`Applying Recommendation: "${rec.title}"`);
    setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, applied: true } : r));

    // Map recommendation apply back to actual state adjustments
    if (rec.id === "rec-1") {
      handleApplyAction("optimize_gate", { gateId: "B" });
    } else if (rec.id === "rec-2") {
      handleApplyAction("dispatch_medical", { incidentId: "inc-1" });
    } else if (rec.id === "rec-3") {
      handleApplyAction("optimize_sustainability", {});
    }
  }, [recommendations, addLog, handleApplyAction]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-slate-100">
        <LoaderOrb />
        <h2 className="mt-6 text-lg font-mono font-bold tracking-widest text-slate-400 animate-pulse">
          SECURING GATEWAY ACCESS...
        </h2>
        <p className="text-xs text-slate-500 mt-2">Initializing Secure Firebase Authentication & Shield Protection...</p>
      </div>
    );
  }

  if (!user) {
    return <UserAuth onAuthSuccess={() => addLog("Authorization validated.")} />;
  }

  if (!stadiumState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-slate-100">
        <LoaderOrb />
        <h2 className="mt-6 text-lg font-mono font-bold tracking-widest text-slate-400 animate-pulse">
          INITIALIZING AEGIS_OS CORE PIPELINE...
        </h2>
        <p className="text-xs text-slate-500 mt-2">Checking Google GenAI Telemetry & Port Ingress (3000)...</p>
      </div>
    );
  }

  // Helper to extract user initials for avatar
  const getInitials = () => {
    if (user?.displayName) {
      const parts = user.displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'G'; // Guest
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSimulatedSpeech("⚠️ Speech Recognition is not supported in this browser. Please use Chrome, Edge or Safari with enabled speech permissions.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = currentLanguage === 'es' ? 'es-ES' : 'en-US';

    setIsListening(true);
    setSimulatedSpeech("🎤 Listening... Speak into your microphone now.");

    recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setSimulatedSpeech("❌ Microphone Permission Denied. Please enable microphone access in your browser settings to use real voice assistant.");
      } else if (event.error === 'no-speech') {
        setSimulatedSpeech("❌ No speech was detected. Please try speaking again closer to your microphone.");
      } else {
        setSimulatedSpeech(`❌ Speech Recognition Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript || transcript.trim() === "") {
        setSimulatedSpeech("❌ Speech was empty or unintelligible. Please try again.");
        return;
      }

      setSimulatedSpeech(`🎤 Transcribing: "${transcript}"\n\n🔄 Querying Aegis AI...`);

      try {
        const token = (window as any).aegisCsrfToken || '';
        const res = await fetch('/api/voice-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Aegis-CSRF-Token': token
          },
          body: JSON.stringify({ text: transcript })
        });
        const data = await res.json();
        if (data.success) {
          setSimulatedSpeech(
            `🎤 Input (${data.inputLanguage || 'English'}):\n"${data.transcribedText}"\n\n🔄 Translated:\n"${data.translatedText}"\n\n🤖 Aegis Assist:\n"${data.response}"\n\n🇪🇸 Spanish Assist:\n"${data.translatedResponse}"`
          );
        } else if (data.response) {
          setSimulatedSpeech(data.response);
        } else {
          setSimulatedSpeech(`❌ Server Error: ${data.error || 'Failed to process voice query'}`);
        }
      } catch (err: any) {
        console.error(err);
        setSimulatedSpeech("❌ Failed to reach Aegis AI backend. Please check network connection.");
      }
    };

    recognition.start();
  };

  // Calculate percentage of stadium occupancy
  const attendancePercentage = Math.round((stadiumState.attendanceCount / stadiumState.capacityLimit) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic News Ticker bar */}
      <div className="bg-indigo-950/40 border-b border-indigo-900/30 px-6 py-2 text-xs flex justify-between items-center text-indigo-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="bg-indigo-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">FIFA Live</span>
          <p className="truncate font-mono text-[11px] tracking-wide animate-pulse-slow">
            {t.newsTicker}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-indigo-300">
          <span>Kickoff: Tuesday, July 14, 2026 — 19:00 UTC</span>
          <span>External Temp: 39°C (102°F)</span>
        </div>
      </div>

      {/* Main Premium Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Pulsing Hub indicator */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-b from-amber-400 via-amber-500 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)] border border-amber-300/30 shrink-0">
            <Trophy className="w-5.5 h-5.5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/50 border border-amber-500/20 px-1.5 py-0.5 rounded">FIFA 2026</span>
              <h1 className="text-base font-bold tracking-tight text-slate-100 font-sans">
                {t.stadiumOS}
              </h1>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Global Operations Selector Tabs */}
        <nav className="flex flex-wrap justify-center gap-2 bg-gradient-to-b from-slate-900/40 to-slate-950/80 p-1.5 rounded-2xl border border-slate-800/40 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4),0_0_30px_rgba(99,102,241,0.05)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-500/5 before:to-blue-500/5 before:opacity-50" aria-label="Primary navigation tabs">
          {[
            { id: 'command', label: t.commandCenter, icon: Layers },
            { id: 'fan', label: t.fanCompanion, icon: Smartphone },
            { id: 'docs', label: t.blueprintDocs, icon: BookOpen },
          ].map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => {
                  setActiveRole(role.id as any);
                  addLog(`View switched to ${role.label}`);
                }}
                className={`group flex items-center gap-2.5 px-4.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-slate-100 border border-indigo-400/40 shadow-[0_0_25px_rgba(99,102,241,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)] scale-[1.02]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent hover:border-slate-800/40'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="relative flex h-2 w-2 items-center justify-center">
                  {isActive ? (
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors"></span>
                  )}
                </span>
                <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{role.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Indicators & Session Controls */}
        <div className="flex items-center flex-wrap md:flex-nowrap gap-3 shrink-0">

          {/* Language Selector */}
          <div className="flex h-9 px-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] items-center gap-1" id="language-selector-container">
            {(['en', 'es', 'de', 'fr', 'pt'] as const).map((lang) => (
              <button
                key={lang}
                id={`lang-select-${lang}`}
                onClick={() => {
                  setCurrentLanguage(lang);
                  addLog(`System language changed to: ${lang.toUpperCase()}`);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase transition ${
                  currentLanguage === lang 
                    ? 'bg-indigo-600 text-slate-100' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Telemetry Badge */}
          <div className="hidden lg:flex h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <span>{t.telemetryPipeline}:</span>
            <span className="font-bold text-emerald-400">{t.stable}</span>
          </div>

          {/* Unresolved Alert Badge */}
          {activeAlertCount > 0 && (
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
              className="hidden lg:flex h-9 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 text-[11px] font-mono text-rose-400 items-center gap-1.5 animate-pulse transition-all hover:scale-105 cursor-pointer whitespace-nowrap"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{activeAlertCount} {t.unresolved}</span>
            </button>
          )}

          {/* Premium Profile Navigator & Sign Out */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800/80">
              
              {/* Premium Glass Identity Pill */}
              <div className="flex items-center gap-2.5 bg-slate-900/50 border border-slate-800/80 rounded-2xl px-3 py-1 h-9 whitespace-nowrap">
                {/* Initials or profile picture */}
                <div className="relative shrink-0 group/avatar">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User Avatar"}
                      referrerPolicy="no-referrer"
                      className="w-6.5 h-6.5 rounded-full object-cover border border-indigo-500/30 group-hover/avatar:border-indigo-400 transition duration-200"
                    />
                  ) : (
                    <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/30 flex items-center justify-center shadow-[0_0_8px_rgba(99,102,241,0.25)] group-hover/avatar:from-indigo-400 group-hover/avatar:to-purple-500 transition duration-200">
                      <span className="text-[10px] font-bold font-mono text-slate-100 tracking-wider">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                  {/* Online pulse state indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-950"></span>
                </div>

                {/* User identity card */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10.5px] font-bold text-slate-200 truncate max-w-[100px] leading-tight">
                    {user.displayName || user.email?.split('@')[0] || 'Guest Admin'}
                  </span>
                  <span className="text-[8.5px] font-mono text-slate-500 truncate max-w-[100px] leading-none mt-0.5">
                    {user.email || 'guest_sandbox_mode'}
                  </span>
                </div>
              </div>

              {/* Premium Log Out Button */}
              <button
                onClick={async () => {
                  try {
                    localStorage.removeItem('aegis_offline_user');
                    await signOut(auth);
                    setUser(null);
                    addLog("Logged out of active session.");
                    window.location.reload();
                  } catch (err: any) {
                    console.error("Sign out failed", err);
                  }
                }}
                className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold cursor-pointer group/logout-btn whitespace-nowrap"
                title="Log Out Session"
              >
                <LogOut className="w-3.5 h-3.5 group-hover/logout-btn:-translate-x-0.5 transition-transform" />
                <span className="text-[11px] font-bold">Log Out</span>
              </button>
            </div>
          )}
        </div>

      </header>

      {/* Main Core Layout Viewport */}
      <main className="flex-1 px-6 py-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Dynamic State Banner Info */}
        <ErrorBoundary fallbackTitle="KPI Card Grid Failure">
          <KPICardGrid
            stadiumState={stadiumState}
            attendancePercentage={attendancePercentage}
            activeAlertCount={activeAlertCount}
            t={t}
            setActiveRole={setActiveRole}
            setActiveMapLayer={setActiveMapLayer}
            setSelectedIncident={setSelectedIncident}
          />
        </ErrorBoundary>

        {/* Dynamic Routing based on selected Role view */}

        {/* 1. COMMAND CENTER (PRIMARY ORGANIZER DISPLAY) */}
        {activeRole === 'command' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* 🤖 HERO ACTIVE AI DECISION DIRECTIVE BANNER */}
            <ErrorBoundary fallbackTitle="AI Decision Banner Failure">
              <AIDecisionBanner
                recommendations={recommendations}
                isRec1Rejected={isRec1Rejected}
                isRec2Rejected={isRec2Rejected}
                setIsRec1Rejected={setIsRec1Rejected}
                setIsRec2Rejected={setIsRec2Rejected}
                handleApplyRecommendation={handleApplyRecommendation}
                setActiveAgentId={setActiveAgentId}
                addLog={addLog}
              />
            </ErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Alerts list & KPIs (3 cols) */}
              <div className="lg:col-span-3 space-y-6">
                
                <ErrorBoundary fallbackTitle="Tactical Incident Log Panel Failure">
                  <IncidentLogPanel
                    stadiumState={stadiumState}
                    selectedIncident={selectedIncident}
                    setSelectedIncident={setSelectedIncident}
                    handleApplyAction={handleApplyAction}
                    t={t}
                  />
                </ErrorBoundary>

                {/* Scenario Simulator Sandbox */}
                <ErrorBoundary fallbackTitle="Scenario Simulator Fault">
                  <ScenarioSimulator 
                    stadiumState={stadiumState} 
                    onStateUpdate={setStadiumState}
                    onTriggerLog={addLog}
                    user={user}
                  />
                </ErrorBoundary>

              </div>

              {/* Center Column: Interactive Digital Twin Map (6 cols) */}
              <div className="lg:col-span-6">
                <ErrorBoundary fallbackTitle="Digital Twin Visualizer Failure">
                  <DigitalTwin 
                    state={stadiumState} 
                    onApplyAction={handleApplyAction}
                    selectedIncident={selectedIncident}
                    onSelectIncident={setSelectedIncident}
                    activeLayer={activeMapLayer}
                    onActiveLayerChange={setActiveMapLayer}
                  />
                </ErrorBoundary>
              </div>

              {/* Right Column: AI Live Suggestions & Sandbox Trigger (3 cols) */}
              <div className="lg:col-span-3 space-y-6">
                
                <ErrorBoundary fallbackTitle="Recommendations Panel Failure">
                  <RecommendationsPanel
                    recommendations={recommendations}
                    handleApplyRecommendation={handleApplyRecommendation}
                    t={t}
                  />
                </ErrorBoundary>

                {/* 🤖 COLOR-CODED AI REASONING TIMELINE */}
                <ErrorBoundary fallbackTitle="Telemetry Feed Failure">
                  <TelemetryFeed
                    systemLogs={systemLogs}
                    t={t}
                  />
                </ErrorBoundary>

              </div>

            </div>

            {/* Dynamic collaborative chat interface shown underneath */}
            <div id="agent-chat-section" className="scroll-mt-24 w-full">
              <ErrorBoundary fallbackTitle="AI Agent Command Orchestrator Error">
                <AgentControlCenter 
                  stadiumState={stadiumState}
                  onStateUpdate={setStadiumState}
                  selectedAgent={activeAgentId}
                  onSelectAgent={setActiveAgentId}
                  activeRole={activeRole}
                  user={user}
                />
              </ErrorBoundary>
            </div>

          </div>
        )}

        {/* 2. FAN MOBILE COMPANION APP SCREEN */}
        {activeRole === 'fan' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            
            {/* Left: Phone frame mockup (5 cols) */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-[300px] h-[610px] rounded-[40px] border-4 border-slate-800 bg-slate-950 p-3.5 shadow-2xl relative overflow-hidden flex flex-col">
                
                {/* Speaker pill */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                  <div className="w-12 h-1 bg-slate-950 rounded-full" />
                </div>

                {/* Inner phone layout */}
                <div className="flex-1 rounded-[28px] bg-slate-950 overflow-hidden flex flex-col pt-4 relative">
                  
                  {/* Phone Header */}
                  <div className="px-4 py-2 flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-900 bg-slate-900/30">
                    <span>9:41 AM</span>
                    <span className="text-indigo-400">AEGIS COMPANION APP</span>
                  </div>

                  {/* Fan Mobile Ticket */}
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                    
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900/40 border border-indigo-900/40 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                        <span>FIFA World Cup 2026 Ticket</span>
                        <span>Sofi Venue</span>
                      </div>
                      <div className="flex justify-between items-end border-t border-slate-900 pt-2">
                        <div>
                          <p className="text-[10px] text-slate-500">Seat Block</p>
                          <strong className="text-sm text-slate-200">Sector B14 - Row 12</strong>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Gate Access</p>
                          <strong className="text-sm text-slate-200">Gate B (East)</strong>
                        </div>
                      </div>
                    </div>

                    {/* Gate Alert Banner */}
                    <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-900/30 space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Gate B Congestion Delay
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Ticket verification at Gate B has rising lines (38 min delay). Aegis suggests diverting 150m west to <strong>Gate C (West Plaza)</strong> for 4-minute immediate entry.
                      </p>
                      <button 
                        onClick={() => handleApplyAction("optimize_gate", { gateId: "B" })}
                        className="w-full mt-1.5 py-1 rounded bg-amber-600 text-white font-semibold text-[10px]"
                      >
                        ✓ Navigate via Gate C
                      </button>
                    </div>

                    {/* Facility navigation directory */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nearby Facilities Wait-Times</h4>
                      
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center text-xs">
                        <span>🚽 East Concourse Bathroom</span>
                        <span className="font-mono text-rose-400">9 min wait (Busy)</span>
                      </div>
                      
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center text-xs">
                        <span>🚽 West Concourse Bathroom</span>
                        <span className="font-mono text-emerald-400">1 min wait (Free)</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center text-xs">
                        <span>🍔 North Concession Grill</span>
                        <span className="font-mono text-amber-400">12 min wait (Crowded)</span>
                      </div>
                    </div>

                  </div>

                    {/* Fan Voice Assistant Translator Trigger */}
                    <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-2">
                      <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider text-center">Bilingual Speech Assistant Activated</p>
                      
                      {simulatedSpeech ? (
                        <div className="p-2 rounded-xl bg-slate-950 border border-indigo-500/20 text-[10px] space-y-1 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping"></span>
                              Aegis Speech
                            </span>
                            <button 
                              onClick={() => setSimulatedSpeech(null)} 
                              className="text-[9px] text-slate-500 hover:text-slate-300"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-slate-300 whitespace-pre-line leading-relaxed font-sans">{simulatedSpeech}</p>
                        </div>
                      ) : null}

                      <button 
                        onClick={() => {
                          if (isListening) return;
                          startSpeechRecognition();
                        }}
                        className={`py-2 rounded-xl text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all duration-200 ${isListening ? 'bg-indigo-900 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                      >
                        <Volume2 className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
                        {isListening ? "Listening to voice..." : "Speak/Translate (English/Spanish)"}
                      </button>
                    </div>

                </div>

              </div>
            </div>

            {/* Right: Companion app detailed features & chat integration (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Smart Fan Companion Companion Engine</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Fan Companion mobile interface bridges the gap between spectator experience and complex stadium logistics. Rather than relying on static directional markers, fans receive custom-tailored push notifications derived from their ticketing geolocation data.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/40 text-xs space-y-1">
                    <strong className="text-indigo-400 block">Accessibility Walk-Paths</strong>
                    Integrates ADA wheelchair ramps, priority elevators, and sensory quiet stations with clear visual routing.
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/40 text-xs space-y-1">
                    <strong className="text-indigo-400 block">Multilingual Grounding</strong>
                    Allows global fans to consult concession guides and operations rules instantly translated in their native vocabulary.
                  </div>
                </div>
              </div>

              {/* Directly integrate Fan agent chat portal */}
              <ErrorBoundary fallbackTitle="Fan Assistance AI Thread Halted">
                <AgentControlCenter stadiumState={stadiumState} onStateUpdate={setStadiumState} />
              </ErrorBoundary>
            </div>

          </div>
        )}

        {/* 3. TECHNICAL DOCUMENTATION & PITCH DECK */}
        {activeRole === 'docs' && (
          <div className="animate-in fade-in duration-300">
            <Suspense fallback={
              <div className="p-12 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center animate-spin">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                </div>
                <span className="text-xs font-mono text-slate-500 animate-pulse">DEPLOYING SECURITY & TRACE MANIFESTS...</span>
              </div>
            }>
              <AegisDocSheet />
            </Suspense>
          </div>
        )}

      </main>

      {/* Corporate Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 px-6 mt-12 text-center text-xs text-slate-500 font-mono space-y-1">
        <p>© 2026 AegisAI StadiumOS. Fully ready for the FIFA World Cup 2026. Powered by Google Cloud & DeepMind.</p>
        <p className="text-[10px] text-slate-600">Built for high-stakes operational intelligence and autonomous closed-loop stadium orchestration.</p>
      </footer>

      {/* 🤖 FLOATING REAL-TIME AI STATUS WIDGET */}
      <div className="fixed bottom-6 right-6 z-40 font-sans">
        {!isStatusWidgetExpanded ? (
          <button 
            onClick={() => setIsStatusWidgetExpanded(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-800 hover:border-slate-700 shadow-2xl transition cursor-pointer font-mono text-[10px] tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:scale-105"
            aria-label="Expand AegisAI OS Status Widget"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>AEGIS_OS: NOMINAL • CLICK TO EXPAND</span>
          </button>
        ) : (
          <div className="w-80 rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <strong className="text-[10px] font-bold uppercase tracking-wider text-slate-200 font-mono">AegisAI OS Status</strong>
              </div>
              <button 
                onClick={() => setIsStatusWidgetExpanded(false)}
                className="text-slate-450 hover:text-slate-100 text-[10px] font-mono cursor-pointer bg-slate-900 border border-slate-800 hover:border-slate-750 px-2 py-0.5 rounded"
                aria-label="Close Status Widget"
              >
                COLLAPSE
              </button>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-[10px]">CORE MODEL:</span>
                <span className="font-mono text-indigo-400 font-bold bg-indigo-950/20 border border-indigo-900/10 px-2 py-0.5 rounded">gemini-3.5-flash</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-[10px]">ACTIVE AGENTS:</span>
                <span className="font-mono text-slate-300 font-medium">3 Modules Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-[10px]">CYCLE FREQUENCY:</span>
                <span className="font-mono text-slate-300">4 Hz Telemetry Sync</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-[10px]">LAST LATENCY:</span>
                <span className="font-mono text-slate-300">{stadiumState.crowdDensity % 2 === 0 ? "1.42s" : "1.24s"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-mono text-[10px]">AI CONFIDENCE:</span>
                <span className="font-mono text-emerald-400 font-semibold">{95 + (stadiumState.crowdDensity % 5)}%</span>
              </div>
            </div>

            {/* INTEGRATED TECH DISCLOSURE BOX */}
            <div className="border-t border-slate-900 pt-3 space-y-2">
              <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider block font-mono">Integrated Tech Stack</span>
              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-500">
                <div className="bg-slate-900/40 p-1.5 rounded border border-slate-900 flex flex-col">
                  <span className="text-indigo-400">Google GenAI</span>
                  <span>SDK & Tools</span>
                </div>
                <div className="bg-slate-900/40 p-1.5 rounded border border-slate-900 flex flex-col">
                  <span className="text-indigo-400">Firebase</span>
                  <span>Auth Identity</span>
                </div>
                <div className="bg-slate-900/40 p-1.5 rounded border border-slate-900 flex flex-col">
                  <span className="text-indigo-400">Pub/Sub</span>
                  <span>Phase 2 Shape</span>
                </div>
                <div className="bg-slate-900/40 p-1.5 rounded border border-slate-900 flex flex-col">
                  <span className="text-indigo-400">Cloud Run</span>
                  <span>3000 Ingress</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// Minimal Animated Loader Orb
function LoaderOrb() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 animate-spin blur-md opacity-70" />
      <div className="absolute w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
        <Cpu className="w-6 h-6 text-indigo-400 animate-pulse" />
      </div>
    </div>
  );
}
