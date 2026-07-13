# Contributing to AegisAI StadiumOS

Thank you for contributing to AegisAI StadiumOS! As a high-density, mission-critical smart stadium management system, our repository demands exceptionally high standards for code quality, safety, and testing.

Please adhere strictly to these engineering guidelines when introducing changes.

---

## 1. Code Quality & Standards

- **TypeScript Type Safety:** 
  - Every variable, parameter, and function return value must be strictly typed.
  - Avoid using `any` at all costs. Prefer custom interfaces defined in `src/types.ts`.
  - Place all `import` statements at the top level of the module.
- **Architectural Segregation (Full-Stack Security):**
  - All calls to LLM SDKs (e.g. Gemini), external database clients, or third-party APIs must reside **strictly on the backend Express server** (`server.ts`).
  - No secret environment variables (like API keys) should ever be queried from client-side files (`src/App.tsx` or components) or prefixed with `VITE_` unless they are public configuration flags.
- **Visual & UI Integrity:**
  - Follow the modern, off-white high-contrast visual identity of the AT&T Stadium theme.
  - Do not implement unrequested theme selectors, and never add superficial telemetry or system log lines in outer margins. Keep elements clean and human-readable.

---

## 2. Pull Request & Commit Guidelines

### Commit Message Format
We follow the conventional commits standard:
- `feat(map): add facility wait-time overlays`
- `fix(telemetry): rectify sensor drift calculations`
- `test(unit): implement validation checks for gate flow rates`

### branch Naming Conventions
- `feature/stadium-<name>`
- `bugfix/sensor-<name>`
- `hotfix/security-<name>`

---

## 3. Testing Mandates (100% Green Policy)

No pull request will be merged unless all automated checks pass cleanly:

1. **Pre-commit Check:**
   - Always run the linter and unit tests before pushing:
     ```bash
     npm run lint
     npm run test
     ```
2. **Regression Prevention:**
   - Any modification to `server.ts` or core simulation states must be accompanied by updated test cases in `src/test/stadium.test.ts`.
   - Ensure the coverage does not drop below the repository threshold.
