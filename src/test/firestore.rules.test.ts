import { describe, test, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

let testEnv: RulesTestEnvironment;

describe("AegisAI StadiumOS Firestore Security Rules Suite", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "aegis-stadium-os-test",
      firestore: {
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Helper to establish setup data (seeds)
  async function seedUser(userId: string, data: any) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("users").doc(userId).set(data);
    });
  }

  async function seedIncident(incidentId: string, data: any) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("incidents").doc(incidentId).set(data);
    });
  }

  // --- THE DIRTY DOZEN UNIT TESTS ---

  test("P1: Unauthenticated user cannot create a user profile", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      unauthedDb.collection("users").doc("attacker_uid").set({
        uid: "attacker_uid",
        email: "attacker@evil.com",
        displayName: "Attacker",
        role: "supervisor",
      })
    );
  });

  test("P2: Authenticated user cannot spoof UID inside document body", async () => {
    const victimDb = testEnv.authenticatedContext("victim_uid").firestore();
    await assertFails(
      victimDb.collection("users").doc("victim_uid").set({
        uid: "attacker_uid", // Spoofed UID
        email: "victim@domain.com",
        displayName: "Victim",
        role: "coordinator",
      })
    );
  });

  test("P3: Authenticated user cannot escalate their own role", async () => {
    await seedUser("coordinator_uid", {
      uid: "coordinator_uid",
      email: "coordinator@aegis.com",
      displayName: "Coordinator",
      role: "coordinator",
    });

    const coordDb = testEnv.authenticatedContext("coordinator_uid").firestore();
    await assertFails(
      coordDb.collection("users").doc("coordinator_uid").set({
        uid: "coordinator_uid",
        email: "coordinator@aegis.com",
        displayName: "Coordinator",
        role: "admin", // Escalated
      })
    );
  });

  test("P4: Reject user registration with shadow fields or excessive sizes", async () => {
    const attackerDb = testEnv.authenticatedContext("attacker_uid").firestore();
    await assertFails(
      attackerDb.collection("users").doc("attacker_uid").set({
        uid: "attacker_uid",
        email: "attacker@evil.com",
        displayName: "A".repeat(150), // Over 100 character limit
        role: "supervisor",
        extraShadowField: "malicious_shadow",
      })
    );
  });

  test("P5: Standard coordinator cannot delete their own user profile", async () => {
    await seedUser("coordinator_uid", {
      uid: "coordinator_uid",
      email: "coordinator@aegis.com",
      displayName: "Coordinator",
      role: "coordinator",
    });

    const coordDb = testEnv.authenticatedContext("coordinator_uid").firestore();
    await assertFails(coordDb.collection("users").doc("coordinator_uid").delete());
  });

  test("P6: Authenticated user with 'fan' role cannot create incidents", async () => {
    await seedUser("fan_uid", {
      uid: "fan_uid",
      email: "fan@domain.com",
      displayName: "Guest Fan",
      role: "fan", // Non-permitted role
    });

    const fanDb = testEnv.authenticatedContext("fan_uid").firestore();
    await assertFails(
      fanDb.collection("incidents").doc("new_incident").set({
        id: "new_incident",
        type: "security",
        location: "Sector B14",
        title: "Intrusion",
        severity: "critical",
        description: "Bypassed gates",
        status: "active",
      })
    );
  });

  test("P7: Reject incident creation with invalid/poisoned path ID", async () => {
    await seedUser("coord_uid", {
      uid: "coord_uid",
      email: "coord@aegis.com",
      displayName: "Coordinator",
      role: "coordinator",
    });

    const coordDb = testEnv.authenticatedContext("coord_uid").firestore();
    await assertFails(
      coordDb.collection("incidents").doc("$$$__INVALID_ID__$$$").set({
        id: "$$$__INVALID_ID__$$$",
        type: "operations",
        location: "Gate B",
        title: "Scanner sync outage",
        severity: "high",
        description: "Firmware synchronization failure",
        status: "active",
      })
    );
  });

  test("P8: Prevent modification of immutable fields (severity modification by coordinator)", async () => {
    await seedUser("coord_uid", {
      uid: "coord_uid",
      email: "coord@aegis.com",
      displayName: "Coordinator",
      role: "coordinator",
    });

    await seedIncident("incident_123", {
      id: "incident_123",
      type: "security",
      location: "Sector B14",
      title: "Crowd crush threat",
      severity: "critical",
      description: "Severe local density spikes",
      status: "active",
    });

    const coordDb = testEnv.authenticatedContext("coord_uid").firestore();
    await assertFails(
      coordDb.collection("incidents").doc("incident_123").update({
        severity: "low", // Attacking immutable field
      })
    );
  });

  test("P9: Reject updates with invalid status states (State Shortcutting)", async () => {
    await seedUser("supervisor_uid", {
      uid: "supervisor_uid",
      email: "supervisor@aegis.com",
      displayName: "Supervisor",
      role: "supervisor",
    });

    await seedIncident("incident_123", {
      id: "incident_123",
      type: "security",
      location: "Sector B14",
      title: "Crowd crush threat",
      severity: "critical",
      description: "Severe local density spikes",
      status: "active",
    });

    const superDb = testEnv.authenticatedContext("supervisor_uid").firestore();
    await assertFails(
      superDb.collection("incidents").doc("incident_123").update({
        status: "aborted", // Invalid status type (not active, resolving, resolved)
      })
    );
  });

  test("P10: Reject type poisoning (e.g. setting description to a boolean)", async () => {
    await seedUser("supervisor_uid", {
      uid: "supervisor_uid",
      email: "supervisor@aegis.com",
      displayName: "Supervisor",
      role: "supervisor",
    });

    await seedIncident("incident_123", {
      id: "incident_123",
      type: "security",
      location: "Sector B14",
      title: "Crowd crush threat",
      severity: "critical",
      description: "Severe local density spikes",
      status: "active",
    });

    const superDb = testEnv.authenticatedContext("supervisor_uid").firestore();
    await assertFails(
      superDb.collection("incidents").doc("incident_123").update({
        description: true, // Boolean type injection
      })
    );
  });

  test("P11: Reject unauthenticated query listings on the incidents collection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection("incidents").get());
  });

  test("P12: Sibling write check rejects standalone modifications bypass", async () => {
    const maliciousDb = testEnv.authenticatedContext("unprivileged_uid").firestore();
    await assertFails(
      maliciousDb.collection("incidents").doc("incident_123").update({
        status: "resolved",
      })
    );
  });
});
