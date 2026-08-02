import { supabase } from '../lib/supabase';

/**
 * Workspace people: who is in it, who has been invited, and what they may do.
 *
 * Row level security scopes every query below to the caller's own workspace,
 * so none of these filter by tenant explicitly. The three things RLS cannot
 * express -- removing an account, changing a role, and the rules that stop a
 * workspace losing its last owner -- go through SECURITY DEFINER functions.
 */

export type Role = 'owner' | 'admin' | 'member';

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export const ROLE_HINTS: Record<Role, string> = {
  owner: 'Billing and workspace settings',
  admin: 'Can invite and remove people',
  member: 'Day-to-day work',
};

export interface Member {
  id: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export type MemberError =
  | 'send_failed' 
  | 'not_permitted'
  | 'not_found'
  | 'cannot_remove_self'
  | 'last_owner'
  | 'invalid_role'
  | 'email_taken'
  | 'invalid_email';

export interface MemberResult {
  ok: boolean;
  errorCode: MemberError | null;
}

/** Everyone with an account in this workspace. */
export async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, role, is_active, created_at')
    .order('role')
    .order('full_name');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    role: (row.role ?? 'member') as Role,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
  }));
}

/** Invitations that are still open: not accepted, not revoked. */
export async function fetchInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('id, email, full_name, role, invited_by, created_at, expires_at')
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const now = Date.now();
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? '',
    role: (row.role ?? 'member') as Role,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isExpired: new Date(row.expires_at).getTime() < now,
  }));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invites someone to this workspace.
 *
 * The tenant comes from the caller's own membership -- deliberately not a
 * parameter, so a request cannot invite someone into a workspace the caller
 * does not belong to.
 */
export async function inviteMember(params: {
  email: string;
  fullName: string;
  role: Role;
}): Promise<MemberResult> {
  const email = params.email.trim().toLowerCase();

  if (!EMAIL.test(email)) return { ok: false, errorCode: 'invalid_email' };

  const { data: me, error: meError } = await supabase
    .from('employees')
    .select('tenant_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .single();

  if (meError) throw meError;

  const { data: created, error } = await supabase
    .from('invitations')
    .insert({
      tenant_id: me.tenant_id,
      email,
      full_name: params.fullName.trim(),
      role: params.role,
      invited_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .select('id')
    .single();

  if (error) {
    // The partial unique index on live invitations, or an existing account.
    if (error.code === '23505') return { ok: false, errorCode: 'email_taken' };
    if (error.code === '42501') return { ok: false, errorCode: 'not_permitted' };
    throw error;
  }

  return sendInvitationEmail(created.id);
}

/**
 * Sends (or resends) the invitation email.
 *
 * The invitation itself already exists at this point, so a delivery failure is
 * reported as its own thing rather than as a failed invite -- the row is still
 * good and can be resent.
 */
export async function sendInvitationEmail(invitationId: string): Promise<MemberResult> {
  const { error } = await supabase.functions.invoke('send-invitation', {
    body: { invitationId },
  });

  if (error) {
    console.error('Could not send the invitation email:', error);
    return { ok: false, errorCode: 'send_failed' };
  }

  return { ok: true, errorCode: null };
}

/** Withdraws an open invitation. Kept as a row, so the history survives. */
export async function revokeInvitation(id: string): Promise<MemberResult> {
  const { error } = await supabase
    .from('invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    if (error.code === '42501') return { ok: false, errorCode: 'not_permitted' };
    throw error;
  }

  return { ok: true, errorCode: null };
}

/** Pushes an invitation's expiry out again, for one that lapsed. */
export async function renewInvitation(id: string): Promise<MemberResult> {
  const expires = new Date();
  expires.setDate(expires.getDate() + 14);

  const { error } = await supabase
    .from('invitations')
    .update({ expires_at: expires.toISOString() })
    .eq('id', id);

  if (error) {
    if (error.code === '42501') return { ok: false, errorCode: 'not_permitted' };
    throw error;
  }

  return sendInvitationEmail(id);
}

export async function setMemberRole(memberId: string, role: Role): Promise<MemberResult> {
  const { data, error } = await supabase.rpc('set_member_role', {
    p_member_id: memberId,
    p_role: role,
  });

  if (error) throw error;

  const row = data?.[0];
  return { ok: row?.ok ?? false, errorCode: (row?.error_code as MemberError) ?? null };
}

export async function removeMember(memberId: string): Promise<MemberResult> {
  const { data, error } = await supabase.rpc('remove_member', { p_member_id: memberId });

  if (error) throw error;

  const row = data?.[0];
  return { ok: row?.ok ?? false, errorCode: (row?.error_code as MemberError) ?? null };
}

/** The signed-in user's own role, for screens that only need their own. */
export async function fetchMyRole(): Promise<Role | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('employees')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) throw error;
  return (data?.role as Role) ?? null;
}
