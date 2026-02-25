import path from "node:path";
import fs from "node:fs/promises";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function run() {
  const filePath = path.resolve(process.cwd(), "../firm-list-2026.md");
  const content = await fs.readFile(filePath, "utf8");

  const names = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);

  const skipped: string[] = [];
  const usedIds = new Set<string>();
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
    batch.set(
      ref,
      {
        id: firm.id,
        name: firm.name,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
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
