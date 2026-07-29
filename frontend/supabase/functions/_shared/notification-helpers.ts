import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

export interface NotificationCheckParams {
  userId: string;
  notificationType: 'low_nitrogen' | 'low_medical_stock' | 'periodic_reminder';
  referenceId?: string;
  cooldownHours?: number;
}

// Check if a notification was recently sent (prevent duplicates)
export async function wasRecentlySent(params: NotificationCheckParams): Promise<boolean> {
  const { userId, notificationType, referenceId, cooldownHours = 24 } = params;
  const supabase = getSupabaseAdmin();

  const cooldownTime = new Date();
  cooldownTime.setHours(cooldownTime.getHours() - cooldownHours);

  let query = supabase
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .gte('sent_at', cooldownTime.toISOString())
    .eq('status', 'sent');

  if (referenceId) {
    query = query.eq('reference_id', referenceId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error('Error checking notification log:', error);
    return false; // On error, allow sending
  }

  return data && data.length > 0;
}

export interface LogNotificationParams {
  userId: string;
  notificationType: 'low_nitrogen' | 'low_medical_stock' | 'periodic_reminder';
  referenceId?: string;
  referenceName?: string;
  emailSentTo: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export async function logNotification(params: LogNotificationParams): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('notification_log')
    .insert({
      user_id: params.userId,
      notification_type: params.notificationType,
      reference_id: params.referenceId || null,
      reference_name: params.referenceName || null,
      email_sent_to: params.emailSentTo,
      status: params.status,
      error_message: params.errorMessage || null,
      metadata: params.metadata || {}
    });

  if (error) {
    console.error('Error logging notification:', error);
  }
}
