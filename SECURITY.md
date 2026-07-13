# AegisAI StadiumOS — Security Policy & Threat Model

Welcome to the security and compliance policy documentation for **AegisAI StadiumOS** (AegisAI Stadium Operating System). As a mission-critical smart arena management system operating at high physical density, security is paramount.

---

## 1. Vulnerability Disclosure Process

We welcome security research and reports from ethical hackers. If you discover a vulnerability within AegisAI StadiumOS, please report it immediately:

- **Contact Email:** [security@aegis-stadium.ai](mailto:security@aegis-stadium.ai)
- **Encryption Key:** Please encrypt sensitive disclosures with our PGP Key (`0xAEGIS_SEC_KEY`).
- **Response SLA:** We acknowledge all security disclosures within **24 hours** and aim to provide a detailed remediation timeline within **72 hours**.
- **Coordinated Disclosure:** We request that you do not publish details of any unresolved vulnerability until we have had reasonable time to patch it (typically 30 days).

---

## 2. Threat Model: Top 5 Critical StadiumOS Threats

Below is our active threat assessment targeting the smart stadium deployment infrastructure.

| Threat ID | Threat Name | Threat Description | Severity | Remediation / Mitigations |
|---|---|---|---|---|
| **STR-01** | **Telemetry Pipeline Poisoning** | Malicious injection of spoofed MQTT/PubSub packets (e.g. fake gate flow rates, high carbon readings) to force incorrect automated alerts. | **High** | End-to-end payload signature signing; cryptographic validation of scanner hardware IDs at the edge. |
| **STR-02** | **Unauthorized Routing Spoofing** | Attacker intercepts and issues spoofed rerouting commands (e.g. diverting all crowd flows toward a crowded sector), risking a crowd crush. | **Critical** | Zero-trust backend validation; all client-triggered actions undergo mandatory server-side state confirmation. |
| **STR-03** | **Coordinator Session Hijacking** | Session hijacking of VIP/Coordinator logins to gain control of active tactical logs and incident assignees. | **High** | Secure HTTPOnly Session Cookies; JSON Web Token expiration limited to 15 minutes; Firebase Auth MFA requirements. |
| **STR-04** | **Privilege Escalation via Client SDK** | Attacker registers a user account and directly manipulates firestore collections to elevate their role to `admin` or `supervisor`. | **High** | Attribute-Based Access Control in `firestore.rules` preventing users from self-promoting roles or altering immutable fields. |
| **STR-05** | **API Key and Secret Leakage** | Exposure of high-value Gemini API or cloud credentials inside the public frontend bundle, allowing external key abuse. | **High** | Complete segregation of LLM SDK calls behind Express API proxies; server-side retrieval of credentials via secret managers. |

---

## 3. Cryptographic Key & API Exposure Verification

We have verified that the **Google Gemini API Key** and other cloud secrets are protected:

1. **Zero Client-Side Imports:** Neither the `@google/genai` library nor public climate/monitoring SDKs are imported into the browser bundle (`src/App.tsx` or components).
2. **Server-Side API Proxy:** All LLM model orchestration, function-calling, and retrieval-augmented generation (RAG) are managed exclusively behind Express server controllers on the Node.js backend.
3. **No `VITE_` Secrets:** None of the secret environment variables are prefixed with `VITE_`, preventing Vite from embedding them into public frontend static assets during compilation.

---

## 4. PII (Personally Identifiable Information) Protection Plan

In compliance with international GDPR, HIPAA, and CCPA standards for event spectators, we implement a strict **PII Split-Collection Strategy**:

- **PII Isolation:** Spectator emails and registration forms are separated from the core telemetry feed.
- **Access Authorization:** Read operations on spectator registries are explicitly restricted to the resource owner (`request.auth.uid == userId`) or an admin group, blocking blanket listings.
- **Data Minimization:** No personal spectator details are stored on local browser caches or memory-ticks.
