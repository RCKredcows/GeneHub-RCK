#!/usr/bin/env node
/**
 * GeneHub Supabase Storage Backup
 * Downloads all files from every storage bucket to the local backup directory.
 *
 * Usage (called by backup.sh):
 *   node scripts/backup-storage.mjs <backup_dir>
 *
 * Requires env vars:
 *   SUPABASE_URL          - e.g. https://xnusvnwzvinhopkwmljl.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY - service_role key from Project Settings > API
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backupDir = process.argv[2];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}
if (!backupDir) {
  console.error('ERROR: Backup directory argument is required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * Recursively list all files in a bucket under the given prefix.
 * Supabase Storage list() returns max 100 items; we page through all of them.
 */
async function listAllFiles(bucket, prefix = '') {
  const files = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw new Error(`list error in bucket "${bucket}" prefix "${prefix}": ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // item is a folder — recurse
        const nested = await listAllFiles(bucket, itemPath);
        files.push(...nested);
      } else {
        files.push(itemPath);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}

async function downloadFile(bucket, filePath, destDir) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) throw new Error(`download error "${bucket}/${filePath}": ${error.message}`);

  const localPath = path.join(destDir, filePath);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
}

async function main() {
  const storageDir = path.join(backupDir, 'storage');
  fs.mkdirSync(storageDir, { recursive: true });

  // List all buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) throw new Error(`Failed to list buckets: ${bucketsError.message}`);

  if (!buckets || buckets.length === 0) {
    console.log('  No storage buckets found.');
    return;
  }

  console.log(`  Found ${buckets.length} bucket(s): ${buckets.map((b) => b.name).join(', ')}`);

  // Write bucket metadata
  fs.writeFileSync(
    path.join(storageDir, '_buckets.json'),
    JSON.stringify(buckets, null, 2),
  );

  for (const bucket of buckets) {
    const bucketDir = path.join(storageDir, bucket.id);
    fs.mkdirSync(bucketDir, { recursive: true });

    console.log(`\n  Backing up bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})`);

    let files;
    try {
      files = await listAllFiles(bucket.id);
    } catch (err) {
      console.error(`  ERROR listing files: ${err.message}`);
      continue;
    }

    if (files.length === 0) {
      console.log('    No files found.');
      continue;
    }

    console.log(`    ${files.length} file(s) to download...`);

    let downloaded = 0;
    let failed = 0;
    for (const filePath of files) {
      try {
        await downloadFile(bucket.id, filePath, bucketDir);
        downloaded++;
        if (downloaded % 10 === 0) console.log(`    Progress: ${downloaded}/${files.length}`);
      } catch (err) {
        console.error(`    SKIP (error): ${filePath} — ${err.message}`);
        failed++;
      }
    }

    console.log(`    Done: ${downloaded} downloaded, ${failed} failed.`);
  }
}

main().catch((err) => {
  console.error('Storage backup failed:', err.message);
  process.exit(1);
});
