# 🛡️ VIBE SHIELD AI

> **An Agentic AI Platform for Security Analysis, Human-in-the-Loop Remediation, and Deterministic Verification of AI-Generated Software.**

[![Tests](https://img.shields.io/badge/tests-12%20passed-brightgreen?style=flat-square)](backend/tests)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 📋 Table of Contents

- [The Problem: The "Vibe Coding" Security Blindspot](#-the-problem-the-vibe-coding-security-blindspot)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Core Safety & Honesty Principles](#-core-safety--honesty-principles)
- [Quick Start Guide (Windows)](#-quick-start-guide-windows)
- [Step-by-Step Demo Walkthrough](#-step-by-step-demo-walkthrough)
- [Security Scanner Registry](#-security-scanner-registry)
- [API Documentation](#-api-documentation)
- [Testing & Quality Assurance](#-testing--quality-assurance)

---

## ⚡ The Problem: The "Vibe Coding" Security Blindspot

Modern developers and teams are generating thousands of lines of code using LLMs (ChatGPT, Claude, Copilot, Cursor). While this dramatically accelerates feature velocity, it creates severe security vulnerabilities:
- **Blind Merging:** Untrained or hurried developers accept AI code without reading the underlying implementation.
- **Subtle Logic Flaws:** AI models frequently emit code with insecure deserialization, SQL concatenation, or unescaped shell commands that look plausible on the surface.
- **Hallucinated Packages & Supply Chain:** AI models hallucinate packages or reference dependencies with known CVEs.
- **Hardcoded Secrets:** Developers accidentally prompt models with API keys or accept code that embeds credentials.

**Vibe Shield AI** solves this by establishing an automated, deterministic security boundary coupled with assistive AI explanation and **strict human-in-the-loop verification**.

---

## 🏗️ System Architecture

```
                          ┌───────────────────────────────────┐
                          │   Frontend (React + Vite + CSS)   │
                          │   Dark-mode Cyber Security UI     │
                          └─────────────────┬─────────────────┘
                                            │ REST / SSE
                                            ▼
                          ┌───────────────────────────────────┐
                          │     FastAPI Core Engine (v1)      │
                          │    Upload Sandbox & Safe Unzip    │
                          └─────────┬───────────────┬─────────┘
                                    │               │
                 ┌──────────────────┴──┐         ┌──┴──────────────────┐
                 ▼                     ▼         ▼                     ▼
        ┌─────────────────┐   ┌────────────────┐ ┌─────────────────┐ ┌───────────────┐
        │ Static Analysis │   │ Secret Scanner │ │ SCA & Container │ │   Assistive   │
        │ Semgrep, Bandit │   │    Gitleaks    │ │  pip/npm audit  │ │   LLM Engine  │
        └────────┬────────┘   └────────┬───────┘ └────────┬────────┘ └───────┬───────┘
                 │                     │                  │                  │
                 └──────────────────┬──┴──────────────────┴──────────────────┘
                                    ▼
                          ┌───────────────────────────────────┐
                          │  Database Layer (Dual Engine)     │
                          │  SQLite (Local) / Postgres (Prod) │
                          └───────────────────────────────────┘
```

---

## ✨ Key Features

1. **Multi-Scanner Orchestration Engine:** Runs Semgrep, Bandit, Gitleaks, pip-audit, and npm-audit asynchronously against isolated project workspaces.
2. **Safe Upload Sandbox:** Hardened ZIP extraction with strict zip-slip protection, path traversal defenses, and quota boundaries.
3. **Assistive AI Investigation:** Contextual root-cause explanations that differentiate deterministic tool findings from probabilistic AI commentary.
4. **Human-in-the-Loop Patch Center:** Generates fix proposals as reviewed drafts. Zero blind code modifications — every fix requires human review and sandbox re-scan verification.
5. **Security Audit Reports:** Export full vulnerability registries with CWE/CVE identifiers, scanner output hashes, and limitations statements in JSON or CSV.
6. **Graceful Scanner Degradation:** Missing local scanner binaries are skipped cleanly with audit logging rather than crashing the system.

---

## 🛡️ Core Safety & Honesty Principles

In alignment with academic and competition standards, Vibe Shield AI guarantees:
- **No False Security Claims:** A scan passing does not prove complete security; reports prominently state scanner coverage and skipped checks.
- **No Invented Findings:** Findings are generated solely by real tool execution output.
- **Demarcated AI Content:** All AI summaries are tagged with `ai_explanation_source` to prevent confusion with deterministic static analysis.
- **Zero Unsigned Modification:** No code is written or merged without explicit developer signature and sandbox verification.

---

## 🚀 Quick Start Guide (Windows)

### Prerequisites
- **Python 3.11+** installed and added to PATH.
- **Node.js 18+** installed.

### Option 1: One-Click Windows Launch
Double-click `start_all.bat` or run:
```cmd
start_all.bat
```
This opens two terminal windows:
- **Backend API:** `http://localhost:8000` (Docs: `http://localhost:8000/api/docs`)
- **Frontend Dashboard:** `http://localhost:5173`

---

### Option 2: Manual Terminal Launch

#### 1. Start Backend
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 2. Start Frontend
```powershell
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🎯 Step-by-Step Demo Walkthrough

A pre-packaged vulnerable sample project is provided in `samples/vulnerable-app.zip` containing intentional OWASP flaws (SQL injection, Command injection, Insecure Deserialization, Hardcoded Secrets, and Vulnerable Dependencies).

1. **Open the Web Application:** Navigate to `http://localhost:5173`.
2. **Create New Security Scan:**
   - Click **"New Security Scan"** on the Dashboard or Sidebar.
   - Enter a Project Name (e.g. `Demo Insecure App`).
   - Drag and drop or upload `samples/vulnerable-app.zip`.
   - Select the desired scanning engines (Semgrep, Bandit, Secrets, SCA).
   - Click **"Start Security Analysis"**.
3. **Inspect Real-Time Scan Console:**
   - Watch live scan stage events, extraction verification, and scanner execution logs.
4. **Explore Findings:**
   - Filter by severity (Critical, High, Medium, Low) and category.
   - Click on any finding to view the exact code snippet, flagged line number, and CWE/CVE mapping.
5. **AI Investigation & Patch Approval:**
   - Click **"Investigate with AI"** or **"Generate Fix Proposal"**.
   - Navigate to the **"Patch Center"** (`/patches`).
   - Review the side-by-side diff view.
   - Click **"Review & Approve"** to provide human signature signoff.
   - Click **"Run Verification Sandbox"** to run AST and regression checks.
6. **Export Audit Report:**
   - Go to **"Reports & Compliance"** (`/reports`).
   - Download the compliance audit report in **CSV** or **JSON** format, or use the print-ready view.

---

## 🔍 Security Scanner Registry

| Scanner | Category | Target Ecosystem | Install Command |
|---|---|---|---|
| **Bandit** | SAST | Python | `pip install bandit` |
| **Semgrep** | SAST | Multi-language (JS, Python, Go, Java) | `pip install semgrep` |
| **Gitleaks** | Secrets | API keys, Tokens, Private Keys | `winget install Gitleaks.Gitleaks` |
| **pip-audit** | SCA | Python `requirements.txt` | `pip install pip-audit` |
| **npm audit** | SCA | Node.js `package.json` | Included with Node.js |
| **Trivy** | SCA & Container | Containers, Lockfiles | `winget install AquaSecurity.Trivy` |

*Note: If any scanner is not installed on the system, Vibe Shield AI logs the scanner as skipped and proceeds with all available engines.*

---

## 📖 API Documentation

Interactive Swagger documentation is available at `http://localhost:8000/api/docs`.

### Key Endpoints
- `GET  /api/v1/health` — Platform health and scanner availability status.
- `POST /api/v1/projects` — Create project.
- `GET  /api/v1/projects` — List projects with severity metrics.
- `POST /api/v1/projects/{id}/upload` — Path-traversal protected ZIP upload.
- `POST /api/v1/projects/{id}/scan` — Trigger multi-engine security scan.
- `GET  /api/v1/scans/{id}` — Scan status and live event stream.
- `GET  /api/v1/projects/{id}/findings` — Filtered vulnerability register.
- `GET  /api/v1/findings/{id}` — Finding detail and code evidence.
- `POST /api/v1/findings/{id}/explain` — AI root-cause explanation.
- `POST /api/v1/findings/{id}/generate-fix` — Human-in-the-loop fix proposal.
- `POST /api/v1/patches/{id}/approve` — Record developer approval signature.
- `POST /api/v1/patches/{id}/verify` — Execute sandbox verification run.
- `GET  /api/v1/projects/{id}/report` — Audit report export (JSON or CSV).

---

## 🧪 Testing & Quality Assurance

The test suite validates security functions, upload sandboxing, model schemas, and API routers:

```powershell
cd backend
python -m pytest
```

Output:
```
============================= test session starts =============================
platform win32 -- Python 3.14.6, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\PROJECTS\Vibe-Shield-AI\backend
collected 12 items

tests\test_main.py ............                                          [100%]

============================= 12 passed in 1.63s ==============================
```

Frontend production verification:
```powershell
cd frontend
npm run build
```
Builds all lazy-loaded bundles, styles, and chunk modules with zero errors.

---

## 📜 License

MIT License. Designed and engineered for academic research, AI security education, and competition demonstration.
#   t e s t i n g _ h u b  
 