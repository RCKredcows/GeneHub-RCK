import { sendEmail } from './resend.ts'
import { invitationTemplate } from './email-templates.ts'

/**
 * Sends a workspace invitation.
 *
 * Shared because two very different callers need it: `send-invitation`, acting
 * for a signed-in admin, and `stripe-webhook`, acting for nobody at all after
 * a payment clears. Keeping the link construction and the wording in one place
 * means an owner's first email cannot drift from every later one.
 */

const ROLE_LABELS: Record<string, string> = {
  owner: 'an owner',
  admin: 'an admin',
  member: 'a member',
}

export interface InvitationEmail {
  email: string
  workspaceName: string
  workspaceSlug: string
  role: string
  expiresAt: string
  invitedByName: string
}

export async function sendInvitationEmail(invite: InvitationEmail) {
  const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://genehub.app'
  const host = siteUrl.replace(/^https?:\/\//, '')

  // Signup happens on the workspace's own subdomain: the session has to be
  // established on the origin the person will actually use.
  const signupUrl =
    `https://${invite.workspaceSlug}.${host}/signup?email=${encodeURIComponent(invite.email)}`

  return await sendEmail({
    to: invite.email,
    subject: `You have been invited to ${invite.workspaceName} on GeneHub`,
    html: invitationTemplate({
      workspaceName: invite.workspaceName,
      signupUrl,
      invitedByName: invite.invitedByName,
      roleLabel: ROLE_LABELS[invite.role] ?? 'a member',
      expiresOn: new Date(invite.expiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    }),
  })
}
