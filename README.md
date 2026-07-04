# SalesPro CRM (Zoho CRM Enterprise Upgrade)

SalesPro is a premium, high-density Customer Relationship Management (CRM) application built on the MERN stack. Designed with a clean, light-blue corporate design system, it mirrors major enterprise solutions like Zoho CRM with custom bento-widget layouts, interactive Kanban deal pipelines, communications logging, custom layout builders, and automation workflow engines.

---

## Key Features

### 📞 Phase 1: Multi-Channel Communication Hub
* **Click-to-Call Simulator**: Live VoIP call simulation inside the browser tracking connected timers, call summaries, and posting logs on disconnect.
* **Email Composer**: Outbound email drafting interface (simulated SendGrid/Nylas) mapping email subjects and body directly to the lead timeline.
* **Unified History Timeline**: Polymorphic timeline rendering call, email, task, and note cards with distinct visual indicators and relative timestamps.

### ⚙️ Phase 2: Custom Layouts & Dynamic Fields
* **Admin Layout Builder**: Settings portal allowing administrators to define custom inputs (Text, Number, Dropdown Selectors, or Dates).
* **Dynamic Modals**: Creation and edit forms automatically fetch defined custom fields and render the correct inputs dynamically.
* **Custom Fields Grid**: Saves dynamic key-value parameters to a Mongoose Map schema, rendering values under the details tab.

### ⚡ Phase 3: Sales Automation & Workflows
* **Trigger-Action Rules Engine**: Hooked into database creations and updates.
* **Automated Tasks**: Status updates (e.g. lead moves to "Proposal Sent") automatically schedule tasks with deadlines assigned to the owner.
* **Automated Emails**: Automatically dispatches and logs template email copies parsing custom placeholders like `{name}` and `{company}`.

### 📊 Phase 4: Advanced BI Reports & CSV Import
* **Interactive Recharts Dashboard**:
  - *Lead Source Share*: Donut chart illustrating marketing channel acquisition shares.
  - *Revenue Projection*: Dual bar chart comparing projected expected revenue vs closed-won revenues.
  - *Executive Leaderboard*: High-density grid monitoring assigned volumes, conversion rates, and closed deal valuations per salesperson.
* **CSV Import Wizard**: Step-by-step file loader allowing client-side CSV parsing, visual column header mapping, and batch inserts.

---

## Project Structure

```bash
├── backend/
│   ├── controllers/         # MERN REST controllers (leads, workflows, reports, etc.)
│   ├── models/              # Mongoose DB schemas (Lead, Task, Workflow, CustomField)
│   ├── routes/              # Express API endpoints mapping
│   ├── utils/               # Automation engine trigger logic
│   └── server.js            # Node main server file
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable sidebar, navbar, and import modals
│   │   ├── pages/           # Dashboard, Leads, Deals (Kanban), Tasks, Reports, Settings
│   │   └── App.jsx          # Route registry and app layouts
└── CRM_API_Postman_Collection.json   # Ready-to-import Postman API Collection
```

---

## Local Getting Started

### Prerequisites
* **Node.js** (v18+)
* **MongoDB Atlas** database connection string.

### 1. Configuration Setup
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/crm
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
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

### Automated CLI Test Runner
Verify all endpoint connections, database writes, and automation triggers end-to-end:
```bash
cd backend
node test_endpoints.js
```

### Postman Verification
Import the pre-configured [CRM_API_Postman_Collection.json](CRM_API_Postman_Collection.json) located in the project root:
1. Run **Login User** (uses `admin@company.com` / `password123` or your credentials) to auto-extract the JWT authorization header.
2. Run bulk lead creations, log calls, add custom layout builders, and query reports data.
