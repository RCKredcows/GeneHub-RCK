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
  // Deliberately not .maybeSingle(). That asks PostgREST for a single-object
  // representation, and a set-returning function with no rows answers 406
  // instead -- which is exactly the unknown-tenant case this has to handle.
  const { data, error } = await supabase.rpc('get_tenant_branding', { p_slug: slug });

  if (error) throw error;
  return data?.[0] ? toConfig(data[0]) : null;
}

/** Whether a subdomain is well formed, unreserved, and unclaimed. */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_slug_available', { p_slug: slug });
  if (error) throw error;
  return data === true;
}

export type CreateTenantError =
  | 'invalid_slug'
  | 'reserved_slug'
  | 'slug_taken'
  | 'missing_name'
  | 'invalid_email'
  | 'email_taken';

export interface CreateTenantResult {
  ok: boolean;
  errorCode: CreateTenantError | null;
  slug: string;
}

/**
 * Sends the visitor to Stripe Checkout to start a workspace.
 *
 * The tenant is deliberately not created here. Creating it is the webhook's
 * job, once a card has been accepted -- `create_tenant_with_owner` is no
 * longer callable by anon, so the browser could not do it even if it tried.
 */
export async function startCheckout(params: {
  slug: string;
  name: string;
  email: string;
  fullName: string;
}): Promise<CreateTenantResult & { url?: string }> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: params,
  });

  if (error) {
    // The function answers a typed error code for anything the form can fix;
    // everything else is ours to look into.
    let code: CreateTenantError | null = null;
    try {
      const body = await (error as { context?: Response }).context?.json();
      code = (body?.error as CreateTenantError) ?? null;
    } catch {
      code = null;
    }

    return { ok: false, errorCode: code, slug: params.slug };
  }

  return { ok: true, errorCode: null, slug: params.slug, url: data?.url as string | undefined };
}

interface TenantRow {
  slug?: string | null;
  name?: string | null;
  legal_name?: string | null;
  logo_url?: string | null;
  login_hint?: string | null;
  report_footer?: string | null;
}

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
