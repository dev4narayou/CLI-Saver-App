#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// get the path to the bash script
const scriptPath = path.join(__dirname, "save-cmd.sh");

// make sure the script is executable
try {
  fs.chmodSync(scriptPath, 0o755);
} catch (err) {
  // ignore permission errors on Windows
}

// explicitly set environment variables
const env = {
  ...process.env,
  HOME: process.env.HOME || process.env.USERPROFILE,
  TERM: process.env.TERM || "xterm",
};

// log diagnostic info
console.log("Executing save-cmd.sh with:");
console.log("- HOME:", env.HOME);
console.log("- TERM:", env.TERM);

// execute the bash script with bash explicitly
const result = spawnSync("bash", [scriptPath], {
  env,
  stdio: "inherit",
});

// exit with the same exit code
process.exit(result.status);
