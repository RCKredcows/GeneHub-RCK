/**
 * Emails a workspace invitation.
 *
 * Permission is enforced by row level security rather than by a check in here:
 * the invitation is read with the *caller's* JWT, and only an owner or admin of
 * that workspace can see its invitations. A member, or someone from another
 * workspace, gets no row back and the function refuses.
 *
 * Deploy: supabase functions deploy send-invitation
 *         (JWT verification left on -- this is called by a signed-in user)
 * Secrets: RESEND_API_KEY, PUBLIC_SITE_URL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/resend.ts'
import { invitationTemplate } from '../_shared/email-templates.ts'

const SITE_URL = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://genehub.app'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'an owner',
  admin: 'an admin',
  member: 'a member',
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization) return json({ error: 'not_authenticated' }, 401)

  try {
    const { invitationId } = await request.json()
    if (!invitationId) return json({ error: 'missing_invitation' }, 400)

    // The caller's own token, so every read below is filtered by RLS.
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } }
    )

    const { data: invitation, error } = await db
      .from('invitations')
      .select('id, email, role, expires_at, accepted_at, revoked_at, tenants(name, slug)')
      .eq('id', invitationId)
      .maybeSingle()

    if (error) throw error

    // Either it does not exist or the caller may not see it. Same answer for
    // both, so this cannot be used to probe for invitations.
    if (!invitation) return json({ error: 'not_found' }, 404)

    if (invitation.accepted_at || invitation.revoked_at) {
      return json({ error: 'not_pending' }, 409)
    }

    const { data: sender } = await db.auth.getUser()
    const { data: senderRow } = await db
      .from('employees')
      .select('full_name')
      .eq('id', sender.user?.id ?? '')
      .maybeSingle()

    const workspace = invitation.tenants as unknown as { name: string; slug: string }
    const host = SITE_URL.replace(/^https?:\/\//, '')
    const signupUrl =
      `https://${workspace.slug}.${host}/signup?email=${encodeURIComponent(invitation.email)}`

    const result = await sendEmail({
      to: invitation.email,
      subject: `You have been invited to ${workspace.name} on GeneHub`,
      html: invitationTemplate({
        workspaceName: workspace.name,
        signupUrl,
        invitedByName: senderRow?.full_name || 'Someone',
        roleLabel: ROLE_LABELS[invitation.role] ?? 'a member',
        expiresOn: new Date(invitation.expires_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      }),
    })

    if (!result.success) return json({ error: 'send_failed' }, 502)

    return json({ sent: true })
  } catch (error) {
    console.error('invitation send failed:', error)
    return json({ error: 'send_failed' }, 500)
  }
})
