---
title: OctoAgent AI - Autonomous GitHub Code Reviewer
emoji: 
colorFrom: indigo
colorTo: slate
sdk: docker
app_port: 7860
pinned: false
---

#### OctoAgent AI — Autonomous Multi-Agent GitHub Code Reviewer ####

OctoAgent AI is an autonomous multi-agent code review platform for GitHub pull requests and repositories powered by Gemini 3.8 Flash.

#### Features ####
- **Multi-Agent Review Swarm:** SecOps Specialist (SAST & OWASP), Performance Architect (Complexity & Leaks), Clean Code Lead, and QA Specialist.
- **GitHub PR Integration:** Reviews public and private GitHub pull requests, commits, and single files.
- **1-Click GitHub Comments:** Posts review verdicts (`APPROVE`, `REQUEST_CHANGES`) and inline ````suggestion```` patches directly back to GitHub.
- **Automated Test Generation:** Generates runnable test suites (Vitest/Jest/PyTest).
- **Interactive Remediation Chat:** Ask questions and request refactorings from the Review Lead.

#### Hugging Face Spaces Deployment Configuration ####
- **SDK:** `docker`
- **Port:** `7860`
- **Environment Variables Required:**
  - `GEMINI_API_KEY`: Your Google Gemini API Key (Set this in **Settings → Variables and Secrets → Secrets** on Hugging Face).
