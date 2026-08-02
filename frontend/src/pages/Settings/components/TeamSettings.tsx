import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FiAlertCircle, FiCheck, FiMail, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
import {
  fetchInvitations,
  fetchMembers,
  inviteMember,
  removeMember,
  renewInvitation,
  revokeInvitation,
  sendInvitationEmail,
  setMemberRole,
  type Invitation,
  type Member,
  type MemberError,
  type Role,
} from '../../../api/members';

/**
 * Workspace people.
 *
 * Only owners and admins see the controls; a member sees the roster and
 * nothing else. That is a courtesy rather than the enforcement -- the database
 * refuses the writes either way.
 */

const MESSAGES: Record<MemberError, string> = {
  not_permitted: 'You do not have permission to do that.',
  not_found: 'That person is no longer in this workspace.',
  cannot_remove_self: 'You cannot remove your own account.',
  last_owner: 'A workspace needs at least one owner.',
  invalid_role: 'That is not a valid role.',
  email_taken: 'That email already belongs to a workspace or has an open invitation.',
  invalid_email: 'That email address does not look right.',
  // The invitation exists either way; only delivery failed.
  send_failed: 'Invitation saved, but the email could not be sent. Try resending it.',
};

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const ROLE_HINTS: Record<Role, string> = {
  owner: 'Billing and workspace settings',
  admin: 'Can invite and remove people',
  member: 'Day-to-day work',
};

interface TeamSettingsProps {
  currentUserId?: string;
}

export default function TeamSettings({ currentUserId }: TeamSettingsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('member');

  const me = members.find((member) => member.id === currentUserId);
  const canManage = me?.role === 'owner' || me?.role === 'admin';
  const isOwner = me?.role === 'owner';

  const load = useCallback(async () => {
    try {
      const [nextMembers, nextInvitations] = await Promise.all([
        fetchMembers(),
        fetchInvitations(),
      ]);
      setMembers(nextMembers);
      setInvitations(nextInvitations);
      setError(null);
    } catch (err) {
      console.error('Could not load the team:', err);
      setError('Could not load the team. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Every action reports through the same two lines, so nothing is silent. */
  const run = async (action: () => Promise<{ ok: boolean; errorCode: MemberError | null }>, success: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const result = await action();

      if (!result.ok) {
        setError(result.errorCode ? MESSAGES[result.errorCode] : 'That did not work.');
        return false;
      }

      setNotice(success);
      await load();
      return true;
    } catch (err) {
      console.error('Team action failed:', err);
      setError('Something went wrong. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();

    const sent = await run(
      () => inviteMember({ email, fullName, role }),
      `Invitation sent to ${email.trim().toLowerCase()}.`
    );

    if (sent) {
      setEmail('');
      setFullName('');
      setRole('member');
    }
  };

  if (loading) {
    return (
      <div className="settings__card">
        <div className="settings__item">
          <p className="settings__item-value">Loading the team…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="team__banner team__banner--error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="team__banner team__banner--ok" role="status">
          <FiCheck aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      {canManage && (
        <form className="settings__card team__invite" onSubmit={handleInvite}>
          <div className="team__invite-fields">
            <label className="team__field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@operation.com"
                autoComplete="off"
                required
              />
            </label>

            <label className="team__field">
              <span>Name <em>optional</em></span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="off"
              />
            </label>

            <label className="team__field team__field--role">
              <span>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
                {/* Only an owner can hand over ownership. */}
                {(isOwner ? (['member', 'admin', 'owner'] as Role[]) : (['member', 'admin'] as Role[])).map(
                  (value) => (
                    <option key={value} value={value}>
                      {ROLE_LABELS[value]}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <button type="submit" className="team__invite-button" disabled={busy || email.trim() === ''}>
            <FiMail aria-hidden="true" /> Send invitation
          </button>

          <p className="team__hint">{ROLE_HINTS[role]}</p>
        </form>
      )}

      {invitations.length > 0 && (
        <div className="settings__card">
          <p className="team__group-label">Pending invitations</p>

          {invitations.map((invitation) => (
            <div className="settings__item team__row" key={invitation.id}>
              <div className="settings__item-info">
                <p className="settings__item-label">{invitation.email}</p>
                <p className="settings__item-value">
                  {ROLE_LABELS[invitation.role]}
                  {invitation.isExpired
                    ? ' · expired'
                    : ` · expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}
                </p>
              </div>

              {canManage && (
                <div className="team__actions">
                  <button
                    type="button"
                    className="team__action"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          invitation.isExpired
                            ? renewInvitation(invitation.id)
                            : sendInvitationEmail(invitation.id),
                        invitation.isExpired ? 'Invitation renewed and resent.' : 'Invitation resent.'
                      )
                    }
                  >
                    <FiRefreshCw aria-hidden="true" />{' '}
                    {invitation.isExpired ? 'Renew' : 'Resend'}
                  </button>

                  <button
                    type="button"
                    className="team__action team__action--danger"
                    disabled={busy}
                    onClick={() => run(() => revokeInvitation(invitation.id), 'Invitation withdrawn.')}
                  >
                    <FiX aria-hidden="true" /> Withdraw
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="settings__card">
        <p className="team__group-label">
          {members.length} {members.length === 1 ? 'person' : 'people'}
        </p>

        {members.map((member) => (
          <div className="settings__item team__row" key={member.id}>
            <div className="settings__item-info">
              <p className="settings__item-label">
                {member.fullName}
                {member.id === currentUserId && <span className="team__you">you</span>}
              </p>
              <p className="settings__item-value">{ROLE_HINTS[member.role]}</p>
            </div>

            <div className="team__actions">
              {isOwner && member.id !== currentUserId ? (
                <select
                  className="team__role-select"
                  value={member.role}
                  disabled={busy}
                  onChange={(event) =>
                    run(
                      () => setMemberRole(member.id, event.target.value as Role),
                      `${member.fullName} is now ${ROLE_LABELS[event.target.value as Role].toLowerCase()}.`
                    )
                  }
                >
                  {(['member', 'admin', 'owner'] as Role[]).map((value) => (
                    <option key={value} value={value}>
                      {ROLE_LABELS[value]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="team__role-badge">{ROLE_LABELS[member.role]}</span>
              )}

              {canManage && member.id !== currentUserId && (
                <button
                  type="button"
                  className="team__action team__action--danger"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Remove ${member.fullName} from this workspace?`)) return;
                    void run(() => removeMember(member.id), `${member.fullName} was removed.`);
                  }}
                >
                  <FiTrash2 aria-hidden="true" /> Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
