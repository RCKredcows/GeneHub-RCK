import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin, wasRecentlySent, logNotification } from '../_shared/notification-helpers.ts';
import { sendEmail } from '../_shared/resend.ts';
import { periodicReminderTemplate } from '../_shared/email-templates.ts';

serve(async (_req) => {
  try {
    const supabase = getSupabaseAdmin();

    // Get all users with periodic reminders enabled
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, notification_email, tenant_id')
      .eq('email_notifications_enabled', true)
      .eq('notify_periodic_reminder', true);

    if (settingsError) throw settingsError;
    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ message: 'No users with periodic reminders enabled' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Each user's summary covers their own workspace only. The service role
    // bypasses RLS, so every count is filtered by tenant_id explicitly, once per
    // workspace that has someone to email.
    const statsByTenant = new Map();
    for (const tenantId of new Set(settings.map((s) => s.tenant_id))) {
      const [tanksRes, lowNitrogenRes, medicalRes, lowStockRes] = await Promise.all([
        supabase.from('tanks').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('v_low_nitrogen_alerts').select('tank_id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('supply_inventory').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('v_low_stock_alerts').select('item_id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
      ]);
      statsByTenant.set(tenantId, {
        tankCount: tanksRes.count || 0,
        lowNitrogenCount: lowNitrogenRes.count || 0,
        medicalItemCount: medicalRes.count || 0,
        lowStockCount: lowStockRes.count || 0
      });
    }

    const results = [];

    for (const userSetting of settings) {
      // Check 30-day cooldown
      const recentlySent = await wasRecentlySent({
        userId: userSetting.user_id,
        notificationType: 'periodic_reminder',
        cooldownHours: 30 * 24 // 30 days
      });

      if (recentlySent) continue;

      // Get user info
      const { data: { user } } = await supabase.auth.admin.getUserById(userSetting.user_id);
      if (!user) continue;

      const userName = user.user_metadata?.first_name || 'there';
      const userEmail = userSetting.notification_email || user.email;

      // Send email
      const html = periodicReminderTemplate({
        userName,
        ...statsByTenant.get(userSetting.tenant_id)
      });

      const emailResult = await sendEmail({
        to: userEmail,
        subject: 'GeneHub Monthly Check-In - Review Your Inventory',
        html
      });

      await logNotification({
        tenantId: userSetting.tenant_id,
        userId: userSetting.user_id,
        notificationType: 'periodic_reminder',
        emailSentTo: userEmail,
        status: emailResult.success ? 'sent' : 'failed',
        errorMessage: emailResult.error?.message
      });

      results.push({
        userId: userSetting.user_id,
        success: emailResult.success
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in periodic-reminder:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
