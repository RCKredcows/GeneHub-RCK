#!/usr/bin/env node
/**
 * GeneHub Database Restore (via Supabase REST API)
 * Inserts all JSON table data from a backup into a new Supabase project.
 *
 * Usage (called by restore.sh):
 *   node scripts/restore-db.mjs <backup_dir>
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

// employees, user_settings, notification_log, and activity_log are omitted —
// their rows require matching auth.users records which don't exist on a fresh project.
// Users will be recreated when they sign in.

// Fields that are nullable FKs pointing to employees(id).
// We null these out so core data rows insert cleanly without needing auth accounts.
const NULLABLE_EMPLOYEE_FK_FIELDS = {
  genetic_inventory: ['created_by', 'updated_by'],
  supply_usage_log: ['used_by'],
  nitrogen_fill_history: ['filled_by'],
};

// Restore in dependency order (parents before children)
const TABLES = [
  'customers',
  'sires',
  'tanks',
  'canisters',
  'genetic_inventory',
  'supply_categories',
  'supply_inventory',
  'supply_usage_log',
  'nitrogen_fill_history',
  'allowed_emails',
];

const CHUNK_SIZE = 500;

/**
 * Recursively replace every occurrence of oldUrl with newUrl
 * in all string values across a row object.
 */
function rewriteUrls(value, oldUrl, newUrl) {
  if (typeof value === 'string') return value.replaceAll(oldUrl, newUrl);
  if (Array.isArray(value)) return value.map((v) => rewriteUrls(v, oldUrl, newUrl));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, rewriteUrls(v, oldUrl, newUrl)]),
    );
  }
  return value;
}

async function restoreTable(table, rows) {
  if (rows.length === 0) {
    console.log(`  ${table}: no rows, skipping.`);
    return;
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    inserted += chunk.length;
  }

  console.log(`  ${table}: ${inserted} rows restored.`);
}

async function main() {
  const dbDir = path.join(backupDir, 'tables');

  if (!fs.existsSync(dbDir)) {
    console.error(`ERROR: tables/ directory not found in backup: ${dbDir}`);
    process.exit(1);
  }

  // Read old project URL from manifest so storage URLs can be rewritten
  const manifestFile = path.join(dbDir, '_manifest.json');
  const manifest = fs.existsSync(manifestFile)
    ? JSON.parse(fs.readFileSync(manifestFile, 'utf-8'))
    : {};
  const oldUrl = manifest.source_url ?? null;

  if (oldUrl && oldUrl !== SUPABASE_URL) {
    console.log(`  Rewriting storage URLs: ${oldUrl} → ${SUPABASE_URL}`);
  }

  for (const table of TABLES) {
    const file = path.join(dbDir, `${table}.json`);
    if (!fs.existsSync(file)) {
      console.log(`  ${table}: no backup file found, skipping.`);
      continue;
    }

    let rows = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (oldUrl && oldUrl !== SUPABASE_URL) {
      rows = rows.map((row) => rewriteUrls(row, oldUrl, SUPABASE_URL));
    }
    const nullFields = NULLABLE_EMPLOYEE_FK_FIELDS[table];
    if (nullFields) {
      rows = rows.map((row) => {
        const copy = { ...row };
        for (const field of nullFields) copy[field] = null;
        return copy;
      });
    }

    try {
      await restoreTable(table, rows);
    } catch (err) {
      console.error(`  ${table}: ERROR — ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error('DB restore failed:', err.message);
  process.exit(1);
});
