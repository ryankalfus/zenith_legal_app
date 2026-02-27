import {
  addDoc,
  collection,
  getDocs,
  increment,
  limit,
  onSnapshot,
  doc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../lib/firebase";

type ViewerRole = "candidate" | "admin";

function toSortMs(input: unknown) {
  if (!input) {
    return 0;
  }
  if (typeof input === "number") {
    return input;
  }
  if (typeof input === "string") {
    const parsed = Date.parse(input);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof input === "object" && input && "toDate" in input && typeof (input as any).toDate === "function") {
    try {
      return (input as any).toDate().getTime();
    } catch {
      return 0;
    }
  }
  return 0;
}

export function watchMessages(
  candidateId: string,
  onData: (messages: any[]) => void,
  onError: (err: Error) => void
) {
  const q = query(
    collection(db, "conversations", candidateId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    },
    (err) => onError(err as Error)
  );
}

export function watchAdminConversations(
  onData: (rows: any[]) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, "conversations"));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows: any[] = snapshot.docs.map((entry) => {
        const data = entry.data();
        const candidateId = String(data.candidateId ?? entry.id);
        const previewText = String(data.lastMessageTextForAdmin ?? data.lastMessageText ?? "");
        const previewAt = data.lastMessageAtForAdmin ?? data.lastMessageAt ?? data.updatedAt;
        return {
          id: entry.id,
          ...data,
          candidateId,
          candidateName: String(data.candidateNameSnapshot ?? "Candidate"),
          candidateAvatarUrl: String(data.candidateAvatarUrlSnapshot ?? ""),
          lastMessageText: previewText,
          lastMessageAt: previewAt,
          hiddenForAdmin: Boolean(data.hiddenForAdmin),
          unreadByAdminCount: Number(data.unreadByAdminCount ?? 0),
          unreadByCandidateCount: Number(data.unreadByCandidateCount ?? 0)
        };
      }).filter((row) => !Boolean(row.hiddenForAdmin));
      rows.sort((a, b) => {
        const aMs = toSortMs(a.lastMessageAt ?? a.updatedAt);
        const bMs = toSortMs(b.lastMessageAt ?? b.updatedAt);
        return bMs - aMs;
      });
      onData(rows);
    },
    (err) => onError(err as Error)
  );
}

export function watchAdminUnreadChatsCount(
  onData: (count: number) => void,
  onError: (err: Error) => void
) {
  const q = query(collection(db, "conversations"), where("unreadByAdminCount", ">", 0));
  return onSnapshot(
    q,
    (snapshot) => {
      const totalUnread = snapshot.docs.reduce((sum, entry) => {
        const data = entry.data();
        if (Boolean(data.hiddenForAdmin)) {
          return sum;
        }
        return sum + Number(data.unreadByAdminCount ?? 0);
      }, 0);
      onData(totalUnread);
    },
    (err) => onError(err as Error)
  );
}

export function watchCandidateUnreadMessageCount(
  candidateId: string,
  onData: (count: number) => void,
  onError: (err: Error) => void
) {
  return onSnapshot(
    doc(db, "conversations", candidateId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(0);
        return;
      }
      onData(Number(snapshot.data()?.unreadByCandidateCount ?? 0));
    },
    (err) => onError(err as Error)
  );
}

export async function markConversationRead(
  candidateId: string,
  role: "candidate" | "admin"
) {
  const conversationRef = doc(db, "conversations", candidateId);
  await setDoc(
    conversationRef,
    {
      candidateId,
      participantIds: [candidateId, "zenith-team"],
      updatedAt: serverTimestamp(),
      ...(role === "admin"
        ? {
            unreadByAdminCount: 0,
            hiddenForAdmin: false,
            adminLastReadAt: serverTimestamp()
          }
        : {
            unreadByCandidateCount: 0,
            hiddenForCandidate: false,
            candidateLastReadAt: serverTimestamp()
          })
    },
    { merge: true }
  );
}

export async function startConversationAsAdmin(input: {
  candidateId: string;
  candidateName?: string;
  candidateAvatarUrl?: string;
}) {
  await setDoc(
    doc(db, "conversations", input.candidateId),
    {
      candidateId: input.candidateId,
      participantIds: [input.candidateId, "zenith-team"],
      candidateNameSnapshot: input.candidateName ?? "Candidate",
      candidateAvatarUrlSnapshot: input.candidateAvatarUrl ?? "",
      unreadByAdminCount: increment(0),
      unreadByCandidateCount: increment(0),
      lastMessageTextForAdmin: "",
      lastMessageTextForCandidate: "",
      hiddenForAdmin: false,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function deleteConversationForAdmin(candidateId: string) {
  await setDoc(
    doc(db, "conversations", candidateId),
    {
      candidateId,
      participantIds: [candidateId, "zenith-team"],
      hiddenForAdmin: true,
      unreadByAdminCount: 0,
      adminLastReadAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function refreshLocalPreview(candidateId: string, role: ViewerRole) {
  const hiddenField = role === "admin" ? "hiddenForAdmin" : "hiddenForCandidate";
  const textField = role === "admin" ? "lastMessageTextForAdmin" : "lastMessageTextForCandidate";
  const atField = role === "admin" ? "lastMessageAtForAdmin" : "lastMessageAtForCandidate";
  const senderField = role === "admin" ? "lastMessageSenderRoleForAdmin" : "lastMessageSenderRoleForCandidate";

  const q = query(
    collection(db, "conversations", candidateId, "messages"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snapshot = await getDocs(q);

  let previewText = "";
  let previewAt: unknown = null;
  let previewSenderRole: string = "";

  for (const entry of snapshot.docs) {
    const data = entry.data();
    if (Boolean((data as any)[hiddenField])) {
      continue;
    }
    previewText = String((data as any).text ?? "").trim() || "(attachment)";
    previewAt = (data as any).createdAt ?? null;
    previewSenderRole = String((data as any).senderRole ?? "");
    break;
  }

  await setDoc(
    doc(db, "conversations", candidateId),
    {
      candidateId,
      participantIds: [candidateId, "zenith-team"],
      [textField]: previewText,
      [atField]: previewAt,
      [senderField]: previewSenderRole,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function hideMessageForViewer(input: {
  candidateId: string;
  messageId: string;
  role: "candidate" | "admin";
}) {
  const messageRef = doc(db, "conversations", input.candidateId, "messages", input.messageId);
  if (input.role === "admin") {
    await updateDoc(messageRef, {
      hiddenForAdmin: true,
      deletedForAdminAt: serverTimestamp()
    });
    await refreshLocalPreview(input.candidateId, "admin");
    return;
  }

  await updateDoc(messageRef, {
    hiddenForCandidate: true,
    deletedForCandidateAt: serverTimestamp()
  });
  await refreshLocalPreview(input.candidateId, "candidate");
}

export async function sendMessage(input: {
  candidateId: string;
  senderId: string;
  senderRole: "candidate" | "admin";
  text: string;
  file?: {
    uri: string;
    mimeType: string;
    fileName: string;
  };
}) {
  const previewText = input.text.trim() || "(attachment)";
  const unreadField = input.senderRole === "candidate" ? "unreadByAdminCount" : "unreadByCandidateCount";
  const conversationRef = doc(db, "conversations", input.candidateId);
  await setDoc(
    conversationRef,
    {
      candidateId: input.candidateId,
      participantIds: [input.candidateId, "zenith-team"],
      unreadByAdminCount: increment(0),
      unreadByCandidateCount: increment(0),
      [unreadField]: increment(1),
      lastMessageText: previewText,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderRole: input.senderRole,
      lastMessageTextForAdmin: previewText,
      lastMessageAtForAdmin: serverTimestamp(),
      lastMessageSenderRoleForAdmin: input.senderRole,
      lastMessageTextForCandidate: previewText,
      lastMessageAtForCandidate: serverTimestamp(),
      lastMessageSenderRoleForCandidate: input.senderRole,
      hiddenForAdmin: false,
      hiddenForCandidate: false,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );

  let attachments: any[] = [];

  if (input.file) {
    const response = await fetch(input.file.uri);
    const blob = await response.blob();
    if (blob.size > 25 * 1024 * 1024) {
      throw new Error("File exceeds 25MB limit");
    }

    const path = `messageAttachments/${input.candidateId}/${Date.now()}-${input.file.fileName}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: input.file.mimeType });
    const url = await getDownloadURL(storageRef);

    attachments = [
      {
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
        sizeBytes: blob.size,
        storagePath: path,
        downloadUrl: url
      }
    ];
  }

  await addDoc(collection(db, "conversations", input.candidateId, "messages"), {
    candidateId: input.candidateId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    text: input.text,
    attachments,
    hiddenForAdmin: false,
    hiddenForCandidate: false,
    metaHandledClient: true,
    createdAt: serverTimestamp()
  });
}
