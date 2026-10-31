# Third-Party Dependencies and Licenses

The Campus Scheduling and Venue Management Platform for Chilika Institute of Technology (CIT) utilizes the following open-source third-party dependencies:

---

## 1. Backend Dependencies (Python 3.12)

| Package | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| **fastapi** | `>=0.110.0` (0.162.0) | MIT | High-performance asynchronous API framework |
| **uvicorn[standard]** | `>=0.28.0` (0.54.0) | BSD-3-Clause | ASGI production web server |
| **pydantic** | `>=2.6.0` (2.14.2) | MIT | Data validation and schema definition |
| **pydantic-settings** | `>=2.2.0` (2.16.2) | MIT | Environment variable settings management |
| **ortools** | `>=9.9.3963` (9.15.6755) | Apache-2.0 | Google Optimization Tools CP-SAT constraint programming solver |
| **pyjwt** | `>=2.8.0` | MIT | JSON Web Token (JWT) encode and decode for stateless authentication |
| **pytest** | `>=8.0.0` (9.2.0) | MIT | Automated unit and integration testing framework |
| **httpx** | `>=0.27.0` (0.28.1) | BSD-3-Clause | Asynchronous HTTP client for API integration tests |
| **python-dotenv** | `>=1.0.1` (1.2.4) | BSD-3-Clause | Environment configuration parser |
| **sqlite3** | Standard Library | Python (PSF) | Relational persistence with WAL mode |

---

## 2. Frontend Dependencies (React 19 + TypeScript + Vite)

| Package | Version | License | Purpose |
| :--- | :--- | :--- | :--- |
| **react** | `^19.3.1` | MIT | Declarative UI framework |
| **react-dom** | `^19.3.1` | MIT | React DOM renderer |
| **vite** | `^8.3.5` | MIT | Next-generation build tool and dev server |
| **typescript** | `~7.0.2` | Apache-2.0 | Static typing and language service |
| **tailwindcss** | `^3.4.17` | MIT | Utility-first CSS framework for Light Design System |
| **postcss** | `^8.4.38` | MIT | CSS processor for Tailwind directives |
| **autoprefixer** | `^10.4.19` | MIT | Vendor prefix processor |
| **lucide-react** | `^1.16.0` | ISC | Accessible, lightweight icon primitives |
| **recharts** | `^3.8.0` | MIT | Composable charting library for analytics dashboards |
| **canvas-confetti**| `^1.9.4` | ISC | Visual celebration feedback for successful solver runs |

---

## 3. Official Competition Source of Truth
- **Chilika Institute of Technology (CIT) Starter Pack:**
  - Provided under official CrunchWeek competition assets.
  - Preserved unaltered in `CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/`.
  - Master dataset: `cit_public.json`.
  - Verification engine: `validator.py`.
