# DentFlow - Dental Clinic Management System

## 1. Project Overview
DentFlow is a comprehensive, SaaS-style web application designed for dental clinics. It facilitates the management of patient records, appointment scheduling, clinical tracking, radiology imaging, and financial invoicing. 

The application is built with a **Mobile-First** design philosophy, supporting Light and Dark modes, and full Internationalization (i18n).

---

## 2. Technical Architecture

### Frontend
- **Framework:** React 18 with TypeScript.
- **Build Tool:** Vite / Create React App (structure compatible).
- **Styling:** Tailwind CSS with a custom design system (Medical Blue & Slate palette).
- **Icons:** Lucide React.
- **State Management:** 
  - React Context API (`AuthProvider`, `ThemeProvider`, `LanguageProvider`).
  - Local component state for UI logic.

### Backend & Persistence
The application uses a hybrid architecture designed for portability and offline-first capabilities:
- **Data Layer (`lib/storage.ts`):** Uses `localStorage` to persist User, Patient, Appointment, and Invoice data. This simulates a database for the frontend.
- **API Abstraction (`lib/api.ts`):** A wrapper that simulates network latency (Promises) to mimic real-world API interactions.
- **Server (`server/index.js`):** A Node.js/Express server is included to:
  1. Serve the React application in production.
  2. Handle **File Uploads** (Radiology images) via `multer`.
  3. Provide a fallback JSON-based database (`server/db.js`) if needed.

---

## 3. Key Features & Modules

### A. Authentication & Security
- **Login System:** Mock authentication supporting roles (Super Admin, Clinic Admin, Doctor, Assistant).
- **Credentials:** Supports login via **Email** or **Username**.
- **Demo Mode:** Pre-configured credentials (`demo`/`demo`).
- **Session Persistence:** robust JWT-based session handling with expiry checks (`useAuth.tsx`).

### B. Calendar & Scheduling
- **Views:** Month, Week, and Day timeline views.
- **Logic:** Custom-built calendar logic (no heavy third-party calendar libraries).
- **Conflict Detection:** Prevents double-booking slots.
- **Features:**
  - Status management (Confirmed, Pending, Canceled, Completed).
  - Drag-and-drop simulated slot selection.
  - "Canceled Log" for restoring accidentally canceled appointments.

### C. Patient Management
- **Directory:** Searchable list with filtering (Active/Archived).
- **Patient Dashboard:** A central hub for a specific patient containing:
  - **Overview:** Medical alerts (Allergies/Conditions), Sticky notes, Next appointment, Financial summary.
  - **Treatments:** Clinical acts log (Tooth #, Description, Price, Status).
  - **Schedule:** History of past and future appointments.
  - **Financials:** Invoices, payments, and balance due calculations.
  - **Documents:** Radiology gallery.
- **Quick Actions:** WhatsApp integration for direct patient messaging.

### D. Clinical & Radiology
- **Treatment Tracking:** Log clinical procedures with pricing and status (Planned vs. Completed).
- **Radiology Gallery:** 
  - Image upload functionality (stored via Node server or Base64 fallback).
  - Lightbox viewer with zoom and navigation controls.

### E. Financials
- **Invoicing:** Generate invoices from completed appointments.
- **Tracking:** Track Paid vs. Unpaid status.
- **Reporting:** Filter invoices by date range, patient, or status.

### F. Dashboard
- **Daily Agenda:** A focused view of the current day's appointments.
- **Validation Workflow:** Quick "Validate" action to mark appointments as completed and queue them for invoicing.

### G. Backoffice (Super Admin)
- **Multi-Tenancy:** Manage multiple clinics from a single dashboard.
- **Dashboard:** System-wide statistics (Total Clinics, Active Users, Subscriptions).
- **Clinic Management:** 
  - **CRUD:** Create, View, Edit, and Delete clinics.
  - **Staff Management:** View all staff, **Add New Users** (Doctor/Assistant), **Edit Details**, **Delete Users**, and **Reset Passwords**.
  - **Role Management:** capability to promote or demote user roles.
- **Responsive Layout:** Dedicated collapsible sidebar and mobile drawer navigation.

---

## 4. Project Structure

```
/
├── components/          # Reusable UI components
│   ├── layout/          # Sidebar, Topbar, Layout wrappers
│   └── ui/              # Button, Input, Modal, Card, etc.
├── features/            # Business logic modules
│   ├── appointments/    # Appointment hooks and modals
│   ├── auth/            # Login logic and Context
│   ├── backoffice/      # Super Admin Clinic/User management
│   ├── calendar/        # Calendar views (Month/Week/Day)
│   ├── dashboard/       # Main Home Dashboard
│   ├── invoices/        # Invoicing page and logic
│   ├── language/        # i18n Context
│   ├── patients/        # Patient directory and profile dashboard
│   └── theme/           # Dark mode Context
├── lib/                 # Utilities and Helpers
│   ├── api.ts           # Async API Simulation layer
│   ├── i18n/            # Translations (EN, FR, ES, IT, AR)
│   ├── storage.ts       # LocalStorage CRUD wrapper
│   └── utils.ts         # Date formatting, class merging
├── server/              # Node.js Backend
│   ├── db.js            # JSON file-based database
│   ├── index.js         # Express server entry point
│   └── scraper.js       # Utility for profile image scraping
└── types.ts             # TypeScript Interfaces (Data Models)
```

---

## 5. Data Models

The application relies on these core interfaces (defined in `types.ts`):

- **Patient:** `id`, `name`, `phone`, `medicalHistory` (allergies, conditions), `status` (active/archived).
- **Appointment:** `id`, `patientId`, `start` (ISO string), `end`, `status`, `observation`.
- **Invoice:** `id`, `amount`, `status` (paid/unpaid), `appointmentId`.
- **Treatment:** `id`, `patientId`, `tooth`, `description`, `price`, `status`.
- **Radio:** `id`, `patientId`, `url`, `date`.

---

## 6. Internationalization (i18n)

The app supports dynamic language switching without page reloads.
- **Supported Languages:** English, French, Spanish, Italian, Arabic (RTL support included).
- **Implementation:** `LanguageContext` provides a `t()` function that looks up keys in `lib/i18n/translations.ts`.
- **RTL Support:** The app automatically adjusts layout direction (`dir="rtl"`) for Arabic.

---

## 7. Setup Instructions

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Development Environment:**
    ```bash
    npm run dev
    ```
    This command uses `concurrently` to run both the React frontend and the Node.js backend server.

3.  **Production Build:**
    ```bash
    npm run build
    npm start
    ```
