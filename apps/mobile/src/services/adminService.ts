import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  User
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { normalizeAssignedEmail, normalizeAssignedPhone } from "../lib/zenithContact";

export type CandidateRow = {
  id: string;
  uid?: string;
  role?: "candidate" | "admin";
  fullName?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: string;
  jdDegreeDate?: string;
  avatarUrl?: string;
  avatarPath?: string;
  assignedHeaderEmail?: string;
  assignedHeaderPhone?: string;
  hasAppointmentUpdates?: boolean;
  assignedRecruiterId?: string;
  assignedRecruiterName?: string;
  updatedAt?: unknown;
  preferences?: {
    preferredCities?: string[];
    practiceArea?: string;
  };
};

export type RecruiterRow = CandidateRow;

export type FirmRow = {
  id: string;
  name: string;
};

const LEGACY_REMOVED_CANDIDATE_NAME = "ryan klfus";
const LEGACY_REMOVED_CANDIDATE_EMAIL = "ryansamuelkalfus@gmail.com";

function normalizeName(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizePhoneDigits(value: unknown) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

function getTimestampMs(value: unknown) {
  if (!value) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && value && "toDate" in value && typeof (value as any).toDate === "function") {
    try {
      return (value as any).toDate().getTime();
    } catch {
      return 0;
    }
  }
  return 0;
}

function getNameQuality(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return 0;
  }
  return tokens.reduce((score, token) => {
    if (/^[A-Z][a-z]+$/.test(token)) {
      return score + 2;
    }
    if (/^[A-Z]/.test(token)) {
      return score + 1;
    }
    return score;
  }, 0);
}

function getProfileCompleteness(row: CandidateRow) {
  let score = 0;
  if (String(row.uid ?? "").trim()) score += 2;
  if (String(row.uid ?? "").trim() && String(row.uid ?? "").trim() === row.id) score += 3;
  if (String(row.fullName ?? "").trim()) score += 1;
  if (String(row.mobile ?? "").trim()) score += 1;
  if (String(row.avatarUrl ?? "").trim()) score += 1;
  if (String(row.dateOfBirth ?? "").trim()) score += 1;
  if (String(row.jdDegreeDate ?? "").trim()) score += 1;
  if (String(row.preferences?.practiceArea ?? "").trim()) score += 1;
  if ((row.preferences?.preferredCities ?? []).length > 0) score += 1;
  return score;
}

function shouldReplaceCandidate(existing: CandidateRow, incoming: CandidateRow) {
  const existingScore =
    getNameQuality(String(existing.fullName ?? "")) * 10 +
    getProfileCompleteness(existing) * 5 +
    getTimestampMs((existing as any).updatedAt);
  const incomingScore =
    getNameQuality(String(incoming.fullName ?? "")) * 10 +
    getProfileCompleteness(incoming) * 5 +
    getTimestampMs((incoming as any).updatedAt);
  return incomingScore > existingScore;
}

function sortByName(rows: CandidateRow[]) {
  return rows.sort((a, b) =>
    String(a.fullName ?? "").localeCompare(String(b.fullName ?? ""), "en", { sensitivity: "base" })
  );
}

function dedupeCandidates(rows: CandidateRow[]) {
  const grouped = new Map<string, CandidateRow[]>();
  for (const row of rows) {
    const emailKey = String(row.email ?? "").trim().toLowerCase();
    const key = emailKey || row.id;
    const existing = grouped.get(key) ?? [];
    existing.push(row);
    grouped.set(key, existing);
  }

  const deduped: CandidateRow[] = [];
  grouped.forEach((groupRows) => {
    const uidLinked = groupRows.filter((row) => {
      const uid = String(row.uid ?? "").trim();
      return Boolean(uid) && uid === row.id;
    });

    const pickFrom = uidLinked.length > 0 ? uidLinked : groupRows;
    let winner = pickFrom[0];
    for (let index = 1; index < pickFrom.length; index += 1) {
      if (shouldReplaceCandidate(winner, pickFrom[index])) {
        winner = pickFrom[index];
      }
    }
    deduped.push(winner);
  });

  return sortByName(deduped);
}

function isLegacyRemovedCandidate(row: CandidateRow) {
  const name = normalizeName(row.fullName);
  const email = String(row.email ?? "").trim().toLowerCase();
  return name === LEGACY_REMOVED_CANDIDATE_NAME && email === LEGACY_REMOVED_CANDIDATE_EMAIL;
}

export function watchCandidates(onData: (rows: CandidateRow[]) => void, onError: (error: Error) => void) {
  const q = query(collection(db, "users"), where("role", "==", "candidate"), orderBy("fullName", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CandidateRow, "id">) }));
      onData(dedupeCandidates(rows).filter((row) => !isLegacyRemovedCandidate(row)));
    },
    (error) => onError(error as Error)
  );
}

export function watchRecruiters(onData: (rows: RecruiterRow[]) => void, onError: (error: Error) => void) {
  const q = query(collection(db, "users"), where("role", "==", "admin"));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<RecruiterRow, "id">)
      }));
      onData(dedupeCandidates(rows));
    },
    (error) => onError(error as Error)
  );
}

export function watchCandidateById(
  candidateId: string,
  onData: (row: CandidateRow | null) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    doc(db, "users", candidateId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData({ id: snapshot.id, ...(snapshot.data() as Omit<CandidateRow, "id">) });
    },
    (error) => onError(error as Error)
  );
}

export const watchRecruiterById = watchCandidateById;

export function watchFirms(onData: (rows: FirmRow[]) => void, onError: (error: Error) => void) {
  const q = query(collection(db, "firms"), orderBy("name", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((entry) => {
          const data = entry.data();
          return { id: entry.id, name: String(data.name ?? entry.id) };
        })
      );
    },
    (error) => onError(error as Error)
  );
}

export async function updateCandidateAssignedHeader(
  candidateId: string,
  input: { assignedHeaderEmail: string; assignedHeaderPhone: string }
) {
  const candidateRef = doc(db, "users", candidateId);
  const candidateSnap = await getDoc(candidateRef);
  if (!candidateSnap.exists()) {
    throw new Error("Candidate profile no longer exists.");
  }

  const candidateData = candidateSnap.data() as Record<string, unknown>;
  const targetUid = String(candidateData?.uid ?? candidateId).trim();
  const targetEmail = String(candidateData?.email ?? "").trim().toLowerCase();
  const targetName = normalizeName(candidateData?.fullName);
  const targetPhoneDigits = normalizePhoneDigits(candidateData?.mobile);
  const payload = {
    assignedHeaderEmail: normalizeAssignedEmail(input.assignedHeaderEmail),
    assignedHeaderPhone: normalizeAssignedPhone(input.assignedHeaderPhone),
    updatedAt: serverTimestamp()
  };

  const batch = writeBatch(db);
  batch.update(candidateRef, payload);

  const conversationCandidateIds = new Set<string>();
  conversationCandidateIds.add(candidateId);
  if (targetUid) {
    conversationCandidateIds.add(targetUid);
  }

  if (targetUid && targetUid !== candidateId) {
    const activeAuthRef = doc(db, "users", targetUid);
    const activeAuthSnap = await getDoc(activeAuthRef);
    if (activeAuthSnap.exists()) {
      batch.update(activeAuthRef, payload);
      conversationCandidateIds.add(activeAuthRef.id);
    }
  }

  if (targetEmail || targetUid || targetName || targetPhoneDigits) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    usersSnapshot.docs.forEach((entry) => {
      if (entry.id === candidateId) {
        return;
      }
      const row = entry.data() as Record<string, unknown>;
      const rowRole = String(row.role ?? "").trim().toLowerCase();
      if (rowRole === "admin") {
        return;
      }
      const rowUid = String(entry.data()?.uid ?? "").trim();
      const rowEmail = String(entry.data()?.email ?? "").trim().toLowerCase();
      const rowName = normalizeName(row.fullName);
      const rowPhoneDigits = normalizePhoneDigits(row.mobile);

      const matchesEmail = Boolean(targetEmail) && rowEmail === targetEmail;
      const matchesUid = Boolean(targetUid) && rowUid === targetUid;
      const matchesDocId = Boolean(targetUid) && entry.id === targetUid;
      const matchesNameAndPhone =
        Boolean(targetName) &&
        Boolean(targetPhoneDigits) &&
        rowName === targetName &&
        rowPhoneDigits === targetPhoneDigits;

      if (matchesEmail || matchesUid || matchesDocId || matchesNameAndPhone) {
        batch.update(entry.ref, payload);
        conversationCandidateIds.add(entry.id);
        if (rowUid) {
          conversationCandidateIds.add(rowUid);
        }
      }
    });
  }

  await batch.commit();

  const conversationPayload = {
    assignedHeaderEmail: payload.assignedHeaderEmail,
    assignedHeaderPhone: payload.assignedHeaderPhone,
    assignedHeaderUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await Promise.all(
    [...conversationCandidateIds]
      .map((entry) => String(entry).trim())
      .filter(Boolean)
      .map((conversationCandidateId) =>
        setDoc(
          doc(db, "conversations", conversationCandidateId),
          {
            candidateId: conversationCandidateId,
            participantIds: [conversationCandidateId, "zenith-team"],
            ...conversationPayload
          },
          { merge: true }
        )
      )
  );
}

export async function purgeLegacyRyanKlfusCandidate() {
  const q = query(collection(db, "users"), where("role", "==", "candidate"));
  const snapshot = await getDocs(q);
  const matches = snapshot.docs.filter((entry) => {
    const data = entry.data() as Record<string, unknown>;
    const name = normalizeName(data.fullName);
    const email = String(data.email ?? "").trim().toLowerCase();
    return name === LEGACY_REMOVED_CANDIDATE_NAME && email === LEGACY_REMOVED_CANDIDATE_EMAIL;
  });

  await Promise.all(matches.map((entry) => deleteDoc(entry.ref)));
  return matches.length;
}

export async function updateCandidateAssignedRecruiter(
  candidateId: string,
  input: { assignedRecruiterId?: string | null; assignedRecruiterName?: string | null }
) {
  const candidateRef = doc(db, "users", candidateId);
  const candidateSnap = await getDoc(candidateRef);
  if (!candidateSnap.exists()) {
    throw new Error("Candidate profile no longer exists.");
  }

  const candidateData = candidateSnap.data() as Record<string, unknown>;
  const targetUid = String(candidateData?.uid ?? candidateId).trim();
  const targetEmail = String(candidateData?.email ?? "").trim().toLowerCase();
  const targetName = normalizeName(candidateData?.fullName);
  const targetPhoneDigits = normalizePhoneDigits(candidateData?.mobile);

  const recruiterId = String(input.assignedRecruiterId ?? "").trim();
  const recruiterName = String(input.assignedRecruiterName ?? "").trim();
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    assignedRecruiterId: recruiterId || deleteField(),
    assignedRecruiterName: recruiterName || deleteField()
  };

  const batch = writeBatch(db);
  batch.update(candidateRef, payload);

  if (targetUid && targetUid !== candidateId) {
    const activeAuthRef = doc(db, "users", targetUid);
    const activeAuthSnap = await getDoc(activeAuthRef);
    if (activeAuthSnap.exists()) {
      batch.update(activeAuthRef, payload);
    }
  }

  if (targetEmail || targetUid || targetName || targetPhoneDigits) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    usersSnapshot.docs.forEach((entry) => {
      if (entry.id === candidateId) {
        return;
      }
      const row = entry.data() as Record<string, unknown>;
      const rowRole = String(row.role ?? "").trim().toLowerCase();
      if (rowRole === "admin") {
        return;
      }

      const rowUid = String(entry.data()?.uid ?? "").trim();
      const rowEmail = String(entry.data()?.email ?? "").trim().toLowerCase();
      const rowName = normalizeName(row.fullName);
      const rowPhoneDigits = normalizePhoneDigits(row.mobile);

      const matchesEmail = Boolean(targetEmail) && rowEmail === targetEmail;
      const matchesUid = Boolean(targetUid) && rowUid === targetUid;
      const matchesDocId = Boolean(targetUid) && entry.id === targetUid;
      const matchesNameAndPhone =
        Boolean(targetName) &&
        Boolean(targetPhoneDigits) &&
        rowName === targetName &&
        rowPhoneDigits === targetPhoneDigits;

      if (matchesEmail || matchesUid || matchesDocId || matchesNameAndPhone) {
        batch.update(entry.ref, payload);
      }
    });
  }

  await batch.commit();
}

export async function changeUserRoleByAdmin(input: { targetUid: string; targetRole: "candidate" | "admin" }) {
  const targetRef = doc(db, "users", input.targetUid);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) {
    throw new Error("User was not found.");
  }

  const currentRole = String(targetSnap.data()?.role ?? "candidate").trim().toLowerCase();
  if (currentRole === input.targetRole) {
    return;
  }

  const payload: Record<string, unknown> = {
    role: input.targetRole,
    updatedAt: serverTimestamp()
  };

  if (input.targetRole === "candidate") {
    const existingPreferences = targetSnap.data()?.preferences;
    if (!existingPreferences) {
      payload.preferences = {
        preferredCities: [],
        practiceArea: "Antitrust"
      };
    }
  }

  await updateDoc(targetRef, payload);
}

export async function updateAdminOwnProfile(input: { uid: string; fullName: string; mobile: string; email?: string }) {
  const currentEmail = String(input.email ?? auth.currentUser?.email ?? "")
    .trim()
    .toLowerCase();

  const batch = writeBatch(db);
  const ownRef = doc(db, "users", input.uid);
  batch.set(
    ownRef,
    {
      uid: input.uid,
      role: "admin",
      ...(currentEmail ? { email: currentEmail } : {}),
      fullName: input.fullName,
      mobile: input.mobile,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  const usersSnapshot = await getDocs(collection(db, "users"));
  usersSnapshot.docs.forEach((entry) => {
    const data = entry.data() as Record<string, unknown>;
    const rowRole = String(data.role ?? "").trim().toLowerCase();
    if (rowRole !== "admin") {
      return;
    }

    const rowUid = String(data.uid ?? "").trim();
    const rowEmail = String(data.email ?? "").trim().toLowerCase();
    if (entry.id === input.uid || rowUid === input.uid || (currentEmail && rowEmail === currentEmail)) {
      batch.set(
        entry.ref,
        {
          uid: input.uid,
          fullName: input.fullName,
          mobile: input.mobile,
          ...(currentEmail ? { email: currentEmail } : {}),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
  });

  await batch.commit();
}

async function reauthenticateForEmailChange(user: User, oldEmail: string, currentPassword: string) {
  const credential = EmailAuthProvider.credential(oldEmail, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

export async function changeAdminEmailWithPassword(input: {
  oldEmail: string;
  newEmail: string;
  currentPassword: string;
}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user.");
  }

  const oldEmail = input.oldEmail.trim().toLowerCase();
  const newEmail = input.newEmail.trim().toLowerCase();
  const currentEmail = String(user.email ?? "").trim().toLowerCase();

  if (!oldEmail || !newEmail || !input.currentPassword.trim()) {
    throw new Error("Old email, new email, and current password are required.");
  }

  if (oldEmail !== currentEmail) {
    throw new Error("Old email does not match your signed-in account email.");
  }

  await reauthenticateForEmailChange(user, oldEmail, input.currentPassword);
  await updateEmail(user, newEmail);

  await updateDoc(doc(db, "users", user.uid), {
    email: newEmail,
    updatedAt: serverTimestamp()
  });

  await user.getIdToken(true).catch(() => undefined);
}
