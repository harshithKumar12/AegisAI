import { describe, it, expect } from 'vitest';
import { mutateStadiumState, executeToolLocal } from '../../server';
import { DigitalTwinState } from '../types';

// Helper to construct a fresh, predictable stadium state for tests
const createMockState = (): DigitalTwinState => ({
  stadiumName: "AT&T Stadium (Arlington, Texas) — FIFA 2026 Semifinal",
  attendanceCount: 75000,
  capacityLimit: 80000,
  crowdDensity: 70,
  safetyIndex: 98,
  sustainabilityScore: 85,
  gateStatuses: [
    { id: "A", name: "Gate A (North Entrance)", flowRate: 120, waitTime: 10, status: 'normal', capacity: 200 },
    { id: "B", name: "Gate B (East Plaza Plaza Gate)", flowRate: 40, waitTime: 35, status: 'congested', capacity: 150 },
    { id: "C", name: "Gate C (West Plaza Entrance)", flowRate: 160, waitTime: 5, status: 'normal', capacity: 220 },
    { id: "D", name: "Gate D (South VIP Entry)", flowRate: 30, waitTime: 4, status: 'normal', capacity: 80 }
  ],
  facilityStatuses: [
    { id: "wc_east", name: "Restroom - East Concourse", type: 'restroom', occupancy: 90, status: 'crowded', waitLabel: "9 mins" },
    { id: "wc_west", name: "Restroom - West Concourse", type: 'restroom', occupancy: 35, status: 'normal', waitLabel: "1 min" },
    { id: "food_north", name: "Food Court - North Wing", type: 'food', occupancy: 80, status: 'crowded', waitLabel: "12 mins" },
    { id: "food_south", name: "Food Court - South Deck", type: 'food', occupancy: 40, status: 'normal', waitLabel: "3 mins" }
  ],
  resourceUsage: {
    electricityKwh: 1500,
    electricitySavingPct: 15,
    waterLiters: 120000,
    waterSavingPct: 10,
    wasteTons: 12.5,
    carbonFootprintKg: 2500
  },
  transportStatus: {
    metroLineStatus: "Nominal shuttle operation active.",
    shuttleFrequencyMins: 6,
    rideShareWaitMins: 15,
    parkingOccupancyPct: 90,
    congestionIndex: 60
  },
  activeIncidents: [
    {
      id: "inc-1",
      type: "medical",
      location: "Sector B14 - East Upper Deck",
      title: "Solar Heat Dehydration",
      severity: "medium",
      description: "Spectator is suffering from thermal heat fatigue.",
      status: "active",
      timestamp: "13:40",
      recommendedAction: "Dispatch Hydration Squad to Sector B14.",
      assignedAgent: "volunteer"
    },
    {
      id: "inc-2",
      type: "operations",
      location: "Gate B (East Plaza Turnstiles)",
      title: "Turnstile Verification Outage",
      severity: "high",
      description: "Scanner devices offline.",
      status: "active",
      timestamp: "13:35",
      recommendedAction: "Deploy multilingual guides; activate local cache validation.",
      assignedAgent: "operations"
    }
  ]
});

describe('AegisAI StadiumOS — Core Unit & Integration Tests', () => {

  // --- 1. THE SIMULATED DATA-TICK LAYER TESTS ---
  describe('Simulated Data-Tick Layer (State Mutation)', () => {
    it('should incrementally mutate state parameters correctly on each simulated tick', () => {
      const initialState = createMockState();
      const nextState = mutateStadiumState(initialState);

      // Verify attendance counts fluctuate realistically
      expect(nextState.attendanceCount).toBeGreaterThanOrEqual(initialState.attendanceCount - 5);
      expect(nextState.attendanceCount).toBeLessThanOrEqual(initialState.capacityLimit);

      // Verify resource metrics fluctuate realistically
      expect(nextState.resourceUsage.electricityKwh).not.toBeNaN();
      expect(nextState.resourceUsage.waterLiters).not.toBeNaN();
      expect(nextState.resourceUsage.wasteTons).toBeGreaterThanOrEqual(initialState.resourceUsage.wasteTons);

      // Verify crowd density score stays bound within safety range
      expect(nextState.crowdDensity).toBeGreaterThanOrEqual(30);
      expect(nextState.crowdDensity).toBeLessThanOrEqual(95);
    });

    it('should maintain stable gate parameters across fluctuations', () => {
      const initialState = createMockState();
      const nextState = mutateStadiumState(initialState);

      nextState.gateStatuses.forEach((gate, idx) => {
        const origGate = initialState.gateStatuses[idx];
        expect(gate.id).toBe(origGate.id);
        expect(gate.waitTime).toBeGreaterThanOrEqual(2);
        expect(gate.flowRate).toBeGreaterThanOrEqual(10);
      });
    });
  });

  // --- 2. FAN COMPANION AGENT FUNCTION-CALLING TESTS ---
  describe('Fan Companion Agent (Function Calling Integration)', () => {
    it('should query real-time gate telemetry accurately', () => {
      const state = createMockState();
      const result = executeToolLocal('get_gate_status', { gateId: 'B' }, state);

      expect(result).toHaveProperty('id', 'B');
      expect(result).toHaveProperty('status', 'congested');
      expect(result).toHaveProperty('waitTime', 35);
    });

    it('should resolve accessibility routes dynamically', () => {
      const state = createMockState();
      const result = executeToolLocal('get_accessibility_info', { sector: 'Sector East' }, state);

      expect(result).toHaveProperty('sector', 'Sector East');
      expect(result.ramps).toContain('Ramp B14');
      expect(result.elevators).toContain('Elevator Orange');
    });

    it('should query facility congestion status correctly', () => {
      const state = createMockState();
      const result = executeToolLocal('get_facility_status', { facilityId: 'wc_east' }, state);

      expect(result).toHaveProperty('id', 'wc_east');
      expect(result).toHaveProperty('occupancy', 90);
      expect(result).toHaveProperty('status', 'crowded');
    });
  });

  // --- 3. CROWD INTELLIGENCE AGENT THRESHOLD DETECTION TESTS ---
  describe('Crowd Intelligence Agent (Threshold Detection)', () => {
    it('should flag severe bottleneck alerts if a zone has elevated crowd density', () => {
      const state = createMockState();
      state.crowdDensity = 85; // Set density high to cross threshold

      const result = executeToolLocal('get_zone_occupancy', { zoneId: 'East' }, state);
      expect(result.occupancyPercentage).toBeGreaterThanOrEqual(80);
      expect(result.bottleneckAlert).toContain('Heavy queue');
    });

    it('should return nominal flow for low crowd density zones', () => {
      const state = createMockState();
      state.crowdDensity = 40; // Set density low

      const result = executeToolLocal('get_zone_occupancy', { zoneId: 'West' }, state);
      expect(result.occupancyPercentage).toBeLessThan(70);
      expect(result.bottleneckAlert).toBe('Nominal flow');
    });
  });

  // --- 4. COMMAND CENTER ORCHESTRATOR ROUTING TESTS ---
  describe('Command Center Orchestrator (Routing Decisions)', () => {
    it('should trigger rerouting protocols successfully and compute correct flow improvement suggestions', () => {
      const state = createMockState();
      const result = executeToolLocal('trigger_rerouting_protocol', { fromGate: 'B', toGate: 'C' }, state);

      expect(result.success).toBe(true);
      expect(result.recommendedAction).toContain('Reroute traffic from Gate B to Gate C');
      expect(result.recommendedAction).toContain('45 ppm');
    });

    it('should retrieve official grounded SOP playbook guidelines for security and emergency responses', () => {
      const state = createMockState();
      const result = executeToolLocal('search_playbook_sop', { query: 'heat stress thermal' }, state);

      expect(result.retrievedArticle).toContain('Article 7.3');
      expect(result.procedureText).toContain('Volunteer Hydration Squads');
    });
  });

  // --- 5. END-TO-END SYSTEM INTEGRATION FLOW TEST ---
  describe('Unified System Integration Flow', () => {
    it('should execute a full-circle operational flow: occupancy increase -> trigger congestion -> query playbook -> dispatch resolution', () => {
      const state = createMockState();

      // Step A: Influx simulated - crowd density surges and Gate B overflows
      state.crowdDensity = 88;
      state.gateStatuses = state.gateStatuses.map(g => g.id === 'B' ? { ...g, waitTime: 45, status: 'congested' } : g);

      // Step B: Crowd Intelligence assesses Zone East and detects bottleneck
      const crowdReport = executeToolLocal('get_zone_occupancy', { zoneId: 'East' }, state);
      expect(crowdReport.bottleneckAlert).toBe('Heavy queue at Gate B');

      // Step C: Command Center fetches corresponding playbook rules to resolve Gate B congestion
      const playbookSop = executeToolLocal('search_playbook_sop', { query: 'Article 4.1 Gate Bottlenecks' }, state);
      expect(playbookSop.retrievedArticle).toBe('Article 4.1: High Crowd Concentration & Gate Bottlenecks');
      expect(playbookSop.procedureText).toContain('Push dynamic rerouting alerts');

      // Step D: Command Center triggers active rerouting from Gate B to Gate C
      const routingCommand = executeToolLocal('trigger_rerouting_protocol', { fromGate: 'B', toGate: 'C' }, state);
      expect(routingCommand.success).toBe(true);
    });
  });
});
