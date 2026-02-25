"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = __importDefault(require("node:fs/promises"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
async function run() {
    const filePath = node_path_1.default.resolve(process.cwd(), "../firm-list-2026.md");
    const content = await promises_1.default.readFile(filePath, "utf8");
    const names = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2).trim())
        .filter(Boolean);
    const skipped = [];
    const usedIds = new Set();
    const prepared = names
        .filter((name) => {
        if (name === "Mc") {
            skipped.push(name);
            return false;
        }
        return true;
    })
        .map((name) => {
        let base = slugify(name);
        if (!base) {
            base = "firm";
        }
        let id = base;
        let i = 2;
        while (usedIds.has(id)) {
            id = `${base}-${i}`;
            i += 1;
        }
        usedIds.add(id);
        return { id, name };
    });
    let batch = db.batch();
    let count = 0;
    for (const firm of prepared) {
        const ref = db.collection("firms").doc(firm.id);
        batch.set(ref, {
            id: firm.id,
            name: firm.name,
            isActive: true,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        count += 1;
        if (count % 400 === 0) {
            await batch.commit();
            batch = db.batch();
        }
    }
    await batch.commit();
    console.log(`Imported ${prepared.length} firms into Firestore.`);
    if (skipped.length > 0) {
        console.log(`Skipped entries: ${skipped.join(", ")}`);
    }
}
run().catch((error) => {
    console.error(error);
    process.exit(1);
});
