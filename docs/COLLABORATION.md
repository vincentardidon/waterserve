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

## Prototype data

The repository contains source code only. Reports and staff accounts are saved
in each user's browser local storage and are not shared by GitHub. Cloning the
repository or opening the deployment on another device does not copy or sync
prototype data. Do not enter real personal information or production passwords.
