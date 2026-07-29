#!/usr/bin/env node
/**
 * GeneHub Supabase Storage Restore
 * Creates buckets and uploads all files from a local backup to a new Supabase project.
 *
 * Usage (called by restore.sh):
 *   node scripts/restore-storage.mjs <backup_dir>
 *
 * Requires env vars:
 *   NEW_SUPABASE_URL              - e.g. https://newprojectref.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY     - service_role key of the NEW project
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEW_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backupDir = process.argv[2];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: NEW_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}
if (!backupDir) {
  console.error('ERROR: Backup directory argument is required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Recursively collect all file paths under a directory. */
function walkDir(dir, base = dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, base));
    } else {
      results.push(path.relative(base, fullPath));
    }
  }
  return results;
}

async function main() {
  const storageDir = path.join(backupDir, 'storage');
  const bucketsFile = path.join(storageDir, '_buckets.json');

  if (!fs.existsSync(bucketsFile)) {
    console.log('  No _buckets.json found — nothing to restore.');
    return;
  }

  const buckets = JSON.parse(fs.readFileSync(bucketsFile, 'utf-8'));
  console.log(`  Restoring ${buckets.length} bucket(s)...`);

  for (const bucket of buckets) {
    console.log(`\n  Bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})`);

    // Create the bucket on the new project
    const { error: createError } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      allowedMimeTypes: bucket.allowed_mime_types ?? undefined,
      fileSizeLimit: bucket.file_size_limit ?? undefined,
    });

    if (createError && !createError.message.includes('already exists')) {
      console.error(`  ERROR creating bucket: ${createError.message}`);
      continue;
    }

    const bucketDir = path.join(storageDir, bucket.id);
    if (!fs.existsSync(bucketDir)) {
      console.log('    No files directory found — skipping upload.');
      continue;
    }

    const files = walkDir(bucketDir);
    if (files.length === 0) {
      console.log('    No files to upload.');
      continue;
    }

    console.log(`    Uploading ${files.length} file(s)...`);
    let uploaded = 0;
    let failed = 0;

    for (const relPath of files) {
      const localPath = path.join(bucketDir, relPath);
      const fileBuffer = fs.readFileSync(localPath);

      const { error: uploadError } = await supabase.storage
        .from(bucket.id)
        .upload(relPath, fileBuffer, { upsert: true });

      if (uploadError) {
        console.error(`    SKIP (error): ${relPath} — ${uploadError.message}`);
        failed++;
      } else {
        uploaded++;
        if (uploaded % 10 === 0) console.log(`    Progress: ${uploaded}/${files.length}`);
      }
    }

    console.log(`    Done: ${uploaded} uploaded, ${failed} failed.`);
  }
}

main().catch((err) => {
  console.error('Storage restore failed:', err.message);
  process.exit(1);
});
