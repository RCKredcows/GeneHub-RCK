/**
 * Tenant-specific presentation.
 *
 * Everything here is currently a constant for the single tenant this app was
 * built for. When multi-tenancy lands, `tenant` becomes a lookup on the tenant
 * resolved from the hostname, and nothing that imports it has to change.
 *
 * Nothing in here is authorization. It is labels, logos, and copy.
 */

export interface TenantConfig {
  /** Short name used in UI labels, e.g. the owner filter tab. */
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

export const tenant: TenantConfig = {
  name: 'RCK',
  legalName: 'RCK Genetics',
  logoUrl: '/rck_logo_dark_final-2.png',
  reportFooter: 'RCK Genetics - Internal Use Only',
  loginHint: 'RCK employees: Use your company email to access the system',
};

/**
 * Who owns a sire or an inventory item.
 *
 * `internal` means the operation running this system owns it. It was stored as
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
