import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getProjectSources, isUsableProjectId, resolveFirebaseProjectId } from "./lib/firebaseProject.mjs";

const cwd = process.cwd();
const checks = [];

function addCheck(status, name, detail) {
  checks.push({ status, name, detail });
}

function runCommand(command, args) {
  return spawnSync(command, args, { encoding: "utf8" });
}

function hasExecutable(command) {
  const check = runCommand("bash", ["-lc", `command -v ${command}`]);
  return check.status === 0;
}

function checkProjectId() {
  const sources = getProjectSources(cwd);
  try {
    const resolved = resolveFirebaseProjectId(cwd);
    addCheck("pass", "Firebase project id", `Resolved as '${resolved}'`);
  } catch (error) {
    addCheck("fail", "Firebase project id", error instanceof Error ? error.message : String(error));
  }

  if (isUsableProjectId(sources.processEnv)) {
    addCheck("pass", "Project source", "Using FIREBASE_PROJECT_ID from process env");
  } else if (isUsableProjectId(sources.envFile)) {
    addCheck("pass", "Project source", "Using FIREBASE_PROJECT_ID from .env");
  } else if (isUsableProjectId(sources.firebaserc)) {
    addCheck("pass", "Project source", "Using .firebaserc projects.default");
  } else {
    addCheck("warn", "Project source", "No usable project id found in env/.env/.firebaserc");
  }
}

function checkFirebaseAuth() {
  if (!hasExecutable("firebase")) {
    addCheck("fail", "Firebase CLI", "firebase command is missing");
    return;
  }

  const version = runCommand("firebase", ["--version"]);
  if (version.status === 0) {
    addCheck("pass", "Firebase CLI version", version.stdout.trim());
  } else {
    addCheck("fail", "Firebase CLI version", (version.stderr || version.stdout).trim());
  }

  const auth = runCommand("firebase", ["login:list"]);
  const output = `${auth.stdout}\n${auth.stderr}`.trim();
  if (auth.status !== 0) {
    addCheck("warn", "Firebase login", output || "Unable to determine login state");
    return;
  }

  if (output.includes("No authorized accounts")) {
    addCheck("warn", "Firebase login", "No authorized account. Run: firebase login");
  } else {
    addCheck("pass", "Firebase login", "Authorized account detected");
  }
}

function checkJava() {
  const java = runCommand("java", ["-version"]);
  if (java.status === 0) {
    const versionLine = (java.stderr || java.stdout).split("\n")[0]?.trim() || "java present";
    addCheck("pass", "Java runtime", versionLine);
  } else {
    const fallback = "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home/bin/java";
    if (fs.existsSync(fallback)) {
      addCheck(
        "fail",
        "Java runtime",
        "Java not on PATH. Homebrew OpenJDK exists; export JAVA_HOME and prepend /opt/homebrew/opt/openjdk/bin to PATH."
      );
    } else {
      addCheck("fail", "Java runtime", "Java not on PATH. Export JAVA_HOME + PATH before emulator runs.");
    }
  }

  const javaHome = process.env.JAVA_HOME;
  if (!javaHome) {
    addCheck("warn", "JAVA_HOME", "JAVA_HOME not set in current shell");
    return;
  }

  const javaBin = path.join(javaHome, "bin", "java");
  if (fs.existsSync(javaBin)) {
    addCheck("pass", "JAVA_HOME", `JAVA_HOME points to ${javaHome}`);
  } else {
    addCheck("warn", "JAVA_HOME", `JAVA_HOME is set but ${javaBin} was not found`);
  }
}

function checkTlsConfig() {
  const certPath = process.env.NODE_EXTRA_CA_CERTS;
  if (!certPath) {
    addCheck("warn", "NODE_EXTRA_CA_CERTS", "Not set. Needed if Firebase TLS cert chain is intercepted.");
    return;
  }

  if (fs.existsSync(certPath)) {
    addCheck("pass", "NODE_EXTRA_CA_CERTS", `Using ${certPath}`);
  } else {
    addCheck("fail", "NODE_EXTRA_CA_CERTS", `File does not exist: ${certPath}`);
  }
}

function checkEmulatorJar() {
  const jarPath = path.join(
    os.homedir(),
    ".cache",
    "firebase",
    "emulators",
    "cloud-firestore-emulator-v1.20.2.jar"
  );
  const minExpectedSizeBytes = 100 * 1024 * 1024;

  if (fs.existsSync(jarPath)) {
    const sizeBytes = fs.statSync(jarPath).size;
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    if (sizeBytes < minExpectedSizeBytes) {
      addCheck(
        "warn",
        "Firestore emulator jar cache",
        `${jarPath} appears partial (${sizeMb} MB). Re-download required.`
      );
    } else {
      addCheck("pass", "Firestore emulator jar cache", `${jarPath} (${sizeMb} MB)`);
    }
  } else {
    addCheck("warn", "Firestore emulator jar cache", `Missing jar at ${jarPath}`);
  }
}

checkProjectId();
checkFirebaseAuth();
checkJava();
checkTlsConfig();
checkEmulatorJar();

let failCount = 0;
let warnCount = 0;
for (const check of checks) {
  if (check.status === "fail") failCount += 1;
  if (check.status === "warn") warnCount += 1;
  console.log(`[${check.status.toUpperCase()}] ${check.name}: ${check.detail}`);
}

console.log(`\nSummary: ${checks.length} checks, ${failCount} fail, ${warnCount} warn.`);
if (failCount > 0) {
  process.exit(1);
}
