import { Resend } from 'npm:resend@2.0.0';

// EMAIL_DELIVERY=log prints each message instead of sending it. It is for a
// local stack, where the addresses are made up and sending them through Resend
// would bounce against genehub.app's reputation. Never set it on a hosted
// project. It is an explicit switch rather than "no API key" so that a deploy
// which forgot the key fails loudly instead of quietly logging.
const LOG_ONLY = Deno.env.get('EMAIL_DELIVERY') === 'log';

// Created on first send rather than at import: resend@2 throws on a missing
// key, which would take the whole function down even in log-only mode.
let resend: Resend | null = null;

function client(): Resend {
  if (!resend) {
    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) throw new Error('RESEND_API_KEY is not set');
    resend = new Resend(key);
  }
  return resend;
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(params: EmailParams) {
  const { to, subject, html, from = 'GeneHub <notifications@genehub.app>' } = params;

  if (LOG_ONLY) {
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    console.log(
      `[EMAIL_DELIVERY=log, not sent] to=${to} subject=${JSON.stringify(subject)}`,
      links.length > 0 ? { links } : '',
    );
    return { success: true, data: { id: 'logged' } };
  }

  try {
    const { data, error } = await client().emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email send error:', err);
    return { success: false, error: err };
  }
}
