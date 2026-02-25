import { resolveFirebaseProjectId } from "./lib/firebaseProject.mjs";

try {
  const projectId = resolveFirebaseProjectId(process.cwd());
  console.log(projectId);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
