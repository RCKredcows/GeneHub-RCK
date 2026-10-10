#!/usr/bin/env node
/**
 * GeneHub: move sire images into their workspace's folder
 *
 * Before migration 022 every sire image sat at the root of the sire-images
 * bucket. 022 only lets a workspace write under `<tenant_id>/`, so the existing
 * files are moved into RCK's folder and sires.image_url is rewritten to match.
 * Run it once, right after the migration, in the production window.
 *
 * Usage:
 *   node scripts/move-sire-images.mjs [--tenant rck] [--dry-run]
 *
 * Requires env vars:
 *   SUPABASE_URL              - e.g. https://xnusvnwzvinhopkwmljl.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY - service_role key from Project Settings > API
 *
 * Safe to re-run. It works in two passes, both driven by what is still at the
 * root rather than by a list taken up front:
 *
 *   1. Move every file at the bucket root to `<tenant_id>/<name>`. That
 *      includes files no sire points at, so the root ends up empty.
 *   2. Rewrite every one of the tenant's sire URLs that still points at the
 *      root, once its file exists in the folder.
 *
 * A run that stops between a move and its URL update is finished by the next
 * run's second pass. Files are moved with the Storage API: renaming
 * storage.objects in SQL would not move the stored file.
 */

import { createClient } from '@supabase/supabase-js';

const BUCKET = 'sire-images';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const tenantSlug = args.includes('--tenant') ? args[args.indexOf('--tenant') + 1] : 'rck';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Files (not folders) directly under a prefix, paging past list()'s limit. */
async function listFiles(prefix) {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw new Error(`list "${prefix || '/'}": ${error.message}`);
    // Folders come back with a null id.
    files.push(...data.filter((item) => item.id !== null).map((item) => item.name));
    if (data.length < 100) break;
  }
  return files;
}

/** The object name a public URL points at, or null if it is not this bucket's. */
function objectName(url) {
  const marker = `/${BUCKET}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;
  return decodeURIComponent(url.slice(at + marker.length).split(/[?#]/)[0]);
}

async function main() {
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', tenantSlug)
    .maybeSingle();
  if (tenantError) throw tenantError;
  if (!tenant) throw new Error(`no tenant with slug "${tenantSlug}"`);

  console.log(`${dryRun ? 'DRY RUN: ' : ''}moving ${BUCKET} root files into ${tenant.slug} (${tenant.id})`);

  // Pass 1: move whatever is still at the root.
  const rootFiles = await listFiles('');
  let moved = 0;
  for (const name of rootFiles) {
    const target = `${tenant.id}/${name}`;
    if (dryRun) {
      console.log(`  would move ${name} -> ${target}`);
      continue;
    }
    const { error } = await supabase.storage.from(BUCKET).move(name, target);
    if (error) throw new Error(`move "${name}": ${error.message}`);
    moved++;
  }
  console.log(`pass 1: ${rootFiles.length} file(s) at the root, ${moved} moved`);

  // Pass 2: point the tenant's sires at the moved files.
  const inFolder = new Set(await listFiles(tenant.id));
  const { data: sires, error: siresError } = await supabase
    .from('sires')
    .select('id, image_url')
    .eq('tenant_id', tenant.id)
    .neq('image_url', '');
  if (siresError) throw siresError;

  let rewritten = 0;
  const unresolved = [];
  for (const sire of sires) {
    const name = sire.image_url && objectName(sire.image_url);
    if (!name || name.includes('/')) continue; // not ours, or already in a folder
    // In a dry run nothing has moved, so judge by what would be there.
    const willExist = inFolder.has(name) || (dryRun && rootFiles.includes(name));
    if (!willExist) {
      unresolved.push(`${sire.id} -> ${name}`);
      continue;
    }
    const url = sire.image_url.replace(`/${BUCKET}/${name}`, `/${BUCKET}/${tenant.id}/${name}`);
    if (dryRun) {
      console.log(`  would rewrite sire ${sire.id}: ${name} -> ${tenant.id}/${name}`);
    } else {
      const { error } = await supabase.from('sires').update({ image_url: url }).eq('id', sire.id);
      if (error) throw new Error(`update sire ${sire.id}: ${error.message}`);
    }
    rewritten++;
  }
  console.log(`pass 2: ${rewritten} sire URL(s) ${dryRun ? 'would be ' : ''}rewritten`);

  if (unresolved.length) {
    console.log(`WARNING: ${unresolved.length} sire URL(s) point at the root but no file exists for them:`);
    unresolved.forEach((line) => console.log(`  ${line}`));
  }
  if (!dryRun) {
    const left = await listFiles('');
    console.log(left.length === 0 ? 'done: the bucket root is empty' : `WARNING: ${left.length} file(s) still at the root`);
  }
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
