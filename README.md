# WalkThePlan CRM (Dedicated VR Studio CRM)

WalkThePlan CRM is a premium, high-density Customer Relationship Management (CRM) application custom-tailored for **WalkThePlan**, a virtual reality architectural walkthrough studio. Built on the MERN stack (MongoDB, Express, React, Node.js), it employs an Apple-inspired minimalist design system utilizing signature brand color tokens (Gold `#E3A62F`, Ink `#121212`, and Soft Light Paper `#FAF9F6`).

The system is optimized for **internal company operations**, allowing administrators to assign deals, track leads, and check performance metrics across team representatives with minimal friction.

---

## Key Features

### 🕶️ 1. VR Architectural Customizations
* **Specialized Fields**: Leads support service interest categories (`Interior VR`, `Elevation VR`, `Full-Scale 3D`, `Plan Conversion`, `Other`), Showroom Booking slots, and Design Drawing status (`Pending`, `In Progress`, `Approved`, `Rejected`).
* **Timeline Integration**: Automated and client notes show up with custom badges visually distinguishing "Website Intake (Automated)" entries.

### 📧 2. Real-World Nylas Integration
* **Outbound Emails:** Real email dispatch from connected Gmail/Outlook accounts directly to leads via the **Nylas v3 SDK**.
* **Calendar Synchronization:** Full synchronization of scheduled CRM showroom sessions directly to your **Google Calendar / Outlook Calendar** primary target feed.
* **Double-Booking Prevention:** Scans your connected calendar for events within booking windows to warn of schedule conflicts.
* **Inbound Email Sync:** Nylas webhooks automatically capture client replies and append them directly to the client's CRM timeline.

### 📞 3. Real-World Twilio Integration
* **VoIP Browser Dialer:** Place voice calls directly from your web browser using the Twilio Client SDK, Twilio API Keys, and registered TwiML App configurations.
* **Outbound SMS:** Send text messages to leads' mobile phone numbers directly from the CRM UI.
* **Inbound Webhook Sync:** Captures inbound replies sent to your Twilio number and logs them to the Lead timeline.

### 🌐 4. Public Website Lead Intake
* **Intake Endpoint**: Publicly accessible webhook (`POST /api/v1/intake/lead`) receiving direct submissions from `walktheplan.in`.
* **Spam & Abuse Defense**: Honeypot inputs, cryptographic secret keys, and rate limiters (20 submissions/hour/IP).
* **Intelligent Append:** Detects recent repeat inquiries by email/phone within 30 days and appends messages to existing timelines rather than spawning duplicate records.

---

## Project Structure

```bash
├── backend/
│   ├── config/             # Database connection setups (MongoDB, Redis)
│   ├── controllers/        # Express request controllers (Leads, Events, AI Copilot)
│   ├── middleware/         # Auth verify, RBAC scoping, rate limiters, and audits
│   ├── models/             # Mongoose schemas (Lead, Event, Notification, User)
│   ├── routes/             # REST route endpoints mapping
│   ├── services/           # Calendar sync integrations (Nylas Calendar Sync)
│   ├── utils/              # Socket room publishers, sharing rule scoping helpers
│   ├── server.js           # Server boot file
│   └── test_endpoints.js   # Automated integration test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, Timeline, composers, and bottom navs
│   │   ├── context/        # React global context states (Auth, Voice Assistant)
│   │   ├── pages/          # Dashboard, Leads, Calendar, Deals, Settings
│   │   └── App.jsx         # App router registry
```

---

## Local Getting Started

### Prerequisites
* **Node.js** (v18+)
* **MongoDB Atlas** connection string
* **Redis** (local or Cloud instance URL)
* **Nylas v3 Developer Account** (API Key & connected Grant ID)
* **Twilio Developer Account** (Account SID, Auth Token, API Key & Secret, and TwiML App SID)

### 1. Configuration Setup

Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/crm
REDIS_URL=redis://default:password@host:port
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development

# Google Gemini AI Config
GEMINI_API_KEY=your_gemini_api_key

# Twilio Telephony Config
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret

# Nylas Email & Calendar Config
NYLAS_CLIENT_ID=your_nylas_client_id
NYLAS_CLIENT_SECRET=your_nylas_client_secret
NYLAS_API_KEY=your_nylas_api_key
NYLAS_GRANT_ID=your_nylas_connected_grant_id
```

Create a `.env` file inside the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
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
