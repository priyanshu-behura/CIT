# CIT Campus Platform — Production Deployment Guide
**Architecture: Vercel (Frontend) + Render (FastAPI Backend) + MongoDB Atlas + Google Gemini**

This guide provides exact, step-by-step instructions to deploy the Chilika Institute of Technology (CIT) Campus Scheduling and Venue Management Platform.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────┐
│          End User / Browser          │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│        Frontend (Vercel)             │
│        React 19 + Vite 8             │
│  - Hosts UI, Animations & Views      │
│  - Routes API calls via VITE_API_URL │
│  - SPA rewrite rules via vercel.json │
└──────────────────┬───────────────────┘
                   │
                   │ HTTPS JSON REST API calls
                   ▼
┌──────────────────────────────────────┐
│         Backend (Render)             │
│      Python 3.12 + FastAPI           │
│  - Runs on Web Service on port $PORT │
│  - OR-Tools Constraint Solver        │
│  - Strict Institutional AI Gateway   │
│  - PBKDF2 Auth & HS256 JWTs          │
└──────────┬────────────────┬──────────┘
           │                │
           ▼                ▼
┌─────────────────┐  ┌──────────────────┐
│  MongoDB Atlas  │  │  Google Gemini   │
│  (Database)     │  │  (AI Provider)   │
│  - cit_campus   │  │  - Campus AI     │
│  - Collections: │  │  - English &     │
│    users,       │  │    Hinglish      │
│    bookings     │  │  - Governance    │
└─────────────────┘  └──────────────────┘
```

---

## 2. Part 1 — Deploy Backend to Render

### Option A: Automatic Deployment via Blueprint (Recommended)
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository: `https://github.com/priyanshu-behura/CIT`.
4. Render will detect the included `render.yaml` file.
5. In the configuration prompt, provide the two secret values:
   - `GEMINI_API_KEY`: Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
6. Click **Apply**. Render will automatically build and start the service.

---

### Option B: Manual Web Service Setup
If you prefer configuring through the Render dashboard UI:
1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect `https://github.com/priyanshu-behura/CIT`.
4. Fill in the service details:
   - **Name**: `cit-campus-backend` (or your preferred name)
   - **Region**: Oregon (US West) or closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave blank (defaults to repository root)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend`
   - **Plan Type**: Free
5. Click **Advanced** and set **Health Check Path** to:
   ```
   /api/v1/health
   ```
6. Add the following **Environment Variables**:

| Variable Key | Required / Default | Purpose / Example |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Enables production security mode and secret validation. |
| `CIT_SECRET_KEY` | **Required** (Secret) | 256-bit+ random secret for signing JWTs. (Generate via `python -c "import secrets; print(secrets.token_urlsafe(48))"`). |
| `GEMINI_API_KEY` | **Required** (Secret) | Your official Gemini API Key from Google AI Studio. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model ID for Campus AI generation. |
| `MONGODB_URI` | **Required** (Secret) | Connection string (e.g. `mongodb+srv://...`). |
| `MONGODB_DATABASE` | `cit_campus` | MongoDB database name. |
| `CORS_ORIGINS` | `https://*.vercel.app,http://localhost:5173` | Allowed frontend origins (comma-separated or JSON list). |
| `PYTHON_VERSION` | `3.12.0` | Ensures Python 3.12 runtime. |

7. Click **Create Web Service**.
8. Once deployment finishes, copy your Render service URL (e.g., `https://cit-campus-backend.onrender.com`).
9. Verify backend health in your browser or curl:
   ```bash
   curl https://cit-campus-backend.onrender.com/api/v1/health
   # Expected output: {"status":"healthy",...}
   ```

---

## 3. Part 2 — Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `priyanshu-behura/CIT`.
4. In the **Configure Project** screen:
   - **Project Name**: `cit-campus` (or your preferred name)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend` (Important!).
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
   - **Install Command**: `npm install` (Default)
5. Expand the **Environment Variables** section and add:

| Name | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://cit-campus-backend.onrender.com` | **Your deployed Render backend URL** (without trailing slash). |

6. Click **Deploy**.
7. Vercel will build the production React bundle and assign a production URL (e.g. `https://cit-campus.vercel.app`).

---

## 4. Part 3 — Final Connection Verification

Once both deployments are active:

1. **Test Frontend Loading**:
   - Open your Vercel URL (`https://your-cit-app.vercel.app`).
   - Confirm the landing page hero, StarBorder buttons, TextType animation, and VariableProximity effects render smoothly.
2. **Test Demo Logins**:
   - Navigate to Portal Login (`?page=login`).
   - Test logging in as:
     - `admin@cit.edu` / `Admin@123`
     - `coordinator.cse@cit.edu` / `Coord@123`
     - `faculty.sm@cit.edu` / `Faculty@123`
     - `club.robotics@cit.edu` / `Club@123`
3. **Test Student Registration**:
   - Navigate to Sign Up (`?page=register`).
   - Create a test student account and sign in immediately.
   - Confirm redirection to the Student Dashboard.
4. **Test Campus AI Chat**:
   - Open the Campus AI Chat view (`?page=ai-chat`).
   - Ask: `"Tell me about room capacities and lunch break rules"`
   - Ask in Hinglish: `"Mujhe seminar hall chahiye Friday ko"`
   - Confirm the assistant responds with institutional grounding and no leaked model internals.

---

## 5. Security & Maintenance Checklist

- [x] **No Keys in Frontend:** `GEMINI_API_KEY` and database credentials exist strictly on Render.
- [x] **CORS Isolation:** Backend allows your Vercel domains via explicit CORS origins and regex (`https://*.vercel.app`).
- [x] **No Git Credential Leaks:** All `.env` and SQLite `.db` files remain in `.gitignore`.
- [x] **SPA Routing Protection:** `frontend/vercel.json` rewrites all subpaths to `index.html`.
- [x] **Deterministic AI Fallback:** If Render cannot reach the Gemini API (e.g. quota limits or timeout), the backend automatically answers using its built-in deterministic campus NLP engine.

