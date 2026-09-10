# Contributing to SignBridge AI

Thank you for your interest in contributing to **SignBridge AI**! We welcome contributions from software engineers, ML researchers, UI/UX designers, accessibility advocates, and members of the Deaf and Hard-of-Hearing community.

---

## 1. Code of Conduct & Ethical Principles

* **Respect Deaf Culture and Natural Sign Languages:** Never frame sign languages as "simple gestures" or "universal codes." ASL, BSL, and other sign languages are complete, natural human languages with their own grammar, syntax, and morphology.
* **No Unsubstantiated Claims:** Do not claim the system translates unrestricted natural sign language unless linguistically proven.
* **Privacy by Design:** Do not submit code that transmits raw camera frames or personal recordings to third-party endpoints.

---

## 2. Development Setup

### 2.1 Prerequisites
* Node.js v20+ and npm v10+
* Python 3.11+
* Git

### 2.2 Local Setup
```bash
# 1. Clone repository
git clone https://github.com/sadegh-rasouli/SignBridge-AI.git
cd SignBridge-AI

# 2. Setup Python virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\pip install -r backend/requirements.txt
# On Linux/macOS:
source .venv/bin/activate && pip install -r backend/requirements.txt

# 3. Setup Frontend
cd frontend
npm install
npm run dev
```

---

## 3. Pull Request Guidelines

1. Ensure all tests pass:
   ```bash
   pytest tests/
   npm --prefix frontend run build
   node tests/test_frontend_math.js
   ```
2. Follow TypeScript strict mode and Python PEP 8 type hints.
3. Write automated unit tests for any new features or endpoints.
