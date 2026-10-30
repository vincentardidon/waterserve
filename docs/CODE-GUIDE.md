# WaterServe code guide

## Start here

`app/page.tsx` composes the customer and staff screens. `hooks/useWaterServe.ts`
owns navigation, UI state, and actions. `lib/prototype-store.ts` is the
prototype's persistence layer: it reads and writes reports and staff data in
the current browser's local storage.

## Folder map

| Location | Responsibility |
| --- | --- |
| `app/page.tsx` | Application shell and screen selection |
| `app/layout.tsx` | Document layout and page metadata |
| `components/resident/` | Home, reporting, tracking, saved reports, and notifications |
| `components/auth/` | Staff login and first administrator setup |
| `components/staff/` | Dashboard, incidents, customers, staff management, and settings |
| `components/incidents/` | Incident table and details dialog |
| `components/layout/` | Site header and footer |
| `components/shared/` | Status badge and empty state |
| `hooks/useWaterServe.ts` | UI state and actions |
| `lib/prototype-store.ts` | Local-storage persistence and prototype workflows |
| `lib/constants.ts` | Issue types, report statuses, and date formatting |
| `lib/types.ts` | Staff, incident, history, and tracking data types |
| `lib/export-incidents.ts` | CSV download formatting |
| `styles/` | Styles grouped by screen purpose and responsive breakpoints |

## Resident report flow

1. `ReportIssuePage` renders the form.
2. `submitReport` in `useWaterServe` validates and submits its fields to
   `prototypeRequest`.
3. `lib/prototype-store.ts` creates a tracking code and persists the report in
   local storage.
4. The controller remembers the tracking code and displays confirmation.
5. `TrackReportPage` reads the saved report and its public history.

Admin and maintenance actions use the same local store. This is suitable only
for demonstrations: all data and role checks are client-side and can be changed
by anyone with access to the browser.

## Common changes

- Change screen wording or layout: edit the relevant component under `components/`.
- Change status colors: edit `styles/resident.css`.
- Change mobile layout: edit `styles/responsive.css`.
- Change CSV columns: edit `lib/export-incidents.ts`.
- Change actions or navigation: edit `hooks/useWaterServe.ts`.
- Change local data validation or persistence: edit `lib/prototype-store.ts`.
- Change issue types: update `lib/constants.ts`.

## Data behavior

The prototype starts with no sample data. Reports and accounts are saved in
local storage for the current site origin and browser. Local and deployed
versions do not share data. Do not enter real personal information or reuse
real passwords.

## Code checks

```sh
npm run typecheck
npm run build
```

Formatting uses two spaces, semicolons, and double quotes. See
`.prettierrc.json` for the project formatting settings.
