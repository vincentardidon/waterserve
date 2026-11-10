# WaterServe code guide

## Start here

`app/page.tsx` composes the website screens. `hooks/useWaterServe.ts` owns navigation, UI state, and form actions. `lib/water-serve-api.ts` sends requests to the Next.js API. `app/api/[...path]/route.ts` validates requests, identifies the signed-in account, and talks to Supabase. `supabase/schema.sql` creates the database tables, account-role trigger, access policies, and report workflow functions.

## Folder map

| Location | Responsibility |
| --- | --- |
| `app/page.tsx` | Main application shell and screen selection |
| `app/layout.tsx` | Document layout and page metadata |
| `app/api/[...path]/route.ts` | Authentication, report, staff, and password API routes |
| `app/reset-password/page.tsx` | Password reset form |
| `components/resident/` | Public report, tracking, customer report, and notification screens |
| `components/auth/AccountAccessPage.tsx` | Shared sign-in, customer sign-up, and reset-email form |
| `components/staff/` | Admin and maintenance workspaces |
| `hooks/useWaterServe.ts` | UI actions, navigation, and data refresh |
| `lib/supabase/` | Server-side Supabase clients and Next.js session proxy |
| `lib/water-serve-api.ts` | Typed request boundary and report-draft storage |
| `supabase/schema.sql` | Schema, role defaults, Row Level Security, and database functions |
| `supabase/fixes/` | SQL patches for projects that already applied an earlier schema version |

## Role and data flow

1. Guests see the shared sign-in and customer sign-up screen. Customer sign-up creates a Supabase Auth user; the database trigger creates a `customer` profile.
2. The shared sign-in endpoint verifies the credentials, then reads the profile role from Postgres. The UI routes the account based on that role; it never accepts a role choice from the login form.
3. Signed-in customers submit reports through a validating API route and database function. The database links each report to the customer account.
4. Customer tracking only returns reports owned by that account. Staff report queries are constrained by Row Level Security.
5. Assignment and status changes call a database function that checks the actor's profile and work assignment before writing history.

The first administrator is provisioned manually in Supabase, then promoted with the SQL statement at the bottom of `supabase/schema.sql`. The application does not offer public administrator setup.

## Common changes

- Change screen wording or layout: edit the component under `components/`.
- Change workflow validation or API response mapping: edit `app/api/[...path]/route.ts` and the matching function in `supabase/schema.sql`.
- Change issue types: update `lib/constants.ts` and the `create_incident` database function.
- Change report status transitions: update `update_incident` in `supabase/schema.sql`.
- Change UI actions or navigation: edit `hooks/useWaterServe.ts`.

## Local setup and checks

Follow the Supabase setup in the root [README](../README.md). Never add the Supabase secret key to browser code or commit `.env.local`. Run `npm run typecheck` and `npm run build` before sharing changes.
