# WalkThePlan CRM (Dedicated VR Studio CRM)

WalkThePlan CRM is a premium, high-density Customer Relationship Management (CRM) application custom-tailored for **WalkThePlan**, a virtual reality architectural walkthrough studio. Built on the MERN stack (MongoDB, Express, React, Node.js), it employs an Apple-inspired minimalist design system utilizing signature brand color tokens (Gold `#E3A62F`, Ink `#121212`, and Soft Light Paper `#FAF9F6`).

---

## Key Features

### 🕶️ 1. VR Architectural Customizations
* **Specialized Fields**: Leads support service interest categories (`Interior VR`, `Elevation VR`, `Full-Scale 3D`, `Plan Conversion`, `Other`), Showroom Booking slots, and Design Drawing status (`Pending`, `In Progress`, `Approved`, `Rejected`).
* **Timeline Integration**: Automated and client notes show up with custom badges visually distinguishing "Website Intake (Automated)" entries.

### 📞 2. Multi-Channel Communication Hub
* **Click-to-Call Widget**: Simulated browser VoIP client tracking timers, status results, and logs.
* **Email Composer**: Outbound email simulator supporting drafts powered by the AI Compass Assistant.
* **Timeline Feed**: Chronological activity tracker plotting email logs, calls, and tasks on the prospect profile.

### 🌐 3. Public Website Lead Intake
* **Intake Endpoint**: Publicly accessible webhook (`POST /api/v1/intake/lead`) receiving direct submissions from `walktheplan.in`.
* **Spam & Abuse Defense**: Cryptographic secret keys, honeypot inputs, and IP rate limiters (20 submissions/hour/IP).
* **30-Day Duplicate Check**: Detects recent repeat inquiries by email/phone and appends messages to existing timelines rather than spawning duplicate records.
* **Notification Fan-out**: Fans out in-app alerts and Socket.io broadcasts to all active Admins and Managers.

### 📅 4. Unified Calendar & Scheduling
* **Calendar Views**: Interactive month, week, and day grid views matching brand tokens.
* **Natural Language Parsing**: "Smart Add" bar parsing text like `"Call Priya tomorrow 3 PM"` to draft events via `chrono-node`.
* **Free-Busy checks**: Scans participant schedules to flag time conflict warnings.

### 🤝 5. Deals Pipeline Kanban
* Drag-and-drop opportunity boards mapping expected deal values, and visual charts monitoring performance metrics.

---

## Project Structure

```bash
├── backend/
│   ├── config/             # Database connection setups (MongoDB, Redis)
│   ├── controllers/        # Express request controllers (Leads, Events, AI Compass)
│   ├── middleware/         # Auth verify, RBAC scoping, rate limiters, and audits
│   ├── models/             # Mongoose schemas (Lead, Event, Notification, User)
│   ├── routes/             # REST route endpoints mapping
│   ├── services/           # Calendar sync integrations (Nylas Calendar)
│   ├── utils/              # Socket room publishers, sharing rule scoping helpers
│   ├── server.js           # Server boot file
│   └── test_endpoints.js   # Automated integration test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, Timeline, composers, and bottom navs
│   │   ├── context/        # React global context states (Auth, Voice Assistant)
│   │   ├── pages/          # Dashboard, Leads, Calendar, Deals, Invoices, Settings
│   │   └── App.jsx         # App router registry
```

---

## Local Getting Started

### Prerequisites
* **Node.js** (v18+)
* **MongoDB Atlas** connection string
* **Redis** (local or Cloud instance URL)

### 1. Configuration Setup
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/crm
REDIS_URL=redis://default:password@host:port
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
WEBSITE_INTAKE_SECRET=your_intake_secret_token
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Run the Backend Server
```bash
cd backend
npm install
npm run dev
```
*The server will start running on [http://localhost:5000](http://localhost:5000).*

### 3. Run the Frontend Client
```bash
cd ../frontend
npm install
npm run dev
```
*The client app will launch on [http://localhost:5173](http://localhost:5173).*

---

## API Testing & Verification

Verify the system endpoints, scoping rules, double-booking checks, Nylas signatures, and lead intake webhook validations:
```bash
cd backend
node test_endpoints.js
```
