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

export type BrandingError = 'not_permitted' | 'missing_name' | 'invalid_logo';

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
