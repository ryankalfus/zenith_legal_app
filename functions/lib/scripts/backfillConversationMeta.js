"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
function asCount(input) {
    const value = Number(input);
    if (!Number.isFinite(value) || value < 0) {
        return 0;
    }
    return Math.floor(value);
}
function asText(input, fallback = "") {
    const value = String(input ?? "").trim();
    return value || fallback;
}
async function run() {
    const dryRun = process.argv.includes("--dry-run");
    const snapshot = await db.collection("conversations").get();
    let updated = 0;
    let skipped = 0;
    for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const candidateId = asText(data.candidateId, docSnapshot.id);
        if (!candidateId) {
            skipped += 1;
            continue;
        }
        const [candidateDoc, lastMessageSnapshot] = await Promise.all([
            db.collection("users").doc(candidateId).get(),
            docSnapshot.ref.collection("messages").orderBy("createdAt", "desc").limit(1).get()
        ]);
        const candidate = candidateDoc.data() ?? {};
        const patch = {
            candidateId,
            participantIds: [candidateId, "zenith-team"],
            candidateNameSnapshot: asText(candidate.fullName, "Candidate"),
            candidateAvatarUrlSnapshot: asText(candidate.avatarUrl),
            unreadByAdminCount: asCount(data.unreadByAdminCount),
            unreadByCandidateCount: asCount(data.unreadByCandidateCount),
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        };
        const lastMessage = lastMessageSnapshot.docs[0]?.data();
        if (lastMessage) {
            const senderRole = lastMessage.senderRole === "admin" || lastMessage.senderRole === "system"
                ? lastMessage.senderRole
                : "candidate";
            patch.lastMessageSenderRole = senderRole;
            patch.lastMessageText = asText(lastMessage.text, "(attachment)");
            if (lastMessage.createdAt) {
                patch.lastMessageAt = lastMessage.createdAt;
            }
        }
        if (!dryRun) {
            await docSnapshot.ref.set(patch, { merge: true });
        }
        updated += 1;
    }
    console.log(`Backfill complete. Conversations scanned=${snapshot.size}, updated=${updated}, skipped=${skipped}, dryRun=${dryRun}`);
}
run().catch((error) => {
    console.error(error);
    process.exit(1);
});
