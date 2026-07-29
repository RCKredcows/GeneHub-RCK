import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseAdmin, wasRecentlySent, logNotification } from '../_shared/notification-helpers.ts';
import { sendEmail } from '../_shared/resend.ts';
import { lowStockTemplate } from '../_shared/email-templates.ts';

serve(async (_req) => {
  try {
    const supabase = getSupabaseAdmin();

    // Get all low stock alerts (simplified view - no user filtering)
    const { data: alerts, error: alertsError } = await supabase
      .from('v_low_stock_alerts')
      .select('*');

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ message: 'No low stock alerts' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all users with low stock notifications enabled
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, notification_email')
      .eq('email_notifications_enabled', true)
      .eq('notify_low_medical_stock', true);

    if (settingsError) throw settingsError;
    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ message: 'No users with low stock notifications enabled' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    // Send notifications to each user with notifications enabled
    for (const userSetting of settings) {
      // Check cooldown for each item for this user
      const itemsToNotify = [];
      for (const alert of alerts) {
        const recentlySent = await wasRecentlySent({
          userId: userSetting.user_id,
          notificationType: 'low_medical_stock',
          referenceId: alert.item_id,
          cooldownHours: 120 // Don't re-notify about same item within 5 days
        });

        if (!recentlySent) {
          itemsToNotify.push({
            id: alert.item_id,
            name: alert.item_name,
            quantity: alert.quantity,
            threshold: alert.reorder_threshold,
            category: alert.category_name || 'Uncategorized'
          });
        }
      }

      if (itemsToNotify.length === 0) continue;

      // Get user info
      const { data: { user } } = await supabase.auth.admin.getUserById(userSetting.user_id);
      if (!user) continue;

      const userName = user.user_metadata?.first_name || 'there';
      const userEmail = userSetting.notification_email || user.email;

      // Send email
      const html = lowStockTemplate({
        userName,
        items: itemsToNotify
      });

      const emailResult = await sendEmail({
        to: userEmail,
        subject: `Low Stock Alert - ${itemsToNotify.length} item${itemsToNotify.length > 1 ? 's' : ''} need restocking`,
        html
      });

      // Log notifications
      for (const item of itemsToNotify) {
        await logNotification({
          userId: userSetting.user_id,
          notificationType: 'low_medical_stock',
          referenceId: item.id,
          referenceName: item.name,
          emailSentTo: userEmail,
          status: emailResult.success ? 'sent' : 'failed',
          errorMessage: emailResult.error?.message,
          metadata: { quantity: item.quantity, threshold: item.threshold }
        });
      }

      results.push({
        userId: userSetting.user_id,
        items: itemsToNotify.length,
        success: emailResult.success
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-low-stock:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
