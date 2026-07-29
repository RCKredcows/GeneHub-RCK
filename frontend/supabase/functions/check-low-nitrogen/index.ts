import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin, wasRecentlySent, logNotification } from '../_shared/notification-helpers.ts';
import { sendEmail } from '../_shared/resend.ts';
import { lowNitrogenTemplate } from '../_shared/email-templates.ts';

serve(async (_req) => {
  try {
    const supabase = getSupabaseAdmin();

    // Get all low nitrogen alerts (simplified view - no user filtering)
    const { data: alerts, error: alertsError } = await supabase
      .from('v_low_nitrogen_alerts')
      .select('*');

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ message: 'No low nitrogen alerts' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all users with low nitrogen notifications enabled
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, notification_email')
      .eq('email_notifications_enabled', true)
      .eq('notify_low_nitrogen', true);

    if (settingsError) throw settingsError;
    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ message: 'No users with low nitrogen notifications enabled' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    // Send notifications to each user with notifications enabled
    for (const userSetting of settings) {
      // Check cooldown for each tank for this user
      const tanksToNotify = [];
      for (const alert of alerts) {
        const recentlySent = await wasRecentlySent({
          userId: userSetting.user_id,
          notificationType: 'low_nitrogen',
          referenceId: alert.tank_id,
          cooldownHours: 120 // Don't re-notify about same tank within 5 days
        });

        if (!recentlySent) {
          tanksToNotify.push({
            id: alert.tank_id,
            name: alert.tank_name,
            level: alert.nitrogen_level,
            percentage: alert.nitrogen_percentage
          });
        }
      }

      if (tanksToNotify.length === 0) continue;

      // Get user info
      const { data: { user } } = await supabase.auth.admin.getUserById(userSetting.user_id);
      if (!user) continue;

      const userName = user.user_metadata?.first_name || 'there';
      const userEmail = userSetting.notification_email || user.email;

      // Send email
      const html = lowNitrogenTemplate({
        userName,
        tanks: tanksToNotify
      });

      const emailResult = await sendEmail({
        to: userEmail,
        subject: `Low Nitrogen Alert - ${tanksToNotify.length} tank${tanksToNotify.length > 1 ? 's' : ''} need attention`,
        html
      });

      // Log notifications
      for (const tank of tanksToNotify) {
        await logNotification({
          userId: userSetting.user_id,
          notificationType: 'low_nitrogen',
          referenceId: tank.id,
          referenceName: tank.name,
          emailSentTo: userEmail,
          status: emailResult.success ? 'sent' : 'failed',
          errorMessage: emailResult.error?.message,
          metadata: { percentage: tank.percentage }
        });
      }

      results.push({
        userId: userSetting.user_id,
        tanks: tanksToNotify.length,
        success: emailResult.success
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-low-nitrogen:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
