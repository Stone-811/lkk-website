// Firestore cross-project migration
// Copies ALL collections from a SOURCE project to a DEST project, preserving
// document IDs, field types (Timestamps/GeoPoints), and nested subcollections.
//
// It only WRITES to the destination — it never deletes or modifies the source,
// and it never deletes anything in the destination (set-by-id, additive).
//
// Prereq: download a service-account key JSON for BOTH projects
//   Firebase Console → Project settings → Service accounts → Generate new private key
//
// Run from this folder (apps/newweb) so firebase-admin resolves:
//   cd apps/newweb
//   DRY_RUN=1 SOURCE_KEY=/abs/lkk-website-dev-sa.json DEST_KEY=/abs/lkkdev-sa.json node scripts/migrate-firestore.mjs
//   # review the counts, then run for real (drop DRY_RUN):
//   SOURCE_KEY=/abs/lkk-website-dev-sa.json DEST_KEY=/abs/lkkdev-sa.json node scripts/migrate-firestore.mjs
//
// Optional: ONLY=leads,lkk4_records,users,settings  → limit to specific top-level collections

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function loadKey(envName) {
  const p = process.env[envName];
  if (!p) {
    console.error(`✗ Missing env ${envName} (path to a service-account key JSON)`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

const sourceKey = loadKey('SOURCE_KEY');
const destKey = loadKey('DEST_KEY');
const DRY_RUN = process.env.DRY_RUN === '1';
const ONLY = process.env.ONLY
  ? process.env.ONLY.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

if (sourceKey.project_id === destKey.project_id) {
  console.error('✗ SOURCE and DEST are the same project — aborting to avoid a no-op/self-write.');
  process.exit(1);
}

const src = getFirestore(
  initializeApp({ credential: cert(sourceKey), projectId: sourceKey.project_id }, 'source')
);
const dst = getFirestore(
  initializeApp({ credential: cert(destKey), projectId: destKey.project_id }, 'dest')
);

console.log(`\nSOURCE ${sourceKey.project_id}  →  DEST ${destKey.project_id}${DRY_RUN ? '   (DRY RUN, no writes)' : ''}\n`);

let totalDocs = 0;

async function copyCollection(srcColRef, dstColRef, depth = 0) {
  const snap = await srcColRef.get();
  console.log(`${'  '.repeat(depth)}• ${srcColRef.path}: ${snap.size} docs`);

  let batch = dst.batch();
  let ops = 0;
  for (const doc of snap.docs) {
    totalDocs++;
    if (!DRY_RUN) {
      batch.set(dstColRef.doc(doc.id), doc.data());
      if (++ops >= 400) {
        await batch.commit();
        batch = dst.batch();
        ops = 0;
      }
    }
    // Recurse into any subcollections this document may have
    const subcols = await doc.ref.listCollections();
    for (const sub of subcols) {
      await copyCollection(sub, dstColRef.doc(doc.id).collection(sub.id), depth + 1);
    }
  }
  if (!DRY_RUN && ops > 0) await batch.commit();
}

const rootCols = await src.listCollections();
const targets = ONLY ? rootCols.filter((c) => ONLY.includes(c.id)) : rootCols;

if (targets.length === 0) {
  console.error('✗ No matching top-level collections found in source.');
  process.exit(1);
}
console.log(`Top-level collections: ${targets.map((c) => c.id).join(', ')}\n`);

for (const col of targets) {
  await copyCollection(col, dst.collection(col.id));
}

console.log(`\n✓ Done. ${DRY_RUN ? 'Would copy' : 'Copied'} ${totalDocs} documents.`);
process.exit(0);
