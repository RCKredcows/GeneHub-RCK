import { supabase } from '../lib/supabase';
import { applyTenant, tenant, type TenantConfig } from '../config/tenant';

/**
 * Workspace branding: the name, logo, and wording shown around the app.
 *
 * Reads go through RLS, which already scopes `tenants` to the caller's own
 * row. Writes go through a function instead: the same row carries
 * subscription state, and a row-level policy cannot allow one column while
 * refusing another.
 */

export interface Branding {
  name: string;
  legalName: string;
  logoUrl: string;
  loginHint: string;
  reportFooter: string;
}

export type BrandingError =
  | 'not_permitted'
  | 'missing_name'
  | 'invalid_logo'
  | 'upload_failed'
  | 'file_too_large'
  | 'wrong_file_type';

export interface BrandingResult {
  ok: boolean;
  errorCode: BrandingError | null;
}

export async function fetchBranding(): Promise<Branding> {
  const { data, error } = await supabase
    .from('tenants')
    .select('name, legal_name, logo_url, login_hint, report_footer')
    .maybeSingle();

  if (error) throw error;

  return {
    name: data?.name ?? '',
    legalName: data?.legal_name ?? '',
    logoUrl: data?.logo_url ?? '',
    loginHint: data?.login_hint ?? '',
    reportFooter: data?.report_footer ?? '',
  };
}

export async function updateBranding(branding: Branding): Promise<BrandingResult> {
  const { data, error } = await supabase.rpc('update_tenant_branding', {
    p_name: branding.name,
    p_legal_name: branding.legalName,
    p_logo_url: branding.logoUrl,
    p_login_hint: branding.loginHint,
    p_report_footer: branding.reportFooter,
  });

  if (error) throw error;

  const row = data?.[0];
  if (!row?.ok) {
    return { ok: false, errorCode: (row?.error_code as BrandingError) ?? null };
  }

  // Twenty-odd components read `tenant` directly at render time, so the saved
  // values are pushed into it here. Without this the sidebar and reports keep
  // showing the old name until the next full page load.
  const next: TenantConfig = {
    ...tenant,
    name: branding.name.trim(),
    legalName: branding.legalName.trim() || branding.name.trim(),
    logoUrl: branding.logoUrl.trim() || tenant.logoUrl,
    loginHint: branding.loginHint.trim(),
    reportFooter: branding.reportFooter.trim() || branding.legalName.trim() || branding.name.trim(),
  };
  applyTenant(next);

  return { ok: true, errorCode: null };
}

const LOGO_BUCKET = 'tenant-logos';
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

/**
 * Uploads a workspace logo and returns its public URL.
 *
 * Files live under a folder named for the tenant. That is not cosmetic: the
 * storage policies check the folder against the caller's own membership, so
 * the path is what stops one workspace overwriting another's logo.
 *
 * The size and type are checked here as a courtesy -- the bucket enforces both
 * regardless, so a request that skips this still fails.
 */
export async function uploadLogo(
  file: File
): Promise<{ ok: true; url: string } | { ok: false; errorCode: BrandingError }> {
  if (file.size > MAX_LOGO_BYTES) return { ok: false, errorCode: 'file_too_large' };
  if (!LOGO_TYPES.includes(file.type)) return { ok: false, errorCode: 'wrong_file_type' };

  try {
    const { data: tenantRow, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenantRow) return { ok: false, errorCode: 'not_permitted' };

    // Timestamped so a replacement is not served from cache, and so the old
    // file can be cleaned up afterwards rather than overwritten in place.
    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const path = `${tenantRow.id}/logo-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, file, { cacheControl: '31536000', upsert: false });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);

    // Previous logos for this workspace are now unreferenced.
    void removeOldLogos(tenantRow.id, path);

    return { ok: true, url: publicUrl };
  } catch (error) {
    console.error('Logo upload failed:', error);
    return { ok: false, errorCode: 'upload_failed' };
  }
}

/** Clears out superseded logos. Failure here is untidy, not harmful. */
async function removeOldLogos(tenantId: string, keepPath: string) {
  try {
    const { data: files } = await supabase.storage.from(LOGO_BUCKET).list(tenantId);
    if (!files?.length) return;

    const stale = files
      .map((file) => `${tenantId}/${file.name}`)
      .filter((path) => path !== keepPath);

    if (stale.length) await supabase.storage.from(LOGO_BUCKET).remove(stale);
  } catch (error) {
    console.error('Could not clear old logos:', error);
  }
}
