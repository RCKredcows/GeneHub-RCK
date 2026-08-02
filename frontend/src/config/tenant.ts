/**
 * Tenant-specific presentation.
 *
 * `tenant` is a mutable module object rather than a React context on purpose.
 * Roughly twenty components read it directly, and routing them all through a
 * hook would be churn for no benefit -- the value changes at most twice per
 * session, and never while the authenticated UI is mounted.
 *
 * The lifecycle is: fall back to neutral defaults, hydrate from the subdomain
 * before the login screen paints, then re-hydrate from the signed-in user's
 * tenant. App.tsx holds the loading gate open until hydration finishes, so no
 * component ever renders against a stale value.
 *
 * Nothing in here is authorization. It is labels, logos, and copy.
 */

export interface TenantConfig {
  /** Subdomain, and the tenant's stable identifier in the UI layer. */
  slug: string;
  /** Short name used in labels, e.g. the owner filter tab. */
  name: string;
  /** Full legal name for report footers and copyright lines. */
  legalName: string;
  /** Path or URL to the logo shown on the auth screens. */
  logoUrl: string;
  /** Trailing line on generated reports. */
  reportFooter: string;
  /** Hint shown under the login form. */
  loginHint: string;
}

/**
 * Used before a tenant is known: an unrecognised subdomain, or the apex.
 * Deliberately unbranded rather than any one customer's identity.
 */
export const DEFAULT_TENANT: TenantConfig = {
  slug: '',
  name: 'GeneHub',
  legalName: 'GeneHub',
  logoUrl: '/icon-192.png',
  reportFooter: 'GeneHub',
  loginHint: '',
};

/** Read at render time by components; mutated only by applyTenant/resetTenant. */
export const tenant: TenantConfig = { ...DEFAULT_TENANT };

export function applyTenant(config: TenantConfig | null): void {
  Object.assign(tenant, config ?? DEFAULT_TENANT);
}

export function resetTenant(): void {
  Object.assign(tenant, DEFAULT_TENANT);
}

/**
 * Tenant slug from the hostname, or null at the apex.
 *
 * Only the leftmost label counts, and only when there is one more label than
 * the registrable domain. Localhost and IP addresses yield null so local
 * development falls back to defaults.
 */
export function tenantSlugFromHostname(hostname: string = window.location.hostname): string | null {
  if (!hostname || hostname === 'localhost' || /^[\d.]+$/.test(hostname)) return null;

  const labels = hostname.split('.');
  if (labels.length < 3) return null;

  const slug = labels[0].toLowerCase();
  if (slug === 'www') return null;

  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug) ? slug : null;
}

/** Shown when the current host cannot carry tenant subdomains. */
export const PUBLIC_DOMAIN = 'genehub.app';

/**
 * The registrable domain, with any tenant label stripped.
 * bar7.daltongorham.com -> daltongorham.com
 *
 * Hosts that cannot serve subdomains at all -- an IP address or localhost --
 * fall back to the public domain. Splitting an IP on dots would otherwise turn
 * 192.168.4.38 into 168.4.38 and show it as if it were a domain.
 */
export function baseDomain(hostname: string = window.location.hostname): string {
  if (/^[\d.]+$/.test(hostname) || hostname === 'localhost') return PUBLIC_DOMAIN;

  const labels = hostname.split('.');
  return labels.length >= 3 ? labels.slice(1).join('.') : hostname;
}

/** The hostname a given tenant should be reached at. */
export function tenantHostname(slug: string, hostname: string = window.location.hostname): string {
  return `${slug}.${baseDomain(hostname)}`;
}

/**
 * Who owns a sire or an inventory item.
 *
 * `internal` means the tenant running this system owns it. It was stored as
 * the literal 'rck' until migration 001; the concept was always generic, only
 * the value was named after the first tenant.
 */
export const OWNER_TYPE = {
  INTERNAL: 'internal',
  CUSTOMER: 'customer',
  UNKNOWN: 'unknown',
} as const;

export type OwnerType = (typeof OWNER_TYPE)[keyof typeof OWNER_TYPE];

/** Label for an owner, e.g. "RCK Owned", "Acme Farms", "Unknown Owner". */
export function ownerLabel(ownerType?: string | null, customerName?: string | null): string {
  switch (ownerType) {
    case OWNER_TYPE.INTERNAL:
      return `${tenant.name} Owned`;
    case OWNER_TYPE.CUSTOMER:
      return customerName || 'Customer Owned';
    default:
      return 'Unknown Owner';
  }
}

/** Short form used in dense tables and reports, e.g. "RCK". */
export function ownerShortLabel(ownerType?: string | null, customerName?: string | null): string {
  switch (ownerType) {
    case OWNER_TYPE.INTERNAL:
      return tenant.name;
    case OWNER_TYPE.CUSTOMER:
      return customerName || 'Customer';
    default:
      return 'Unknown';
  }
}
