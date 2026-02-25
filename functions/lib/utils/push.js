"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExpoPush = sendExpoPush;
const expo_server_sdk_1 = require("expo-server-sdk");
const expo = new expo_server_sdk_1.Expo();
async function sendExpoPush(tokens, payload) {
    const validTokens = tokens.filter((token) => expo_server_sdk_1.Expo.isExpoPushToken(token));
    if (validTokens.length === 0) {
        return;
    }
    const messages = validTokens.map((to) => ({
        to,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data
    }));
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
    }
}
