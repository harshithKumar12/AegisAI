import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  AgentType, 
  Agent, 
  AgentChatHistory, 
  DigitalTwinState 
} from '../types';
import { 
  Compass, 
  Users, 
  Activity, 
  ShieldAlert, 
  ClipboardList, 
  Heart, 
  Leaf, 
  Truck, 
  Send, 
  Bot, 
  Sparkles, 
  Cpu, 
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

interface AgentControlCenterProps {
  stadiumState: DigitalTwinState;
  onStateUpdate: (newState: DigitalTwinState) => void;
  selectedAgent?: AgentType;
  onSelectAgent?: (agent: AgentType) => void;
  activeRole?: 'command' | 'fan' | 'docs';
  user?: any;
}

const AGENTS_METADATA: Record<AgentType, Agent> = {
  fan: {
    id: 'fan',
    name: 'Aegis Fan Companion',
    role: 'Smart Navigation & Fan Experience Agent',
    description: 'Assists fans in finding gates, predicting arrival times, choosing low-traffic entrances, and translating services.',
    color: 'border-blue-500/30 text-blue-400 bg-blue-950/20 shadow-blue-500/5',
    icon: 'Compass',
    capabilities: ['Dynamic ETA Calculations', 'Multilingual Translation', 'Accessibility Path Planning', 'Crowd-Averse Route Selection'],
    systemPrompt: 'You are the Aegis Fan Companion AI assistant for the FIFA World Cup 2026. Guide fans with stadium directions, transit ETAs, gate wait times, and services.'
  },
  crowd: {
    id: 'crowd',
    name: 'Aegis Crowd Intelligence',
    role: 'Live Flow & Queue Distribution Agent',
    description: 'Uses live occupancy tracking and predictive modeling to detect bottlenecks and suggest crowd-redistribution protocols.',
    color: 'border-amber-500/30 text-amber-400 bg-amber-950/20 shadow-amber-500/5',
    icon: 'Users',
    capabilities: ['Bottleneck Prediction', 'Flow Redistribution Guidance', 'Gate Capacity Overrides', 'Evacuation Rate Modeling'],
    systemPrompt: 'You are the Aegis Crowd Intelligence coordinator. Monitor queue congestion levels, gate wait-times, and propose crowd redirection routes.'
  },
  command: {
    id: 'command',
    name: 'Aegis Command Center',
    role: 'Central Operations & Incident Command',
    description: 'Coordinates multi-agency responses, manages system-wide stadium telemetry, and triggers emergency playbook SOPs.',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20 shadow-emerald-500/5',
    icon: 'Activity',
    capabilities: ['Incident Dispatch Routing', 'System Telemetry Orchestration', 'FIFA SOP Playbook Verification', 'Facility Congestion Alerts'],
    systemPrompt: 'You are the Aegis Command Center AI. Orchestrate responses across stadium operators, security staff, facility teams, and medical units.'
  },
  operations: {
    id: 'operations',
    name: 'Aegis Operations Control',
    role: 'Physical Infrastructure & Maintenance Monitor',
    description: 'Monitors smart grid electricity, wastewater flow, restroom sanitization, food court supply, and equipment health.',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20 shadow-emerald-500/5',
    icon: 'Activity',
    capabilities: ['Predictive Maintenance Logs', 'Smart Restroom Dispatch', 'Power Grid Optimization', 'Concession Inventory Sync'],
    systemPrompt: 'You are the Stadium Operations Agent. You track mechanical, electrical, and plumbing (MEP) systems, restroom sanitization intervals, power demand, and restroom lines. Recommend tactical maintenance routines, alert sanitization crews to sector surges, and adjust HVAC load to optimize smart stadium electricity.'
  },
  emergency: {
    id: 'emergency',
    name: 'Aegis Emergency Dispatch',
    role: 'High-Priority Safety & Crisis Response Agent',
    description: 'Automates crisis routing, security incident detection, medical dispatch paths, and stadium fire safety evacuations.',
    color: 'border-red-500/30 text-red-400 bg-red-950/20 shadow-red-500/5',
    icon: 'ShieldAlert',
    capabilities: ['Fastest First Aid Route', 'Fire Evacuation Corridors', 'Suspicious Incident Flagging', 'Ambulance Entry Coordination'],
    systemPrompt: 'You are the Emergency Response AI. You handle high-priority medical, security, and hazard alerts. Calculate optimal ambulance and responder paths, prioritize security alerts, recommend fire egress paths based on current occupancy, and interface with regional 911 dispatch. Tone is urgent, exact, and command-focused.'
  },
  volunteer: {
    id: 'volunteer',
    name: 'Aegis Volunteer Copilot',
    role: 'Staff Onboarding & Task Translation Assistant',
    description: 'Acts as a voice and knowledge assistant to translate conversations, parse FAQ manuals, and schedule volunteer shifts.',
    color: 'border-violet-500/30 text-violet-400 bg-violet-950/20 shadow-violet-500/5',
    icon: 'ClipboardList',
    capabilities: ['Instant Manual Grounding', 'Dual-Way Conversation Translation', 'Dynamic Crew Shift Routing', 'Volunteer FAQ Assistance'],
    systemPrompt: 'You are the Volunteer Copilot Agent. You onboard and assist stadium volunteers during FIFA 2026. Translate instructions into the fan\'s native language, resolve protocol disputes, locate standard security rules, and assist volunteers with task hand-offs. Professional, encouraging, and clear.'
  },
  accessibility: {
    id: 'accessibility',
    name: 'Aegis Accessibility Officer',
    role: 'Universal Design & Special Assistance Specialist',
    description: 'Ensures wheelchair-friendly navigation paths, elevator access optimization, and audio-to-text/text-to-speech options.',
    color: 'border-pink-500/30 text-pink-400 bg-pink-950/20 shadow-pink-500/5',
    icon: 'Heart',
    capabilities: ['Wheelchair-Optimized Routing', 'Elevator Queue Management', 'Multimodal Captioning', 'Sensory-Friendly Space Locator'],
    systemPrompt: 'You are the Accessibility Agent. Your focus is to guarantee a seamless stadium experience for neurodiverse fans and fans with physical or visual impairments. Guide users to elevator-access corridors, wheelchair ramps, and quiet, sensory-friendly rooms. Keep tone compassionate, patient, and highly accessible.'
  },
  sustainability: {
    id: 'sustainability',
    name: 'Aegis Green Guardian',
    role: 'Carbon Neutrality & Resource Conservation Agent',
    description: 'Tracks waste bins, predicts food demand to prevent surplus, optimizes solar-plus-storage, and computes carbon scores.',
    color: 'border-green-500/30 text-green-400 bg-green-950/20 shadow-green-500/5',
    icon: 'Leaf',
    capabilities: ['Food Surplus Analytics', 'Solar Energy Distribution', 'Carbon Footprint Tracking', 'Smart Waste Collection Scheduling'],
    systemPrompt: 'You are the Sustainability Agent. You manage stadium waste recycling bin fullness, predict pre-match and post-match food demand, manage renewable microgrid battery storage, and analyze carbon emissions. Suggest adjustments to stadium lighting and waste routing to reduce ecological footprint.'
  },
  transport: {
    id: 'transport',
    name: 'Aegis Logistics & Transit',
    role: 'Intermodal Transit & Regional Traffic Coordinator',
    description: 'Maintains ride-sharing queues, coordinates light-rail line timing, forecasts highway backups, and plans parking.',
    color: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/20 shadow-indigo-500/5',
    icon: 'Truck',
    capabilities: ['Post-Match Congestion Modeling', 'Metro Transit Frequency Shifts', 'Smart Ride-Share Allocations', 'Real-Time Parking Guidance'],
    systemPrompt: 'You are the Transportation Agent. You coordinate stadium parking flow, ride-share pick-up lines, and public transit synchronization. Optimize regional traffic around the stadium, forecast post-match transit surge timelines, and propose adaptive parking configurations. Concise, data-driven, and logistics-minded.'
  }
};

const SUGGESTED_QUERIES: Record<AgentType, string[]> = {
  fan: [
    "I am near Section B14. Recommend the fastest path to a sensory-friendly quiet room.",
    "Which gate has the shortest queue right now?",
    "Generate a Spanish translation for 'Where is the medical tent and hydration counter?'"
  ],
  crowd: [
    "Predict the bottlenecks if 10,000 fans leave simultaneously via Gate B.",
    "Formulate a crowd redistribution plan for the Gate B queue overflow.",
    "Estimate overall evacuation times for Sector South."
  ],
  command: [
    "Search official SOP manual protocols for heat stress guidelines.",
    "Verify the scanner outage at Gate B and retrieve unresolved incidents.",
    "Show active incidents needing medical responder dispatch routes."
  ],
  operations: [
    "Adjust stadium HVAC cooling parameters to counter the 39°C (102°F) external heat index.",
    "Draft a localized maintenance dispatch for the smart restroom line at East Concourse.",
    "Run automated diagnostics on turnstile validation scanners at Gate B."
  ],
  emergency: [
    "Coordinate emergency medical responders for the sun-exposed solar heat dehydration incident.",
    "Establish an emergency access corridor for Gate B emergency support.",
    "Trigger emergency medical dispatcher alert for Sector B14."
  ],
  volunteer: [
    "Generate an announcement script in French and Spanish for turnstile flow redirection.",
    "Look up volunteer shift guidelines for high-intensity matches.",
    "Check safety checklists for volunteer squads monitoring crowd density."
  ],
  accessibility: [
    "Plot an elevator-access step-free path for fans near Sector B14 with mobility needs.",
    "Find the location of the nearest sensory-friendly station.",
    "Retrieve accessibility accommodation procedures for visually impaired spectators."
  ],
  sustainability: [
    "Evaluate solar microgrid battery reserves under peak HVAC cooling load.",
    "Schedule smart waste recycling collections for high-occupancy sectors.",
    "Calculate the current carbon footprint index and solar generation offset."
  ],
  transport: [
    "Optimize post-match shuttle frequency loops to Dallas/Fort Worth Transit lanes.",
    "Verify parking deck occupancy and update regional digital signage.",
    "Calculate ride-share queue wait times and dispatch supplemental shuttles."
  ]
};

function AgentControlCenter({ 
  stadiumState, 
  onStateUpdate: _onStateUpdate,
  selectedAgent: controlledSelectedAgent,
  onSelectAgent,
  activeRole,
  user
}: AgentControlCenterProps) {
  const [localSelectedAgent, setLocalSelectedAgent] = useState<AgentType>('crowd');
  const selectedAgent = controlledSelectedAgent !== undefined ? controlledSelectedAgent : localSelectedAgent;
  const setSelectedAgent = (agent: AgentType) => {
    if (onSelectAgent) {
      onSelectAgent(agent);
    } else {
      setLocalSelectedAgent(agent);
    }
  };
  const [chatHistory, setChatHistory] = useState<Record<AgentType, AgentChatHistory[]>>(() => {
    const initial: Partial<Record<AgentType, AgentChatHistory[]>> = {};
    Object.keys(AGENTS_METADATA).forEach((key) => {
      const type = key as AgentType;
      initial[type] = [
        {
          id: `seed-${type}`,
          sender: 'agent',
          agentId: type,
          message: `Hello! I am the ${AGENTS_METADATA[type].name}. I have monitored the current stadium twin states and I am ready to process your smart stadium requests. Choose a query or type below!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
    });
    return initial as Record<AgentType, AgentChatHistory[]>;
  });

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Gemini Live Voice Integration States
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('Standby - Mic Off');
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  const [soundwaveHeights, setSoundwaveHeights] = useState([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);

  const recognitionRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, selectedAgent]);

  // Animate custom soundwave visualization based on speaking/listening states
  useEffect(() => {
    if (isListening || isSpeaking) {
      const animateWave = () => {
        setSoundwaveHeights(prev => prev.map(() => {
          const maxMultiplier = isSpeaking ? 32 : 18;
          const minVal = isSpeaking ? 8 : 4;
          return Math.floor(Math.random() * maxMultiplier) + minVal;
        }));
        animationRef.current = requestAnimationFrame(animateWave);
      };
      animateWave();
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setSoundwaveHeights([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, isSpeaking]);

  // Clean speech synthesis synthesis playback on agent selection change
  useEffect(() => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [selectedAgent]);

  const speakAgentResponse = (text: string) => {
    if (!audioFeedbackEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any pending speech

    // Clean text of markdown characters, bullets, lists, asterisks
    const cleanedText = text
      .replace(/\*\*?/g, '')
      .replace(/[-*]\s+/g, '')
      .replace(/#+\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Choose appropriate voice/pitch matching an AI assistant
    const voices = window.speechSynthesis.getVoices();
    const desiredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
    if (desiredVoice) utterance.voice = desiredVoice;
    
    utterance.pitch = 1.0;
    utterance.rate = 1.05;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeechTranscript(`Agent speaking: "${cleanedText.substring(0, 50)}..."`);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechTranscript(isListening ? 'Listening for command...' : 'Aegis Live Soundwave Idle');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechRecognitionToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("HTML5 Speech Recognition is not supported in this browser. Running text simulation mode.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechTranscript('Microphone off');
      return;
    }

    // Initialize speech recognition instance
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      window.speechSynthesis?.cancel(); // Stop speaking if mic turns on
      setIsSpeaking(false);
      setSpeechTranscript('Listening for query...');
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setSpeechTranscript(`Recognized: "${speechToText}"`);
      handleSend(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      setSpeechTranscript(`Voice error: ${event.error || 'Unavailable'}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async (msgText: string) => {
    if (!msgText.trim() || loading) return;

    const userMsg: AgentChatHistory = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      agentId: selectedAgent,
      message: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => ({
      ...prev,
      [selectedAgent]: [...prev[selectedAgent], userMsg]
    }));
    setInputVal('');
    setLoading(true);

    try {
      const token = (window as any).aegisCsrfToken || '';
      const response = await fetch('/api/chat-agent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Aegis-CSRF-Token': token
        },
        body: JSON.stringify({
          agentId: selectedAgent,
          message: msgText,
          contextState: stadiumState,
          role: activeRole || 'fan',
          operator: user?.displayName || user?.email || "Command Center Operator"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const agentReply: AgentChatHistory = {
          id: `reply-${Date.now()}`,
          sender: 'agent',
          agentId: selectedAgent,
          message: data.responseText,
          timestamp: data.timestamp,
          traces: data.traces
        };
        setChatHistory(prev => ({
          ...prev,
          [selectedAgent]: [...prev[selectedAgent], agentReply]
        }));

        // Read the AI reply out loud dynamically
        speakAgentResponse(data.responseText);
      } else {
        throw new Error(data.error || "Failed to communicate with agent.");
      }
    } catch (err: any) {
      console.error(err);
      const systemError: AgentChatHistory = {
        id: `err-${Date.now()}`,
        sender: 'system',
        message: `Connection disrupted: ${err.message || 'Offline fallback triggered. Local parameters calibrated.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => ({
        ...prev,
        [selectedAgent]: [...prev[selectedAgent], systemError]
      }));
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (id: string, className = "w-5 h-5") => {
    switch (id) {
      case 'fan': return <Compass className={className} />;
      case 'crowd': return <Users className={className} />;
      case 'operations': return <Activity className={className} />;
      case 'emergency': return <ShieldAlert className={className} />;
      case 'volunteer': return <ClipboardList className={className} />;
      case 'accessibility': return <Heart className={className} />;
      case 'sustainability': return <Leaf className={className} />;
      case 'transport': return <Truck className={className} />;
      default: return <Bot className={className} />;
    }
  };

  const currentMeta = AGENTS_METADATA[selectedAgent];

  return (
    <div id="agent-control-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl">
      
      {/* Agents Selection Grid (4 cols / 12) */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            AI Operating Agents
          </h3>
          <p className="text-xs text-slate-400">Select active agent node to monitor and direct</p>
        </div>

        <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
          {Object.values(AGENTS_METADATA).map((agent) => {
            const isActive = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent.id);
                  setVoiceModeActive(false); // reset voice pane
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-left transition-all duration-300 min-w-[200px] lg:min-w-0 ${
                  isActive 
                    ? `${agent.color} border-current/40 shadow-lg` 
                    : 'border-slate-800/80 bg-slate-900/20 text-slate-400 hover:border-slate-700/60 hover:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl bg-slate-950/60 transition-colors ${isActive ? 'text-current' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {getAgentIcon(agent.id, "w-4 h-4")}
                </div>
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h4 className="text-xs font-semibold tracking-wide truncate">{agent.name}</h4>
                  </div>
                  <p className="text-[10px] opacity-75 truncate">{agent.role}</p>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Agent Chat Console (8 cols / 12) */}
      <div className="lg:col-span-8 flex flex-col h-[560px] rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden relative">
        
        {/* Agent Top Bar info */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400`}>
              {getAgentIcon(selectedAgent, "w-5 h-5")}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                {currentMeta.name}
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-400">Node Online</span>
              </h4>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">{currentMeta.role}</p>
            </div>
          </div>
          
          {/* Gemini Live Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceModeActive(!voiceModeActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${voiceModeActive ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] animate-pulse' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'}`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Gemini Live Voice</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Live
            </div>
          </div>
        </div>

        {/* Capability Tags banner */}
        <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/20 flex gap-2 overflow-x-auto scrollbar-none text-[10px]">
          <span className="text-slate-500 font-semibold uppercase tracking-wider self-center shrink-0">Capabilities:</span>
          {currentMeta.capabilities.map((cap, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-full bg-indigo-950/30 border border-indigo-900/40 text-indigo-300 font-medium shrink-0">
              {cap}
            </span>
          ))}
        </div>

        {/* INTEGRATED GEMINI LIVE VOICE PANEL */}
        {voiceModeActive ? (
          <div className="flex-1 flex flex-col justify-between p-6 bg-radial-gradient from-slate-900/40 via-slate-950 to-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 via-indigo-500/2 to-transparent pointer-events-none"></div>

            {/* Top info and Speech Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400 z-10">
              <span className="font-mono text-indigo-400 uppercase tracking-widest text-[9px] flex items-center gap-1">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                Live Audio Session
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = !audioFeedbackEnabled;
                    setAudioFeedbackEnabled(next);
                    if (!next && isSpeaking) window.speechSynthesis?.cancel();
                  }}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                  title="Toggle Speech Feedback"
                >
                  {audioFeedbackEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>
                <span className="text-[10px] font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  ENG-TTS v3.1
                </span>
              </div>
            </div>

            {/* Glowing Soundwave Centerpiece */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-10">
              <div className="relative w-40 h-40 rounded-full bg-slate-900/50 border border-slate-800/80 flex items-center justify-center shadow-inner group">
                {/* Layered Pulsing Rings */}
                <div className={`absolute inset-0 rounded-full border border-indigo-500/10 transition-all duration-1000 ${isListening ? 'animate-ping border-indigo-500/20' : ''}`}></div>
                <div className={`absolute inset-4 rounded-full border border-red-500/10 transition-all duration-1000 ${isSpeaking ? 'scale-110 border-red-500/20' : ''}`}></div>
                <div className="absolute inset-2 rounded-full bg-slate-950/80 shadow-2xl"></div>

                {/* Microscopic active Sound bars */}
                <div className="absolute flex items-center justify-center gap-1 w-full px-4 h-16 pointer-events-none">
                  {soundwaveHeights.map((h, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-75 ${isSpeaking ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : isListening ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-slate-700'}`}
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>

                {/* Big Button Center */}
                <button
                  onClick={handleSpeechRecognitionToggle}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${isListening ? 'bg-indigo-600 text-white shadow-[0_0_25px_rgba(79,70,229,0.5)] scale-105' : isSpeaking ? 'bg-red-600 text-white shadow-[0_0_25px_rgba(220,38,38,0.5)]' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'}`}
                >
                  {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8 text-slate-400" />}
                </button>
              </div>

              {/* Status Transcription Box */}
              <div className="text-center space-y-1.5 max-w-sm">
                <p className={`text-xs font-medium tracking-wide ${isListening ? 'text-indigo-400' : isSpeaking ? 'text-red-400' : 'text-slate-400'}`}>
                  {isListening ? 'Aegis is listening...' : isSpeaking ? 'Agent speaking...' : 'Gemini Live Voice Ready'}
                </p>
                <div className="bg-slate-900/60 border border-slate-850 px-4 py-2.5 rounded-2xl min-h-[44px] flex items-center justify-center text-center">
                  <p className="text-[11px] text-slate-300 font-mono italic leading-relaxed">
                    {speechTranscript}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Voice Prompt Shortcuts */}
            <div className="space-y-1.5 z-10">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider text-center block">Suggested Voice Commands</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setInputVal("Which gate has the shortest queue right now?");
                    handleSend("Which gate has the shortest queue right now?");
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-indigo-500/20 text-[10px] text-slate-400 text-left hover:text-indigo-400 transition truncate"
                >
                  "Which gate is shortest?"
                </button>
                <button
                  onClick={() => {
                    setInputVal("Recommend evacuation routing for Sector South.");
                    handleSend("Recommend evacuation routing for Sector South.");
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-indigo-500/20 text-[10px] text-slate-400 text-left hover:text-indigo-400 transition truncate"
                >
                  "South sector evacuation"
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* STANDARD TEXT CHAT MESSAGES FRAME */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory[selectedAgent]?.map((msg) => {
                const isUser = msg.sender === 'user';
                const isSystem = msg.sender === 'system';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                  >
                    {isSystem ? (
                      <div className="w-full text-center px-4 py-2 rounded-xl bg-amber-950/10 border border-amber-900/30 text-amber-500 text-xs flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        {msg.message}
                      </div>
                    ) : (
                      <div className={`flex gap-2.5 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isUser ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-950 border-slate-800 text-indigo-400'}`}>
                          {isUser ? 'OP' : getAgentIcon(selectedAgent, "w-4 h-4")}
                        </div>
                        <div>
                          <div className={`rounded-2xl p-3 text-xs leading-relaxed ${isUser ? 'bg-indigo-600 text-slate-100 rounded-tr-none' : 'bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-tl-none shadow-sm'}`}>
                            {msg.message.split('\n').map((line, lidx) => (
                              <p key={lidx} className={line.startsWith('*') || line.startsWith('-') ? 'pl-2 py-0.5 text-slate-300 animate-in fade-in slide-in-from-left-1 duration-150' : 'mb-1'}>
                                {line}
                              </p>
                            ))}

                            {/* Render AI Reasoning Traces & Function Call Logs */}
                            {msg.traces && msg.traces.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-800/50 space-y-2 text-[10px]">
                                <div className="flex items-center gap-1.5 text-indigo-400 font-mono font-bold tracking-wider uppercase text-[9px]">
                                  <Cpu className="w-3.5 h-3.5 animate-pulse" />
                                  <span>Agent Reasoning & Tool Execution Trace</span>
                                </div>
                                {msg.traces.map((trace: any, tidx: number) => (
                                  <div key={tidx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 font-mono">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-emerald-400 font-bold">fn: {trace.functionName}()</span>
                                      <span className="text-slate-500 text-[8px]">Status: Grounded Execution</span>
                                    </div>
                                    <div className="text-slate-400 text-[9px] bg-slate-900/50 p-1.5 rounded border border-slate-850">
                                      <span className="text-indigo-300 font-bold block mb-0.5">Parameters (Arguments):</span>
                                      <pre className="whitespace-pre-wrap overflow-x-auto text-slate-300 text-[8px]">{JSON.stringify(trace.args, null, 2)}</pre>
                                    </div>
                                    <div className="text-slate-400 text-[9px] bg-slate-900/50 p-1.5 rounded border border-slate-850">
                                      <span className="text-emerald-400 font-bold block mb-0.5">Response (Telemetry Output):</span>
                                      <pre className="whitespace-pre-wrap overflow-x-auto text-slate-300 text-[8px]">{JSON.stringify(trace.result, null, 2)}</pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1 block px-1 text-right">{msg.timestamp}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400">
                      <Bot className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="rounded-2xl p-3 bg-slate-900 border border-slate-800 rounded-tl-none">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggested Queries Tray */}
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-900 flex gap-2 overflow-x-auto scrollbar-none">
              {SUGGESTED_QUERIES[selectedAgent].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/30 text-[10px] text-slate-400 hover:text-indigo-400 transition shrink-0 max-w-[260px] truncate"
                  title={q}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputVal);
              }}
              className="p-3 border-t border-slate-800 bg-slate-900/20 flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={`Instruct ${currentMeta.name}...`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || loading}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-slate-100 transition shadow-[0_0_15px_rgba(79,70,229,0.2)] shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

      </div>

    </div>
  );
}

export default memo(AgentControlCenter);
