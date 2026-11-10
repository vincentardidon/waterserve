# WaterServe

WaterServe is an incident-reporting and repair-tracking website for Calbayog City water service concerns. It uses Next.js, Supabase Auth, and Supabase Postgres.

## Local setup

Requirements: Node.js 22.13 or newer.

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL Editor.
   If you already ran an earlier copy of the schema, apply
   [`supabase/fixes/2026-11-11-fix-history-inserts.sql`](supabase/fixes/2026-11-11-fix-history-inserts.sql)
   and [`supabase/fixes/2026-11-11-require-customer-login.sql`](supabase/fixes/2026-11-11-require-customer-login.sql)
   instead of rerunning the full schema.
3. In Supabase **Authentication > Users**, create the first administrator account. Then run the final `update public.profiles...` statement in `schema.sql` with that account's email. Do not expose a public administrator setup form.
4. Copy `.env.example` to `.env.local` and fill in the project URL, publishable key, and server-only secret key.
5. In Supabase **Authentication > URL Configuration**, add `http://localhost:3000/reset-password` as a redirect URL.
6. Configure a custom SMTP provider before inviting real customers; Supabase's built-in sender is limited to project team addresses and low-volume testing.
7. Run the app:

```sh
npm ci
npm run dev
```

Open the local URL printed by Next.js (normally <http://localhost:3000>).

## Accounts and roles

- Guests can view the Home page and the sign-in screen. Report submission, report tracking, account reports, and updates require a signed-in customer account.
- Residents can create customer accounts from the shared **Sign in** page. New accounts receive the `customer` role from the database.
- Signing in gives access to WaterServe services; the Supabase session is remembered on the device until sign-out or session expiry.
- Administrators and maintenance staff use the same sign-in form. The server reads each account's role from its database profile and opens the matching workspace; there is no role picker or separate staff portal.
- Administrators create maintenance accounts in **Staff & access**. Admin account creation and role changes must be done by a trusted administrator.
- Customers must sign in to submit reports, view their account reports, and track their own report updates. Their reports are linked to the account and appear on other devices after sign-in.
- A report's tracking code supplements account sign-in and returns only status and update history to the report's owner. Contact details remain restricted to authorized staff and the customer account.

## Environment variables

| Variable | Where it is used | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server; protected by database RLS | No |
| `SUPABASE_SECRET_KEY` | Server only; maintenance account administration | Yes |

Never prefix the secret key with `NEXT_PUBLIC_` or commit `.env.local`.

## Deploy to Vercel

1. Import the repository into Vercel.
2. Add all three environment variables in the Vercel project settings.
3. Add the production domain and `/reset-password` to Supabase's allowed redirect URLs.
4. Deploy. Use the Vercel production URL in Supabase's site URL settings.

The database tables enable Row Level Security. Keep the secret key in server-side environment variables only. Do not disable RLS to work around policy errors.

## Included workflows

- Sign-in-gated customer issue reporting and account-owned tracking
- Optional customer accounts with account-based report history
- Admin incident dashboard, search, assignment, customer directory, staff management, and CSV export
- Maintenance work orders, repair notes, and status history
- Password reset email flow and account password updates
- Responsive resident and staff interfaces

Status flow: Submitted > Assigned > In Progress > Resolved.

Email/SMS report notifications, photo uploads, and production data migration from the old browser-only prototype are not included. Old local browser data is not uploaded automatically.

## Development checks

```sh
npm run typecheck
npm run build
npm start
```

See [docs/CODE-GUIDE.md](docs/CODE-GUIDE.md) for the application structure and [docs/COLLABORATION.md](docs/COLLABORATION.md) for the Git workflow.
