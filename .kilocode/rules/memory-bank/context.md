# Active Context: Stock Management Mobile App

## Current State

**App Status**: ✅ Fully functional stock management mobile application with export features

Built on Next.js 16 with Firebase Firestore backend. Mobile-first design with bottom navigation.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Firebase Firestore integration
- [x] Mobile-first UI with bottom navigation
- [x] Dashboard with stats and quick actions
- [x] Stock movements page (entrées/sorties)
- [x] Bon de réception with validation
- [x] Bon de sortie with validation
- [x] Inventaire annuel et intermédiaire
- [x] Products management (CRUD)
- [x] Export PDF/Excel/Word for all reports (bons de réception, bons de sortie, inventaires, mouvements)
- [x] Authentication system with Firebase Auth (login page, logout)
- [x] Default admin account auto-created: admin@stockmanager.com / Admin@123
- [x] Role-based access control (admin vs user with per-page permissions)
- [x] Admin panel for user management (create, edit, toggle active, delete, view permissions)
- [x] Top bar with user info and logout menu
- [x] Permission-filtered bottom navigation

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main app with navigation | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Mobile-first styles | ✅ Ready |
| `src/lib/firebase.ts` | Firebase config | ✅ Ready |
| `src/lib/firestore.ts` | Firestore CRUD operations | ✅ Ready |
| `src/lib/types.ts` | TypeScript interfaces | ✅ Ready |
| `src/components/Dashboard.tsx` | Home dashboard | ✅ Ready |
| `src/components/MouvementsPage.tsx` | Stock movements | ✅ Ready |
| `src/components/ReceptionPage.tsx` | Bon de réception | ✅ Ready |
| `src/components/SortiePage.tsx` | Bon de sortie | ✅ Ready |
| `src/components/InventairePage.tsx` | Inventaire | ✅ Ready |
| `src/components/ProduitsPage.tsx` | Products CRUD | ✅ Ready |
| `src/components/ExportButton.tsx` | Reusable export dropdown button | ✅ Ready |
| `src/lib/exportUtils.ts` | PDF/Excel/Word export functions | ✅ Ready |
| `src/lib/auth.ts` | Firebase Auth functions + bootstrapAdmin | ✅ Ready |
| `src/lib/AuthContext.tsx` | React context for auth state + permissions | ✅ Ready |
| `src/components/LoginPage.tsx` | Mobile login form | ✅ Ready |
| `src/components/AdminPage.tsx` | User management panel | ✅ Ready |
| `.env.local` | Firebase credentials template | ✅ Ready |

## Current Focus

App is complete with authentication and role-based access control. User needs to:
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore database AND Firebase Authentication (Email/Password provider)
3. Copy credentials to `.env.local`
4. Default admin account is auto-created on first load: `admin@stockmanager.com` / `Admin@123`

### Export Feature Details
- **Libraries**: `jspdf` + `jspdf-autotable` (PDF), `xlsx` (Excel), `docx` (Word)
- **ExportButton**: Dropdown with PDF/Excel/Word options, shown in detail modals
- **Mouvements**: Export button in page header (exports currently filtered list)
- **Bons de réception/sortie**: Export button in detail modal header
- **Inventaires**: Export button in detail modal header

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
