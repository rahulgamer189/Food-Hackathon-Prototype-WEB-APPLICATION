const { spawn } = require("node:child_process");
const path = require("node:path");

const mode = process.argv[2];
const root = path.resolve(__dirname, "..");
const env = { ...process.env };

let command;
let args;

if (mode === "dev") {
  env.NODE_ENV = "development";
  command = process.execPath;
  args = [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), "watch", "server/_core/index.ts"];
} else if (mode === "start") {
  env.NODE_ENV = "production";
  command = process.execPath;
  args = [path.join(root, "dist", "index.js")];
} else {
  console.error("Usage: npm run dev | npm start");
  process.exit(1);
}

const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
