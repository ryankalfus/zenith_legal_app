import admin from "firebase-admin";
import { initializeApp as initializeClientApp, deleteApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc
} from "firebase/firestore";

const projectId = process.env.GCLOUD_PROJECT || "demo-zenith-legal";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;

if (!authHost || !firestoreHost) {
  console.error("RBAC smoke test must run against Firebase emulators.");
  console.error("Use: npm run test:rules");
  process.exit(2);
}
const [firestoreHostname, firestorePortRaw] = firestoreHost.split(":");
const firestorePort = Number(firestorePortRaw || "8080");

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const adminDb = admin.firestore();

function logPass(name) {
  console.log(`PASS: ${name}`);
}

function logFail(name, error) {
  console.error(`FAIL: ${name}`);
  console.error(error?.message || error);
}

async function assertSucceeds(name, fn) {
  try {
    await fn();
    logPass(name);
    return true;
  } catch (error) {
    logFail(name, error);
    return false;
  }
}

async function assertFails(name, fn) {
  try {
    await fn();
    logFail(name, new Error("Expected failure, but operation succeeded"));
    return false;
  } catch {
    logPass(name);
    return true;
  }
}

async function getSignedInClient({ uid, email, password, claims, label = uid }) {
  const app = initializeClientApp(
    {
      apiKey: "demo-api-key",
      authDomain: "demo.local",
      projectId,
      appId: `demo-${label}`
    },
    `client-${label}`
  );

  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });

  const db = getFirestore(app);
  connectFirestoreEmulator(db, firestoreHostname, firestorePort);

  await admin.auth().createUser({
    uid,
    email,
    password
  }).catch(() => undefined);

  await admin.auth().setCustomUserClaims(uid, claims ?? {});
  await signInWithEmailAndPassword(auth, email, password);

  return {
    db,
    close: async () => {
      await deleteApp(app);
    }
  };
}

async function seedData() {
  await adminDb.doc("users/candidateA").set({
    uid: "candidateA",
    role: "candidate",
    fullName: "Candidate A",
    email: "candidateA@example.com",
    mobile: "+15550000001",
    emailVerified: true,
    phoneVerified: true,
    pushTokens: [],
    preferences: {
      preferredCities: ["NYC"],
      practiceArea: "Antitrust"
    }
  });

  await adminDb.doc("users/candidateB").set({
    uid: "candidateB",
    role: "candidate",
    fullName: "Candidate B",
    email: "candidateB@example.com",
    mobile: "+15550000002",
    emailVerified: true,
    phoneVerified: true,
    pushTokens: [],
    preferences: {
      preferredCities: ["Boston"],
      practiceArea: "Tax & Benefits"
    }
  });

  await adminDb.doc("users/admin1").set({
    uid: "admin1",
    role: "admin",
    fullName: "Zenith Legal",
    email: "mason@zenithlegal.com",
    mobile: "+15550000003",
    emailVerified: true,
    phoneVerified: true,
    pushTokens: [],
    preferences: {
      preferredCities: [],
      practiceArea: "Antitrust"
    }
  });

  await adminDb.doc("candidateFirmStatuses/statusA").set({
    candidateId: "candidateA",
    firmId: "firm-1",
    status: "authorization_pending",
    updatedBy: "admin1",
    updatedAt: "2026-02-25T00:00:00.000Z",
    history: []
  });

  await adminDb.doc("authorizationRequests/authA").set({
    candidateId: "candidateA",
    firmId: "firm-1",
    state: "pending",
    requestedBy: "admin1",
    requestedAt: "2026-02-25T00:00:00.000Z"
  });
}

async function run() {
  await seedData();

  const defaultPassword = "Passw0rd!123";

  const candidateA = await getSignedInClient({
    uid: "candidateA",
    email: "candidateA@example.com",
    password: defaultPassword,
    claims: { role: "candidate" }
  });
  const candidateB = await getSignedInClient({
    uid: "candidateB",
    email: "candidateB@example.com",
    password: defaultPassword,
    claims: { role: "candidate" }
  });
  const adminUser = await getSignedInClient({
    uid: "admin1",
    email: "mason@zenithlegal.com",
    password: defaultPassword,
    claims: { role: "admin" }
  });
  const nonZenithAdmin = await getSignedInClient({
    uid: "candidateB",
    email: "candidateB@example.com",
    password: defaultPassword,
    claims: { role: "admin" },
    label: "candidateB-admin-claim"
  });

  const results = [];

  results.push(
    await assertSucceeds("candidate reads own profile", () =>
      getDoc(doc(candidateA.db, "users", "candidateA"))
    )
  );

  results.push(
    await assertFails("candidate cannot read other profile", () =>
      getDoc(doc(candidateA.db, "users", "candidateB"))
    )
  );

  results.push(
    await assertSucceeds("candidate updates own preferences", () =>
      updateDoc(doc(candidateA.db, "users", "candidateA"), {
        preferences: {
          preferredCities: ["NYC", "DC"],
          practiceArea: "Antitrust"
        }
      })
    )
  );

  results.push(
    await assertFails("candidate cannot promote own role", () =>
      updateDoc(doc(candidateA.db, "users", "candidateA"), {
        role: "admin"
      })
    )
  );

  results.push(
    await assertSucceeds("candidate reads own firm status", () =>
      getDoc(doc(candidateA.db, "candidateFirmStatuses", "statusA"))
    )
  );

  results.push(
    await assertSucceeds("candidate can set waiting_for_submission from authorization_pending", () =>
      updateDoc(doc(candidateA.db, "candidateFirmStatuses", "statusA"), {
        status: "waiting_for_submission",
        updatedBy: "candidateA"
      })
    )
  );

  results.push(
    await assertFails("candidate cannot edit firm status arbitrarily", () =>
      updateDoc(doc(candidateA.db, "candidateFirmStatuses", "statusA"), {
        status: "offer",
        updatedBy: "candidateA"
      })
    )
  );

  results.push(
    await assertSucceeds("candidate can approve own authorization", () =>
      updateDoc(doc(candidateA.db, "authorizationRequests", "authA"), {
        state: "approved"
      })
    )
  );

  results.push(
    await assertFails("other candidate cannot edit authorization", () =>
      updateDoc(doc(candidateB.db, "authorizationRequests", "authA"), {
        state: "declined"
      })
    )
  );

  results.push(
    await assertSucceeds("admin can write firm", () =>
      setDoc(doc(adminUser.db, "firms", "firm-1"), {
        id: "firm-1",
        name: "Demo Firm",
        isActive: true
      })
    )
  );

  results.push(
    await assertSucceeds("admin can edit candidate status", () =>
      updateDoc(doc(adminUser.db, "candidateFirmStatuses", "statusA"), {
        status: "interview",
        updatedBy: "admin1"
      })
    )
  );

  results.push(
    await assertFails("non-Zenith claimed admin cannot write firm", () =>
      setDoc(doc(nonZenithAdmin.db, "firms", "firm-2"), {
        id: "firm-2",
        name: "Blocked Firm",
        isActive: true
      })
    )
  );

  await candidateA.close();
  await candidateB.close();
  await adminUser.close();
  await nonZenithAdmin.close();

  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;
  console.log(`\nRBAC smoke test summary: ${passed} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
