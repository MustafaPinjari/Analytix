# InsightFlow BI - Frontend Workspace

This is the enterprise-grade frontend workspace for **InsightFlow BI**, an interactive Business Intelligence & Analytics platform built on React 19, TypeScript, and Vite.

---

## 🚀 Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8
- **Language**: TypeScript 6
- **Styling**: Tailwind CSS v4 & Lucide React (Icons)
- **UI Primitives**: Radix UI Primitives (Select, Dialog, Tabs, Tooltip, Avatar, Switch)
- **State Management**:
  - **Server State**: TanStack Query v5 (React Query)
  - **Client state**: Zustand v5
- **Routing**: React Router v6/v7 (Data Routers)
- **Visualizations**:
  - **Grid Layout**: React Grid Layout (12-column editable grid canvas)
  - **Charts Library**: Recharts (Line, Bar, Area, Pie charts)
  - **Data Table**: AG Grid Community (Virtualized columns/rows scroll ledger)
- **Testing**: Vitest & React Testing Library

---

## 📂 Feature-Based Folder Architecture

The application codebase is organized around domain-driven feature boundaries:

```
src/
├── app/               # Root App entry config and provider setups
├── assets/            # Static assets and graphics
├── components/        # Cross-feature design system components (buttons, inputs)
├── features/          # Self-contained business domains (no cross-feature imports):
│    ├── auth/              # Login, Register, Forgot & Reset Password views
│    ├── dashboard-layout/  # Collapsible sidebar, header switcher, notification drawer
│    ├── dashboards/        # Dashboard list catalogs and card metrics
│    ├── dashboard-builder/ # Grid canvas editing workspace, configurations drawer, sharing
│    ├── datasets/          # SQL workspace console and schema inspectors
│    ├── reports/           # Periodic PDF/CSV reports schedulers
│    ├── settings/          # Org profiles, billing limits, and webhook event managers
│    ├── users/             # Team collaborator ledgers and access control tables
│    └── widgets/           # Central chart rendering switcher and subchart components
├── hooks/             # App-wide utility hooks (theme state, media queries)
├── routes/            # Route configurations and auth protection guards
├── store/             # Zustand state stores (Auth, UI preferences)
├── types/             # Common TypeScript interfaces
└── utils/             # Merging utilities and numerical formatters
```

---

## 🛠️ Setup & Local Running

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18+ recommended) and `npm` installed.

### 1. Installation
Navigate to the frontend workspace folder and install the locked dependencies:
```bash
cd Frontend/frontend
npm install
```

### 2. Run the Development Server
Fire up Vite's HMR dev server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> [!NOTE]
> **Authentication Bypass**: You can log in using any test email and password to instantly bypass the login screen and preview the interactive builder dashboard.

### 3. Build & Compile Checks
To verify production compile bundles and type safety checks:
```bash
npm run build
```
This builds compiled assets inside the `dist/` directory.

### 4. Run Unit Tests
To boot up the Vitest testing runner:
```bash
npm run test
```

---

## ⚙️ Git & Workspace Readiness

The root repository `.gitignore` has been updated to ignore dependencies and builds globally:
```gitignore
node_modules/
**/node_modules/
dist/
**/dist/
```
Source code tracking is clean and ready for deployment.
