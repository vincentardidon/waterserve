# WaterServe

A prototype incident-reporting portal for Calbayog City water service concerns.

## Run locally

Requirements: Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Next.js (normally <http://localhost:3000>).

No API or database setup is required. Reports, staff accounts, assignments, and
tracking history are stored in the browser's local storage. Start with an empty
prototype, then choose **Staff portal > Set up administrator** to create the
first local account. The administrator can add maintenance accounts from
**Staff & access** and reset a maintenance password there if it is forgotten.
Maintenance staff can also change their own password from **Account** when
they know their current password. Login password fields have a show/hide
control. There is no email-based password recovery in this local prototype.

## Prototype limitations

- Data stays in the current browser and website origin. It is not shared with
  other users, devices, browsers, or between local and deployed versions.
- Clearing this site's browser storage permanently deletes the prototype data.
- Browser storage and client-side roles are not secure. Do not enter real
  resident information or use real passwords.
- Photos, email, SMS, and production authentication are not included.

## Deploy a preview to Vercel

Import the repository into Vercel and use the standard Next.js build settings.
The prototype requires no database or environment secrets. Each visitor's
browser keeps its own separate local data; deploying does not create shared
records.

## Features

- Resident issue reports with unique tracking codes and status history
- Admin dashboard, incident search and filters, assignments, customer directory,
  staff management, and CSV export
- Maintenance dashboard with assigned work orders and resolution notes
- Browser-local saved reports and notifications
- Responsive layout

Status flow: Submitted > Assigned > In Progress > Resolved.

## Development checks

```sh
npm run typecheck
npm run build
npm start
```

See [docs/CODE-GUIDE.md](docs/CODE-GUIDE.md) for the application structure and
[docs/COLLABORATION.md](docs/COLLABORATION.md) for the Git workflow.
