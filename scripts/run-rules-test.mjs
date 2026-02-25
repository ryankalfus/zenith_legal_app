import { spawn } from "node:child_process";
import fs from "node:fs";
import { resolveFirebaseProjectId } from "./lib/firebaseProject.mjs";

const projectId = resolveFirebaseProjectId(process.cwd());
console.log(`Using Firebase project: ${projectId}`);

const firebaseBin = process.platform === "win32" ? "firebase.cmd" : "firebase";
const env = { ...process.env };
const homebrewJavaHome = "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home";
const homebrewJavaBin = `${homebrewJavaHome}/bin/java`;

if (!env.JAVA_HOME && fs.existsSync(homebrewJavaBin)) {
  env.JAVA_HOME = homebrewJavaHome;
  env.PATH = `/opt/homebrew/opt/openjdk/bin:${env.PATH ?? ""}`;
  console.log(`Using fallback JAVA_HOME: ${homebrewJavaHome}`);
}

const child = spawn(
  firebaseBin,
  [
    "emulators:exec",
    "--project",
    projectId,
    "--only",
    "auth,firestore",
    "npm run test:rules:local"
  ],
  {
    stdio: "inherit",
    env
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
