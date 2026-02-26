import {
  addDoc,
  collection,
  getDoc,
  increment,
  onSnapshot,
  doc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../lib/firebase";

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
  const q = query(collection(db, "conversations"), orderBy("lastMessageAt", "desc"));

  return onSnapshot(
    q,
    async (snapshot) => {
      const rows = await Promise.all(
        snapshot.docs.map(async (entry) => {
          const data = entry.data();
          const candidateId = String(data.candidateId ?? entry.id);
          const candidateDoc = await getDoc(doc(db, "users", candidateId));
          const candidate = candidateDoc.data();
          return {
            id: entry.id,
            ...data,
            candidateId,
            candidateName: String(data.candidateNameSnapshot ?? candidate?.fullName ?? "Candidate"),
            candidateEmail: String(candidate?.email ?? ""),
            candidateAvatarUrl: String(data.candidateAvatarUrlSnapshot ?? candidate?.avatarUrl ?? ""),
            unreadByAdminCount: Number(data.unreadByAdminCount ?? 0),
            unreadByCandidateCount: Number(data.unreadByCandidateCount ?? 0)
          };
        })
      );
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
    (snapshot) => onData(snapshot.size),
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
            adminLastReadAt: serverTimestamp()
          }
        : {
            unreadByCandidateCount: 0,
            candidateLastReadAt: serverTimestamp()
          })
    },
    { merge: true }
  );
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
  const conversationRef = doc(db, "conversations", input.candidateId);
  await setDoc(
    conversationRef,
    {
      candidateId: input.candidateId,
      participantIds: [input.candidateId, "zenith-team"],
      unreadByAdminCount: increment(0),
      unreadByCandidateCount: increment(0),
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
    createdAt: serverTimestamp()
  });
}
