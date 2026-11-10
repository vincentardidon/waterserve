# Collaborating on WaterServe

## Clone the project

```powershell
git clone https://github.com/vincentardidon/waterserve.git
cd waterserve
npm ci
npm run dev
```

## Make changes on a branch

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/describe-your-change
```

After editing:

```powershell
npm run typecheck
npm run build
git status
git add <files-you-changed>
git commit -m "Describe the change"
git push -u origin feature/describe-your-change
```

Open a pull request and ask a groupmate to review it before merging.

## Supabase data

Follow the Supabase setup in the root README before running the website. Keep
`.env.local` and all Supabase secret keys out of Git. Reports and account roles
are stored in Supabase, not in the repository. The public publishable key is
protected by the database's Row Level Security policies.
