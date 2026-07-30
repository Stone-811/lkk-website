// Firestore cross-project migration
// Copies ALL collections from a SOURCE project to a DEST project, preserving
// document IDs, field types (Timestamps/GeoPoints), and nested subcollections.
//
// It only WRITES to the destination — it never deletes or modifies the source,
// and it never deletes anything in the destination (set-by-id, additive).
//
// SOURCE credentials (pick one):
//   - default: read from ./.env  (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)
//   - or set SOURCE_KEY=<path to a service-account JSON> to override
// DEST credentials:
//   - DEST_KEY=<path to the destination service-account JSON>   (required)
//
// Run from the repository root (so firebase-admin resolves):
//   DRY_RUN=1 DEST_KEY=~/lkkdev-sa.json node scripts/migrate-firestore.mjs
//   # review the counts, then run for real (drop DRY_RUN):
//   DEST_KEY=~/lkkdev-sa.json node scripts/migrate-firestore.mjs
//
// Optional: ONLY=leads,lkk4_records,users,settings  → limit to specific top-level collections

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

function expandHome(p) {
  return p.startsWith('~') ? p.replace(/^~/, process.env.HOME || '') : p;
}

function loadJsonKey(path) {
  const k = JSON.parse(readFileSync(expandHome(path), 'utf8'));
  return { projectId: k.project_id, clientEmail: k.client_email, privateKey: k.private_key };
}

function parseEnvFile(path) {
  const out = {};
  let text;
  try { text = readFileSync(path, 'utf8'); } catch { return out; }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function resolveSourceCred() {
  if (process.env.SOURCE_KEY) return loadJsonKey(process.env.SOURCE_KEY);
  const env = parseEnvFile(resolve(__dirname, '..', '.env'));
  const privateKey = (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    console.error('✗ Source creds not found. Provide SOURCE_KEY=<file>, or ensure .env has FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
  return { projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey };
}

if (!process.env.DEST_KEY) {
  console.error('✗ Missing DEST_KEY (path to the destination service-account JSON)');
  process.exit(1);
}

const sourceCred = resolveSourceCred();
const destCred = loadJsonKey(process.env.DEST_KEY);
const DRY_RUN = process.env.DRY_RUN === '1';
const ONLY = process.env.ONLY
  ? process.env.ONLY.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

if (sourceCred.projectId === destCred.projectId) {
  console.error('✗ SOURCE and DEST are the same project — aborting to avoid a no-op/self-write.');
  process.exit(1);
}

const src = getFirestore(initializeApp({ credential: cert(sourceCred), projectId: sourceCred.projectId }, 'source'));
const dst = getFirestore(initializeApp({ credential: cert(destCred), projectId: destCred.projectId }, 'dest'));

console.log(`\nSOURCE ${sourceCred.projectId}  →  DEST ${destCred.projectId}${DRY_RUN ? '   (DRY RUN, no writes)' : ''}\n`);

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
