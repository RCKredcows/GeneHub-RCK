import { supabase } from '../lib/supabase';
import { DEFAULT_TENANT, type TenantConfig } from '../config/tenant';

/**
 * The signed-in user's tenant.
 *
 * No filter is needed: row level security restricts this table to the caller's
 * own tenant, so an unqualified select returns exactly one row.
 */
export async function fetchCurrentTenant(): Promise<TenantConfig | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('slug, name, legal_name, logo_url, login_hint, report_footer')
    .maybeSingle();

  if (error) throw error;
  return data ? toConfig(data) : null;
}

/**
 * Branding for a tenant identified by subdomain, callable before login.
 *
 * Goes through an RPC rather than the table because an anonymous visitor
 * cannot read `tenants` -- the login screen has to render before there is a
 * session to authorize against.
 */
export async function fetchTenantBranding(slug: string): Promise<TenantConfig | null> {
  const { data, error } = await supabase
    .rpc('get_tenant_branding', { p_slug: slug })
    .maybeSingle();

  if (error) throw error;
  return data ? toConfig(data) : null;
}

interface TenantRow {
  slug?: string | null;
  name?: string | null;
  legal_name?: string | null;
  logo_url?: string | null;
  login_hint?: string | null;
  report_footer?: string | null;
}

/**
 * Optional branding falls back to the neutral default rather than an empty
 * string. An empty src renders as a broken image showing alt text, which looks
 * like a bug to the tenant rather than like an unset field.
 */
function toConfig(row: TenantRow): TenantConfig {
  const name = row.name || DEFAULT_TENANT.name;
  const legalName = row.legal_name || name;

  return {
    slug: row.slug ?? '',
    name,
    legalName,
    logoUrl: row.logo_url || DEFAULT_TENANT.logoUrl,
    loginHint: row.login_hint ?? '',
    reportFooter: row.report_footer || legalName,
  };
}
