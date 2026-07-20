# UI Redesign Implementation Plan (Stitch Alignment)

We will align the current WalkThePlan CRM frontend pages with the Google Stitch project (`17202643385511371063`) design specs. This redesign will preserve all existing state, API calls, and socket-driven functionalities while modernizing the aesthetic to match the "Executive Precision" (Warm Gold, Ink Black, Warm Paper) theme.

---

## User Review Required

> [!IMPORTANT]
> **Functional Integrity**: We will *only* touch the presentation layer (CSS classes, component JSX structure, visual components). All data structures, API endpoints, socket triggers, context systems (Auth, Voice), and mock hubs will remain fully intact.

---

## Proposed Changes

We will execute the design system updates first, followed by individual page mappings to match the Stitch design screens:

### 🌟 Phase 1: Design System & Styling Tokens
We will sync our CSS variables and utility classes to exact Stitch tokens:
* **Backgrounds**: `#FAF9F6` (Warm Paper) and `#FFFFFF` (Surface Card)
* **Accents**: `#E3A62F` (Warm Gold) and `#121212` (Ink Black)
* **Borders/Lines**: `#E7E2D8` (Line Beige)
* **Fonts**: `Plus Jakarta Sans` for general display/body, `IBM Plex Mono` for stats and metrics.

#### [MODIFY] [tailwind.config.js](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/tailwind.config.js)
Update styling tokens (e.g., custom colors, custom shadow values, and border radii matching Stitch).

#### [MODIFY] [index.css](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/index.css)
Update the core styling sheets to utilize the synced variables.

---

### 🖥️ Phase 2: Page Mappings to Stitch Screens

#### 1. Landing & Authentication
* **Stitch Screen**: `Compass CRM - Landing Page` (`5f08c2836d4440ee96a3984e1ed79079`)
* **Local Pages**: [Login.jsx](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/pages/Login.jsx) & [Signup.jsx](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/pages/Signup.jsx)
* **Updates**: Re-skin with clean warm-paper layouts, central card views, and minimal input designs.

#### 2. Dashboard & Analytics
* **Stitch Screens**: `Compass CRM - Dashboard` (`2bdd646a79664c458a1c8c937ce3deaa`) & `Walk the Plan - Analytics Dashboard` (`5f3a456c778e40dc92da1523c93971db`)
* **Local Pages**: [Dashboard.jsx](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/pages/Dashboard.jsx) & [Reports.jsx](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/pages/Reports.jsx)
* **Updates**: Align grid structures, KPI stats cards (with IBM Plex Mono values), and graphical metrics layouts.

#### 3. Lead details & Pipeline
* **Stitch Screens**: `Compass CRM - Leads Pipeline` (`d51e848eaa444f949bfd8f24d7fb52c4`) & `Walk the Plan - Contact Details` (`97ef28c791b24064b3a5820c73c7cf1d`)
* **Local Pages**: [Leads.jsx](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/pages/Leads.jsx), [Deals.jsx](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/pages/Deals.jsx) & [LeadDetails.jsx](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/pages/LeadDetails.jsx)
* **Updates**: Revamp the Kanban pipeline board layout, column densities (340px width limit), customized badges, and the Blueprint path status sequence.

#### 4. Settings, Team & Profile
* **Stitch Screens**: `Walk the Plan - Settings & Profile` (`9305ed6fb6c3438a9c6f3dea35748489`), `Walk the Plan - Team Management` (`d9fb3f3dadee446dbd87ed6d0d6d91ed`) & `Walk the Plan - Integrations` (`54d47d12e9e04e16b80e20b6c01c1669`)
* **Local Page**: [Settings.jsx](file:///c:/Users/harsh/OneDrive/Desktop/CRM/frontend/src/pages/Settings.jsx)
* **Updates**: Organize the multi-tab layout mapping Profile, Team and Integrations views to the Stitch design specifications.

---

## Verification Plan

### Automated Verification
* Verify frontend builds cleanly with Vite:
  ```bash
  cd frontend
  npm run build
  ```

### Manual Verification
* Inspect the revised pages to ensure layout structure, colors, typography, buttons, and transition dynamics perfectly mimic the shared Stitch project screens.
