# ATLAX Studio (Step 1: foundation)

Premium analytics and operations dashboard. Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Lucide, Recharts.

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
```

## Structure
- `src/app/(app)/*`: one route per section (14 sections), wrapped by the app shell
- `src/components/layout`: sidebar, navbar, workspace switcher, global search, command menu (Ctrl/Cmd+K), notifications, user menu, breadcrumbs
- `src/components/ui`: buttons, cards, KPI cards, chart container, data table, dropdown, modal, tooltip, filters, tabs, empty states, skeletons
- `src/components/charts`: trend, bars, donut, sparkline (Recharts)
- `src/features/*`: the view for each section
- `src/lib/data`: deterministic demo data

Theme tokens live in `src/app/globals.css` (light and dark).

## Step 2: advanced functionality

- **State**: `src/lib/store.ts` is a small persisted store (localStorage). Slices live in `src/lib/state/*`.
- **Demo data**: one deterministic dataset (`src/lib/data/metrics.ts`, `accounts.ts`) feeds Overview, Analytics, Reports and Data explorer so numbers agree. It is not connected to any real source.
- **Permissions (demo)**: `src/lib/rbac.ts` defines Owner, Admin, Manager, Analyst and Viewer. Checks run in the browser only and are NOT secure authorization. `src/lib/auth/index.ts` documents where real authentication and server-side `authorize()` calls plug in.
- **Shortcuts**: `?` lists them. `Ctrl/Cmd+K` opens the command menu, `/` focuses search, `G` then a letter navigates.
- **Reset**: use "Reset demo data in this browser" in the command menu.
