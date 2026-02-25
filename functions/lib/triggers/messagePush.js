"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushOnMessageCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const push_1 = require("../utils/push");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_2.getFirestore)();
exports.sendPushOnMessageCreate = (0, firestore_1.onDocumentCreated)("conversations/{candidateId}/messages/{messageId}", async (event) => {
    const candidateId = event.params.candidateId;
    const message = event.data?.data();
    if (!message || message.senderRole !== "admin") {
        return;
    }
    const userDoc = await db.collection("users").doc(candidateId).get();
    if (!userDoc.exists) {
        firebase_functions_1.logger.warn("No user for candidateId", candidateId);
        return;
    }
    const pushTokens = (userDoc.data()?.pushTokens ?? []);
    await (0, push_1.sendExpoPush)(pushTokens, {
        title: "New message from Zenith Legal",
        body: message.text ? String(message.text).slice(0, 140) : "You have a new message",
        data: { candidateId, type: "message" }
    });
});
