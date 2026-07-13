# AegisAI StadiumOS — Production Deployment & DevOps Guide

This document provides a step-by-step operations manual for configuring, building, testing, and deploying the **AegisAI StadiumOS** full-stack application on production cloud services.

---

## 1. Prerequisites & Environment Variables

The application runs in full-stack Node.js environment. Ensure the following environment secrets are defined before startup:

```env
# .env (Create this in root directory)
GEMINI_API_KEY=AIzaSy...              # High-value Google Gemini API Secret key (Required for Agent Intelligence)
NODE_ENV=production                   # Set to production to trigger compressed static serving and bundle optimizations
PORT=3000                             # The default container port (Must bind to 0.0.0.0:3000)
```

> **Security Warning:** Never prefix `GEMINI_API_KEY` with `VITE_`. Doing so exposes your secret credentials to the client browser static assets during bundler builds.

---

## 2. Local Development & Installation

Follow these steps to run a fresh local dev server:

```bash
# 1. Install base dependencies
npm install

# 2. Run automated style formatters and code linters
npm run format
npm run lint

# 3. Boot local Express development server with TSX
npm run dev
```

The application will bind to **`http://localhost:3000`** with real-time file-system reload triggers active.

---

## 3. Production Compilation & Packaging

When compiling for production (e.g. inside a Docker container), we run a unified build pipeline:

```bash
# Compile client-side Vite bundle AND bundle Express server to Single-File CommonJS dist/server.cjs
npm run build

# Start the compiled self-contained production server
npm run start
```

### The `build` Pipeline Explained
The script compiles the frontend static assets into `/dist` via Vite, and compiles the backend TypeScript server to `dist/server.cjs` with `esbuild`. 
This bundles all relative TypeScript modules at build-time, avoiding Node's runtime ES Module imports checking, and resulting in sub-second container cold starts on Cloud Run.

---

## 4. Containerization (Dockerfile)

Below is the production-ready multi-stage `Dockerfile` to deploy AegisAI StadiumOS to **Google Cloud Run** or **AWS Fargate**:

```dockerfile
# Stage 1: Build Environment
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Minimal Runtime Environment
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

To build and publish this container:
```bash
gcloud builds submit --tag gcr.io/aegis-stadium/stadiumos:latest .
gcloud run deploy stadiumos --image gcr.io/aegis-stadium/stadiumos:latest --port 3000 --platform managed
```

---

## 5. Continuous Integration (GitHub Actions)

We maintain an active continuous integration pipeline inside `.github/workflows/ci.yml`. On every `push` or `pull_request` against master branches:
1. **Lint/Compiler Audit:** Runs `npm run lint` (`tsc --noEmit && eslint`) to verify syntactical safety.
2. **Formatting Audit:** Runs `npm run format` to ensure unified code standards.
3. **Vitest Unit Suite:** Triggers `npm run test` to verify telemetry algorithms and agent tool structures in a simulated environment.
