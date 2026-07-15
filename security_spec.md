# AegisAI StadiumOS — Firestore Security Hardening Specification

This document defines the formal safety criteria, data invariants, and security-testing vectors used to harden the Firestore database for AegisAI StadiumOS. This satisfies the **Phase 0: Payload-First Security TDD** process of the Firebase Integration methodology.

---

## 1. Core Data Invariants

1. **User Identity Invariant (Auth Binding)**:
   - A User document located at `/users/{userId}` can only be created, modified, or deleted if the authenticated `request.auth.uid` matches `{userId}`.
   - User roles can only be initialized upon creation. Once created, only users with verified administrative permissions (`admin`) can modify or elevate roles. Non-admin users cannot promote themselves or others to `admin` or `supervisor`.

2. **Incident Authority Invariant**:
   - Incidents can only be submitted (`create`) by authenticated users with a registered role of `admin` or `coordinator`. Guest fans cannot report operational incidents.
   - Any authenticated user of the system can view (`get`, `list`) incidents to allow transparency and digital twin synchronization.
   - Only administrative personnel, coordinators, or dispatch supervisors (`admin`, `coordinator`, `supervisor`) are authorized to modify (`update`) incidents.
   - Critical and immutable fields such as the incident `id`, `type`, `location`, `title`, and `severity` must be protected against modifications post-creation. Updates are strictly restricted to state-shifting fields (`status`, `recommendedAction`, `assignedAgent`).

3. **Temporal Invariant**:
   - Client-provided timestamps are inherently untrusted. Security rules must mandate that document timestamps default to `request.time` (the Firestore server-side execution time) to prevent historical state spoofing.

---

## 2. The "Dirty Dozen" Threat Payloads

The following twelve attack payloads are programmatically designed to attempt violations of Identity, Integrity, and State across the AegisAI StadiumOS Firestore database. These payloads must all trigger a `PERMISSION_DENIED` error.

### User Collection Attack Vectors

1. **Payload 1: Unauthenticated Creation**
   - *Threat*: Anonymous/unauthenticated user tries to register a profile.
   - *Target*: `create` on `/users/attacker_uid`
   - *Payload*: `{"uid": "attacker_uid", "email": "attacker@evil.com", "displayName": "Attacker", "role": "supervisor"}`
   - *Auth context*: Unauthenticated (`null`)

2. **Payload 2: Identity Spoofing (UID Mismatch)**
   - *Threat*: Authenticated user `victim_uid` tries to write to `/users/victim_uid` but sets the `uid` inside the data body to `attacker_uid`.
   - *Target*: `create` on `/users/victim_uid`
   - *Payload*: `{"uid": "attacker_uid", "email": "victim@domain.com", "displayName": "Victim", "role": "coordinator"}`
   - *Auth context*: Authenticated as `victim_uid`

3. **Payload 3: Self-Privilege Escalation**
   - *Threat*: Authenticated coordinator attempts to update their own role directly to `admin`.
   - *Target*: `update` on `/users/coordinator_uid`
   - *Payload*: `{"uid": "coordinator_uid", "email": "coordinator@aegis.com", "displayName": "Coordinator", "role": "admin"}`
   - *Auth context*: Authenticated as `coordinator_uid` (current role: `coordinator`)

4. **Payload 4: Invalid Format & Resource Poisoning**
   - *Threat*: Attacker attempts to upload a 50KB garbage string as their `displayName` or inject arbitrary fields.
   - *Target*: `create` on `/users/attacker_uid`
   - *Payload*: `{"uid": "attacker_uid", "email": "attacker@evil.com", "displayName": "[50KB GARBAGE STRING]", "role": "supervisor", "extraShadowField": "malicious"}`
   - *Auth context*: Authenticated as `attacker_uid`

5. **Payload 5: Unauthorized Account Deletion**
   - *Threat*: Standard coordinator attempts to delete their own user account (only `admin` may delete accounts).
   - *Target*: `delete` on `/users/coordinator_uid`
   - *Auth context*: Authenticated as `coordinator_uid`

---

### Incident Collection Attack Vectors

6. **Payload 6: Unauthorized Ingress Incident Creation (Fan Role)**
   - *Threat*: A spectator with the "fan" role tries to report an operational incident directly into the database.
   - *Target*: `create` on `/incidents/new_incident`
   - *Payload*: `{"id": "new_incident", "type": "security", "location": "Sector B14", "title": "Bypass gates", "severity": "critical", "description": "Intrusion", "status": "active"}`
   - *Auth context*: Authenticated as `fan_uid` (role: guest/fan)

7. **Payload 7: Invalid ID Format (ID Poisoning/Junk characters)**
   - *Threat*: Attacker tries to create an incident with a highly fragmented or dangerously long ID containing injection symbols.
   - *Target*: `create` on `/incidents/$$$__INVALID_ID__$$$`
   - *Payload*: `{"id": "$$$__INVALID_ID__$$$", "type": "medical", "location": "Gate B", "title": "Scanner failure", "severity": "high", "description": "Thermal heat stress", "status": "active"}`
   - *Auth context*: Authenticated as `coordinator_uid` (role: `coordinator`)

8. **Payload 8: Immutable Field Tampering (Severity Downgrade)**
   - *Threat*: Threat actor attempts to downgrade a critical security incident's severity to bypass automated dispatch queues.
   - *Target*: `update` on `/incidents/incident_123`
   - *Payload*: `{"id": "incident_123", "type": "security", "location": "Sector B14", "title": "Crowd crushing", "severity": "low", "description": "Overcrowded", "status": "active"}`
   - *Auth context*: Authenticated as `coordinator_uid` (current severity: `critical`)

9. **Payload 9: State Shortcutting (Terminal State Bypass)**
   - *Threat*: Attacker attempts to inject random statuses not defined in the finite-state enum (e.g. `status: "aborted"`).
   - *Target*: `update` on `/incidents/incident_123`
   - *Payload*: `{"id": "incident_123", "type": "security", "location": "Sector B14", "title": "Crowd crushing", "severity": "critical", "description": "Overcrowded", "status": "aborted"}`
   - *Auth context*: Authenticated as `supervisor_uid` (role: `supervisor`)

10. **Payload 10: Value Type Poisoning**
    - *Threat*: Attacker attempts to change the type of an incident description to a boolean or list to crash parsing microservices.
    - *Target*: `update` on `/incidents/incident_123`
    - *Payload*: `{"id": "incident_123", "type": "security", "location": "Sector B14", "title": "Crowd crushing", "severity": "critical", "description": true, "status": "resolving"}`
    - *Auth context*: Authenticated as `supervisor_uid` (role: `supervisor`)

11. **Payload 11: Mass Scraping/Query Poisoning**
    - *Threat*: Client attempts to execute a blanket query on incidents without any authentication.
    - *Target*: `list` on `/incidents`
    - *Auth context*: Unauthenticated (`null`)

12. **Payload 12: Unauthorized Sibling Write (existsAfter Atomicity)**
    - *Threat*: Attacker tries to modify an incident status to 'resolved' without passing proper audit logs or metadata sync.
    - *Target*: `update` on `/incidents/incident_123`
    - *Payload*: `{"status": "resolved"}`
    - *Auth context*: Authenticated as `victim_uid`

---

## 3. The Rules Unit Test Code

Below is the complete testing code (unit tests) that simulates these payloads against the security rules using the `@firebase/rules-unit-testing` framework.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
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
```
