# Food4iFe Campus — Windows Local Run

## Requirements

- Node.js 20 or newer: https://nodejs.org/
- PowerShell or Command Prompt

## First-time setup

Open PowerShell in this project folder and run:

```powershell
npm install
```

If Windows shows a script-execution policy error, run the commands in Command Prompt, or use:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
```

## Run in development mode

```powershell
npm run dev
```

Then open the URL printed in the terminal, usually:

```text
http://localhost:3000/
```

The project uses `cross-env`, so `NODE_ENV` works in PowerShell, Command Prompt, and macOS/Linux.

## Create and run a production build

Stop the development server with `Ctrl+C`, then run:

```powershell
npm run build
npm start
```

Open:

```text
http://localhost:3000/
```

## Important: copy the complete project

Do not copy only `client`, `server`, or `dist`. The file below is required by `client/src/pages/Home.tsx`:

```text
client/src/_core/hooks/useAuth.ts
```

This package includes that file and all supporting `_core` files. The `dist/public/index.html` error happens because the build stopped before Vite created `dist/public`; after `npm run build` succeeds, that file is created automatically.

## Optional checks

```powershell
npm run check
npm test
```

## If port 3000 is already busy

The server automatically selects the next available port and prints it, for example `http://localhost:3001/`.
