#!/usr/bin/env node
/**
 * GeneHub Database Backup (via Supabase REST API)
 * Exports all table data as JSON — no pg_dump or direct DB connection needed.
 *
 * Usage (called by backup.sh):
 *   node scripts/backup-db.mjs <backup_dir>
 *
 * Requires env vars:
 *   SUPABASE_URL              - e.g. https://xnusvnwzvinhopkwmljl.supabase.co
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

// All tables in dependency order (parents before children)
const TABLES = [
  'employees',
  'customers',
  'sires',
  'tanks',
  'canisters',
  'genetic_inventory',
  'supply_categories',
  'supply_inventory',
  'supply_usage_log',
  'nitrogen_fill_history',
  'user_settings',
  'notification_log',
  'activity_log',
  'allowed_emails',
];

const PAGE_SIZE = 1000;

async function exportTable(table) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed to read "${table}": ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function main() {
  const dbDir = path.join(backupDir, 'tables');
  fs.mkdirSync(dbDir, { recursive: true });

  const manifest = { exported_at: new Date().toISOString(), tables: {} };

  for (const table of TABLES) {
    process.stdout.write(`  ${table}... `);
    try {
      const rows = await exportTable(table);
      fs.writeFileSync(path.join(dbDir, `${table}.json`), JSON.stringify(rows, null, 2));
      manifest.tables[table] = { rows: rows.length };
      console.log(`${rows.length} rows`);
    } catch (err) {
      console.log(`SKIP (${err.message})`);
      manifest.tables[table] = { error: err.message };
    }
  }

  manifest.source_url = SUPABASE_URL;
  fs.writeFileSync(path.join(dbDir, '_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n  Manifest written to tables/_manifest.json`);
}

main().catch((err) => {
  console.error('DB backup failed:', err.message);
  process.exit(1);
});
