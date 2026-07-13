export type AgentType = 
  | 'fan' 
  | 'crowd' 
  | 'command'
  | 'operations' 
  | 'emergency' 
  | 'volunteer' 
  | 'accessibility' 
  | 'sustainability' 
  | 'transport';

export interface Agent {
  id: AgentType;
  name: string;
  role: string;
  description: string;
  color: string;
  icon: string;
  capabilities: string[];
  systemPrompt: string;
}

export type SeverityType = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'active' | 'resolving' | 'resolved';

export interface Incident {
  id: string;
  type: 'medical' | 'security' | 'traffic' | 'operations' | 'resource';
  location: string;
  title: string;
  severity: SeverityType;
  description: string;
  status: IncidentStatus;
  timestamp: string;
  recommendedAction: string;
  assignedAgent?: AgentType;
}

export interface GateStatus {
  id: string;
  name: string;
  flowRate: number; // people per minute
  waitTime: number; // minutes
  status: 'normal' | 'congested' | 'closed';
  capacity: number;
}

export interface FacilityStatus {
  id: string;
  name: string;
  type: 'food' | 'restroom' | 'medical' | 'parking';
  occupancy: number; // percentage (0-100)
  status: 'normal' | 'crowded' | 'full' | 'closed';
  waitLabel?: string;
}

export interface ResourceUsage {
  electricityKwh: number;
  electricitySavingPct: number;
  waterLiters: number;
  waterSavingPct: number;
  wasteTons: number;
  carbonFootprintKg: number;
}

export interface TransportStatus {
  metroLineStatus: string;
  shuttleFrequencyMins: number;
  rideShareWaitMins: number;
  parkingOccupancyPct: number;
  congestionIndex: number; // 0-100
}

export interface DigitalTwinState {
  stadiumName: string;
  attendanceCount: number;
  capacityLimit: number;
  crowdDensity: number; // general percentage
  safetyIndex: number; // percentage
  sustainabilityScore: number; // percentage
  gateStatuses: GateStatus[];
  facilityStatuses: FacilityStatus[];
  resourceUsage: ResourceUsage;
  transportStatus: TransportStatus;
  activeIncidents: Incident[];
}

export interface AgentChatHistory {
  id: string;
  sender: 'user' | 'agent' | 'system' | 'planning' | 'critic';
  agentId?: AgentType;
  message: string;
  timestamp: string;
  traces?: any[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'crowd' | 'security' | 'sustainability' | 'logistics';
  sourceAgent: AgentType;
  actionable: boolean;
  applied: boolean;
  timestamp: string;
}
