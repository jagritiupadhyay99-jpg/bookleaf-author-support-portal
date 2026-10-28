# BookLeaf Author Support & Communication Portal

A full-stack, enterprise-grade author support and operations portal built for BookLeaf Publishing. It centralizes author communication, book catalog metadata, royalty analytics, ticket lifecycles, real-time polling updates, and AI-assisted classification and policy-grounded draft generation with strict human-in-the-loop review.

---

## 🚀 Live Demo & Video Walkthrough

- **Live Application URL:** [https://bookleaf-author-support-portal-sigma.vercel.app/login](https://bookleaf-author-support-portal-sigma.vercel.app/login)
- **Video Walkthrough Demo:** [Watch End-to-End Demo Video](#) *(Comprehensive walkthrough showing Author portal, book catalog, ticket creation with attachments, live 8-second polling, and Admin operations queue with AI Policy Copilot drafting)*
- **Pre-Seeded Database:** Fully seeded with all 10 authors and 18 books from `bookleaf_sample_data.json`

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Operations Admin** | `admin@bookleaf.demo` | `Admin@1234` | Full triage queue, date filters, priority escalation, AI copilot draft review, internal notes, assignment |
| **Author (AUTH001)** | `priya.sharma@email.com` | `Author@1234` | 2 published books, ₹19,908 earned, ₹3,570 pending royalty, submit & view tickets |
| **Author (AUTH002)** | `rohit.kapoor@email.com` | `Author@1234` | 2 published books, ₹57,744 earned, 1,280 copies sold |
| **Author (AUTH007)** | `sneha.kulkarni@email.com` | `Author@1234` | 3 books, including *The Silk Route Conspiracy* in Cover Design production stage |

*(All 10 sample author accounts from `AUTH001` to `AUTH010` are active with password `Author@1234`)*

---

## 1. Executive Summary & Tech Stack

- **Frontend:** React 18, Vite, Vanilla CSS design system (custom tokens, restrained business aesthetic, zero Tailwind overhead, accessible Inter typography, fully responsive).
- **Backend:** Node.js, Express 5, Helmet HTTP security headers, CORS origin whitelisting, Express input validation, and centralized error handling.
- **Database:** MongoDB with Mongoose ODM (normalized schema for users and books; embedded public conversation messages and private internal investigation notes; indexed query paths).
- **Authentication & Security:** Bcrypt password hashing (cost factor 12), JSON Web Tokens (JWT), role-based middleware (`author` vs `admin`), and strict multi-tenant database-level resource ownership verification.
- **AI Integration:** Zero-dependency, provider-agnostic LLM adapter supporting Google Gemini (`gemini-3.5-flash-lite`), OpenAI (`gpt-4o-mini`), Groq (`llama3-8b-8192`), and Anthropic (`claude-3-haiku`), with automated deterministic heuristic fallback mode. AI drafts are strictly private drafts and never dispatched automatically.
- **Real-Time Synchronization:** Automatic 8-second polling on author ticket views for continuous status and response updates without page refreshes.

---

## 2. Key Features

### For Authors
- **Royalty & Book Dashboard:** Unified financial ledger presenting total published catalog count, lifetime sales volume, gross royalties earned (80% net profit share), royalties paid, and outstanding balance in INR (`₹`).
- **Book Catalog:** Full metadata breakdown for all author titles including ISBN, genre, publication date, production status, MRP, author royalty per copy, copies sold, print partners, and retail platforms (Amazon India, Flipkart, BookLeaf Store, etc.).
- **Ticket Submission with Supporting Documents:** Submit support queries linked either to a specific author book or tagged as "General / Account Level". Validates character lengths (300 char subject, 5,000 char description). Includes interactive drag-and-drop supporting document attachment zone with file size formatting and preview.
- **Conversation Timeline & Polling:** Live conversation timeline showing author inquiries, attached files, and official BookLeaf replies. Polls every 8 seconds so authors see updates in real time.

### For Support Operations (Admin)
- **Central Operations Queue:** Real-time KPI metric ribbon (Active Open, Critical/High, Unassigned, Resolved) with a single-row filter toolbar (Search query, Category, Priority, Status, Sort order).
- **Ticket Assignment & Overrides:** One-click "Assign to Me", manual category override, priority escalation/de-escalation, and workflow status transitions.
- **Strictly Private Internal Notes:** Admin-only internal investigation notes styled in distinct restricted containers and permanently stripped from author-facing responses.
- **AI Policy Copilot:** Asynchronous background ticket classification upon creation. On-demand AI draft generation incorporating BookLeaf policy guidelines and book context. Admin can review, edit, or copy drafts directly into the public composer.

---

## 3. Data Architecture & Seed Integrity

The application implements normalized models based on the assignment dataset:
- `users`: Stores author profiles (seeded with `authorId`, e.g., `AUTH001`–`AUTH010`) and admin accounts with bcrypt password hashes.
- `books`: Stores book catalog items (seeded with `bookId`, e.g., `BK001`–`BK018`), linked to authors by `authorId`. Preserves all retail platform arrays, print partners, and handles books in production with zero sales or null publication dates safely.
- `tickets`: Stores human-readable ticket numbers (`TKT-00001`), foreign keys, category, priority, status, AI metadata, embedded public conversation `messages`, and embedded private `internalNotes`.

---

## 4. REST API Documentation

All endpoints require `Authorization: Bearer <token>` unless marked public.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates email & password, returns JWT token and user profile |
| `POST` | `/api/auth/logout` | Public | Invalidates client session |
| `GET` | `/api/auth/me` | Bearer | Returns the authenticated user's profile and role |

### Author Endpoints (`/api/author`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/author/dashboard` | Author | Returns financial summary (books, sales, royalties) and catalog list |
| `GET` | `/api/author/books` | Author | Returns the authenticated author's full book catalog |

### Ticket Endpoints (`/api/tickets`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets` | Author | Creates ticket; verifies book ownership; launches async AI triage |
| `GET` | `/api/tickets/my` | Author | Returns authenticated author's tickets (private notes stripped) |
| `GET` | `/api/tickets/:ticketId` | Author/Admin | Returns ticket detail; enforces author ownership or admin role |

### Admin Endpoints (`/api/admin`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Returns operational KPI counts (open, criticalHigh, unassigned, resolved) |
| `GET` | `/api/admin/tickets` | Admin | Returns filtered, searched, and paginated ticket queue |
| `GET` | `/api/admin/tickets/:id` | Admin | Returns ticket detail with book context, messages, and private notes |
| `PATCH` | `/api/admin/tickets/:id` | Admin | Updates category, priority, or workflow status overrides |
| `POST` | `/api/admin/tickets/:id/assign-to-me` | Admin | Assigns ticket to authenticated admin operator |
| `POST` | `/api/admin/tickets/:id/notes` | Admin | Appends a private internal note (hidden from author) |
| `POST` | `/api/admin/tickets/:id/ai-draft` | Admin | Triggers policy-grounded AI draft generation |
| `POST` | `/api/admin/tickets/:id/messages` | Admin | Dispatches official public response and updates ticket status |
| `POST` | `/api/admin/tickets/:id/reanalyze` | Admin | Re-runs automated category & priority classification |

---

## 5. AI Integration & Engineering Decisions

### 1. Prompt Engineering & Knowledge Base Grounding
Prompts are grounded strictly in the **BookLeaf Knowledge Base**:
- 80/20 royalty split (80% net profit to author, 20% to BookLeaf).
- Quarterly calculation cycle with 45-day post-quarter payout window.
- ₹1,000 minimum disbursement threshold (balances below roll over).
- In-house Delhi printing with 5–7 business days turnaround; free reprints for verified defects.
- ISBN errors escalated as high priority with a 48-hour follow-up SLA.
- Retail listing activation: 7–10 business days; stock sync: 24–48 hours.
- Tone guidelines: Empathetic, professional, specific, and ending with a clear next step.

### 2. Cost Management & Token Awareness
- Prompts do **not** blindly send unbounded conversation history. Only the author's initial query, latest ticket metadata, and compact policy rules are packaged.
- System instructions enforce concise responses capped at `max_tokens: 800`.
- Classification requests enforce a strict JSON schema (`category`, `priority`, `reason`), minimizing token usage to under 100 output tokens.

### 3. Graceful Error Handling & Degradation
- If external LLM APIs fail, time out (15s threshold), or encounter rate limits, the system does not crash or block ticket submission.
- The ticket is saved immediately, and the system falls back to an internal keyword-based heuristic classifier tagged as `[MOCK MODE]` / `heuristic fallback`.
- Admins can manually override classification or compose responses directly without impediment.

### 4. Model Choice Justification (PDF Requirement Section D.5)
The assignment permits OpenAI, Anthropic, or any LLM API with brief justification. We implemented a unified, zero-dependency HTTP adapter defaulting to **Google Gemini Flash (`gemini-2.5-flash-lite` / `gemini-1.5-flash`)** and supporting **OpenAI (`gpt-4o-mini`)** or **Anthropic (`claude-3-haiku`)**:
1. **Low Latency for Interactive Triage:** Gemini Flash and Claude Haiku offer sub-1.5s time-to-first-token, ensuring admin queue drafts and classification complete near-instantaneously without operational bottlenecks.
2. **Economic Viability at Scale:** For BookLeaf's volume (1,200+ books/month and thousands of author interactions), large foundation models (GPT-4 / Claude Opus) are cost-prohibitive. Flash/Haiku-tier models cost ~95% less ($0.075 to $0.15 per 1M tokens) while exceeding the reasoning requirements for policy retrieval and category classification.
3. **Strict Structured Output Adherence:** Handles deterministic JSON classification schemas without hallucinating extraneous markdown or unprompted actions.
4. **Resilient Provider Independence:** Architecture avoids vendor lock-in; switching between Gemini, OpenAI, Groq, or Anthropic requires only changing an environment variable (`LLM_PROVIDER=...`).

---

## 6. Quick Start & Local Run Commands

### Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- MongoDB Atlas connection string (or local MongoDB)

### Step 1: Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables
**Server (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
CLIENT_ORIGIN=http://localhost:5173
ADMIN_NAME=BookLeaf Admin
ADMIN_EMAIL=admin@bookleaf.demo
ADMIN_PASSWORD=Admin@1234
DEMO_AUTHOR_PASSWORD=Author@1234
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key
LLM_MODEL=gemini-3.5-flash-lite
```
*(Supports `LLM_PROVIDER=gemini` (default model `gemini-3.5-flash-lite`), `openai` (`gpt-4o-mini`), `groq` (`llama3-8b-8192`), or `mock` for zero-key local fallback)*

**Client (`client/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: Run Database Seed (Idempotent)
Populates the exact 10 authors and 18 books from `bookleaf_sample_data.json` and creates the administrator account:
```bash
cd server
npm run seed
```

### Step 4: Start Applications
```bash
# Terminal 1 — Start Backend API (Port 5000)
cd server
npm run dev

# Terminal 2 — Start Frontend Client (Port 5173)
cd client
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 7. Demo Credentials

### Support Administrator
- **Email:** `admin@bookleaf.demo`
- **Password:** `Admin@1234`
- **Role:** Administrator (Full queue access, triage, assignment, overrides, private notes, AI drafting, public replies)

### Sample Author Accounts (Password: `Author@1234`)
- `priya.sharma@email.com` (AUTH001 · 2 books · ₹3,570 pending royalty)
- `rohit.kapoor@email.com` (AUTH002 · 2 books · ₹57,744 earned)
- `ananya.reddy@email.com` (AUTH003 · 1 book · ₹2,546 earned)
- `vikram.joshi@email.com` (AUTH004 · 2 books · ₹1,845 pending royalty)
- `sneha.kulkarni@email.com` (AUTH007 · 3 books · 1 title in cover design production)

---

## 8. Automated Testing & Build Verification

Run the comprehensive unit, integration, and security test suites:
```bash
cd server
npm test
```

### Test Suite Results:
- **`AI Service Classification & Drafting Tests`**: 5/5 passed
- **`Authentication & Security Unit Tests`**: 8/8 passed (includes multi-tab session isolation & cross-author RBAC)
- **`Comprehensive Feature & Security Audit`**: 8/8 passed
- **`Seed Data Integrity Tests`**: 5/5 passed
- **`Ticket Business Rules & Model Tests`**: 6/6 passed
- **Total:** **32 tests passed, 0 failed, 5 suites**

Run live end-to-end API & security audit:
```bash
node src/utils/runLiveAudit.js
```
- **Result:** **28 / 28 live API checks passed** (Multi-tenant isolation, 6 categories, priority overrides, status transitions, search/filter, and private notes omission).

Frontend Production Build:
```bash
cd client
npm run build
```
- **Result:** Built in **591ms** with zero errors or warnings (`client/dist/`).

---

## 9. Deployment Preparation

- **Frontend (Vercel / Netlify):**
  - Root directory: `client`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_BASE_URL=https://your-backend-service.onrender.com/api`

- **Backend (Render / Railway / Fly.io / VPS):**
  - Root directory: `server`
  - Start command: `npm start`
  - Required Environment Variables:
    - `PORT=5000`
    - `NODE_ENV=production`
    - `MONGODB_URI=mongodb+srv://...`
    - `JWT_SECRET=your_long_production_secret`
    - `CLIENT_ORIGIN=https://your-frontend.vercel.app`
    - `ADMIN_EMAIL=admin@bookleaf.demo`
    - `LLM_PROVIDER=gemini` (or `openai` / `groq` / `mock`)
    - `LLM_API_KEY=your_gemini_api_key`
    - `LLM_MODEL=gemini-3.5-flash-lite`

- **Database (MongoDB Atlas):**
  - Cluster: M0 Free or dedicated tier.
  - Network Access: Whitelist backend IP (or `0.0.0.0/0` in production if using dynamic cloud hosts like Render).
  - Initial Setup: Execute `npm run seed` once to initialize the 10 authors, 18 books, and admin user.

---

## 10. Known Limitations & Future Improvements

This section details the current implementation boundaries and architectural evolution paths:

1. **Attachment Binary Storage vs. Metadata:**
   - **Current Implementation:** The portal provides an interactive drag-and-drop dropzone on ticket submission supporting PDF, PNG, JPG, and DOCX formats (up to 10MB per file, max 5 files). The client validates file size and mime types, and the server validates and persists attachment metadata (`name`, `size`, `type`, `uploadedAt`) directly on the Ticket document.
   - **Production Roadmap:** Direct binary uploading to cloud object storage (e.g., AWS S3 or Cloudflare R2 presigned URLs with virus scanning) was intentionally deferred per the assignment specification (*"UI only—actual upload is bonus, not required"*).

2. **Real-Time Synchronization Mechanism:**
   - **Current Implementation:** The author ticket detail and list views use an 8-second polling cycle (`setInterval`) to fetch updates from the REST API. This ensures authors see admin replies and status changes without manual page refreshes while remaining stateless and firewall-friendly.
   - **Production Roadmap:** Scale to bidirectional WebSockets (Socket.io) or Server-Sent Events (SSE) backed by a Redis pub/sub layer for instantaneous push updates under high concurrency.

3. **AI Draft Generation & Streaming:**
   - **Current Implementation:** AI response drafts are generated via a bounded backend HTTP request to Google Gemini (`gemini-3.5-flash-lite`) capped at `max_tokens: 800` (typically returning within 1.5–2.5 seconds).
   - **Production Roadmap:** Implement character-by-character token streaming directly into the admin response composer using Server-Sent Events (SSE) for lower perceived latency.

4. **Outbound Notification Delivery:**
   - **Current Implementation:** Authors receive updates in-app via the portal dashboard and polling.
   - **Production Roadmap:** Integrate transactional email delivery (e.g., Resend, SendGrid, or AWS SES) to notify authors when their ticket receives an official reply or changes status to Resolved/Closed.

5. **Rate Limiting & Abuse Prevention:**
   - **Current Implementation:** Protected by Helmet HTTP security headers, CORS origin whitelisting, Express input validation schemas (subject ≤300 chars, description ≤5000 chars), and role-based access control.
   - **Production Roadmap:** Add sliding-window IP rate limiting (`express-rate-limit` + Redis store) on `/api/auth/login` and `/api/admin/tickets/:id/ai-draft` to mitigate brute-force attempts and third-party LLM quota consumption.
