#### title: OctoAgent AI - Autonomous GitHub Code Reviewer
emoji: 🤖
colorFrom: indigo
colorTo: slates
sdk: docker
app_port: 7860
pinned: false
---

#### OctoAgent AI — Autonomous Multi-Agent GitHub Code Reviewer

**OctoAgent AI** is an autonomous, production-grade multi-agent code review platform for GitHub Pull Requests, Commits, and single files, powered by **Gemini 3.8 Flash**, **TypeScript (89.9%)**, **Node.js**, **React + Vite**, and **Docker**.

It orchestrates a specialized 4-agent engineering swarm to audit security vulnerabilities, runtime performance bottlenecks, code maintainability, and automated test coverage — with **1-click GitHub inline suggestion patches** and an interactive **Remediation Chat**.

---

#### Core Architecture & Multi-Agent Swarm Pipeline

    [GitHub PR / Commit / File URL]
                  │
                  ▼
    [Server-Side GitHub Diff Parser & Filter]
      ├── Strips lockfiles (bun.lock, package-lock.json) & build artifacts
      └── Maps unified diff hunks (@@ -old,+new @@) to exact right-side lines
                  │
                  ▼
    [Gemini 3.8 Flash — 4-Agent Review Swarm]
      ├── 1. SecOps Specialist      -> OWASP Top 10, SAST, injection & secret leaks
      ├── 2. Performance Architect  -> Big-O complexity, N+1 queries & memory leaks
      ├── 3. Clean Code Lead        -> SOLID principles, typing & dead-code removal
      └── 4. QA Specialist          -> Edge cases & Vitest / Jest / PyTest generation
                  │
                  ▼
    [1-Click GitHub Review Publisher + Interactive Remediation Chat]
      └── Posts APPROVE / REQUEST_CHANGES / COMMENT & inline suggestion patches

---

#### Key Features
- **Multi-Agent Review Swarm:** Parallel domain analysis across SecOps, Performance, Clean Code, and QA specialists with severity scoring (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **GitHub PR, Commit & File Integration:** Inspects both public and private GitHub repositories, branches, pull requests, and individual source files.
- **1-Click GitHub Inline Comments & Patch Suggestions:** Publishes formal review verdicts (`APPROVE`, `REQUEST_CHANGES`, `COMMENT`) and inline GitHub suggestion blocks directly onto the PR diff.
- **Automated Test Suite Generation:** Synthesizes runnable unit and integration tests tailored to your stack (Vitest, Jest, or PyTest).
- **Interactive Remediation Chat:** Ask follow-up questions to the Review Lead and request instant refactored code patches for any flagged issue.

---

#### Engineering Challenges, Issues Faced & How They Were Solved

#### 1. Hugging Face Spaces Docker Port Binding & Container Runtime Mismatch
- **Issue:** Local development and AI Studio previews bind to port `3000`, whereas Hugging Face Spaces (`sdk: docker`) strictly routes external traffic to `app_port: 7860` and runs containers under an unprivileged non-root UID (`1000`). Hardcoded ports or `localhost`-only bindings caused **502 / Space Unhealthy** startup failures.
- **Solution:** Standardized the server entrypoint to bind dynamically via `Number(process.env.PORT) || 7860` on host `0.0.0.0`, declared `app_port: 7860` in the Hugging Face YAML frontmatter, and aligned the `Dockerfile` `EXPOSE` and startup command for zero-config container booting.

#### 2. GitHub PR Inline Comment `422 Unprocessable Entity` & Diff Line Drift
- **Issue:** GitHub's Pull Request Review API rejects inline comments (`POST /repos/{owner}/{repo}/pulls/{pull_number}/comments`) with HTTP `422` if the AI returns an absolute file line number that falls outside a modified unified diff hunk (`@@ -a,b +c,d @@`) or misses the head `commit_id`.
- **Solution:** Implemented a unified diff hunk parser that extracts valid modified `RIGHT`-side line ranges per file and anchors reviews to the exact `head.sha` commit ID. Findings outside changed hunks gracefully fall back into the top-level PR Review summary body instead of failing the submission.

#### 3. Self-Review Verdict Restriction on GitHub API (`APPROVE` Error)
- **Issue:** GitHub enforces a repository rule blocking users from submitting an `APPROVE` or `REQUEST_CHANGES` verdict on their own Pull Requests when authenticating with their own Personal Access Token (`422: Can not approve your own pull request`).
- **Solution:** Added defensive error handling and pre-check logic that detects self-authored PRs or restricted permissions and cleanly falls back to `COMMENT` verdict publishing while preserving all inline code suggestions.

#### 4. Large PR Token Overflow & Lockfile Noise in LLM Context
- **Issue:** Pull Requests containing dependency updates (`bun.lock`, `package-lock.json`, minified assets, or `dist/` bundles) exhausted Gemini context limits, spiked latency, and caused malformed or truncated JSON responses.
- **Solution:** Built a deterministic diff filter that excludes lockfiles, binary assets, and generated build folders before prompt assembly, paired with strict Gemini `responseSchema` structured JSON enforcement so every agent returns deterministic, UI-safe review objects.

#### 5. API Key Exposure & Browser CORS Restrictions on Private Repos
- **Issue:** Fetching private GitHub diffs or calling Gemini directly from client-side React code risks exposing `GEMINI_API_KEY` in browser bundles and triggers CORS blocks on authenticated GitHub API endpoints.
- **Solution:** Routed AI inference and GitHub API requests through server-side proxy endpoints, isolating `GEMINI_API_KEY` inside server environment secrets (`.env` / Hugging Face **Secrets**) and handling GitHub tokens strictly in memory per session without persisting credentials to disk.

#### 6. Docker Image Bloat & Slow Cloud Rebuilds
- **Issue:** Copying `node_modules`, build caches, local environment files, or large artifact directories into the Docker build context slowed Hugging Face Spaces rebuilds and risked layer bloat.
- **Solution:** Configured `.dockerignore` to exclude `.git`, `node_modules`, `dist`, and local `.env` files, and structured `Dockerfile` layers to install dependencies before copying application source code for optimal build caching.

---

#### Tech Stack
- **Language Breakdown:** TypeScript (`89.9%`), JavaScript (`9.3%`), HTML/CSS/Docker (`0.8%`)
- **AI Engine:** Google Gemini (`GEMINI_API_KEY` via `@google/genai`)
- **Frontend:** React, Vite, Tailwind CSS
- **Integrations:** GitHub REST API v3 (PRs, Commits, Diffs, Review Comments)
- **Deployment:** Docker (`sdk: docker`), Hugging Face Spaces (`app_port: 7860`)

---

#### Repository Structure

    octoagent-ai---github-autonomous-code-reviewer/
    ├── src/                     # TypeScript React UI, Multi-Agent Swarm views & Remediation Chat
    ├── public/assets/           # Static UI assets & media
    ├── index.html               # Vite SPA entry point
    ├── metadata.json            # Applet capabilities & runtime permissions
    ├── .env.example             # Environment variable template (no real secrets)
    ├── .dockerignore            # Docker build context exclusions
    ├── Dockerfile               # Production container setup (Port 7860)
    ├── bun.lock                 # Deterministic dependency lockfile
    └── README.md                # Hugging Face Spaces & project documentation

---

#### Hugging Face Spaces Deployment Configuration
- **SDK:** `docker`
- **Port:** `7860`
- **Environment Variables Required:**
  - `GEMINI_API_KEY`: Your Google Gemini API Key (Configure in **Settings -> Variables and secrets -> Secrets** on Hugging Face Spaces).
  - `GITHUB_TOKEN` *(Optional)*: Default GitHub Personal Access Token for automated private repository access (or enter your token securely in the UI session).

---

#### Local Development Setup

1. **Clone the repository:**
   `git clone https://github.com/rowshanara01/octoagent-ai---github-autonomous-code-reviewer.git`

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and add your `GEMINI_API_KEY`.

3. **Install dependencies & run locally:**
   `npm install && npm run dev` (or `bun install && bun run dev`)

4. **Build for production:**


