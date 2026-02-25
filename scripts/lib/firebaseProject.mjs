import fs from "node:fs";
import path from "node:path";

const PLACEHOLDER_VALUES = new Set(["", "YOUR_FIREBASE_PROJECT_ID"]);

function readEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const vars = {};
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function readFirebasercDefault(cwd) {
  const rcPath = path.join(cwd, ".firebaserc");
  if (!fs.existsSync(rcPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(rcPath, "utf8"));
    const value = parsed?.projects?.default;
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export function isUsableProjectId(value) {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim();
  return !PLACEHOLDER_VALUES.has(normalized);
}

export function getProjectSources(cwd = process.cwd()) {
  const envFileVars = readEnvFile(path.join(cwd, ".env"));

  return {
    processEnv: process.env.FIREBASE_PROJECT_ID ?? "",
    envFile: envFileVars.FIREBASE_PROJECT_ID ?? "",
    firebaserc: readFirebasercDefault(cwd) ?? ""
  };
}

export function resolveFirebaseProjectId(cwd = process.cwd()) {
  const sources = getProjectSources(cwd);
  if (isUsableProjectId(sources.processEnv)) {
    return sources.processEnv.trim();
  }
  if (isUsableProjectId(sources.envFile)) {
    return sources.envFile.trim();
  }
  if (isUsableProjectId(sources.firebaserc)) {
    return sources.firebaserc.trim();
  }

  throw new Error(
    "Firebase project id not found. Set FIREBASE_PROJECT_ID in shell or .env, or set projects.default in .firebaserc."
  );
}
