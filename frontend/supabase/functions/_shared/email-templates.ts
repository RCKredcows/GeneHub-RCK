// Email template for low nitrogen alerts
export function lowNitrogenTemplate(data: {
  userName: string;
  tanks: Array<{ name: string; level: number; percentage: number }>;
}): string {
  const tankRows = data.tanks.map(tank => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${tank.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: 600;">
        ${tank.percentage}%
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Low Nitrogen Alert</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Hi ${data.userName},
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        The following tank${data.tanks.length > 1 ? 's are' : ' is'} running low on nitrogen and may need to be refilled soon:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Tank Name</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Level</th>
          </tr>
        </thead>
        <tbody>
          ${tankRows}
        </tbody>
      </table>
      <a href="https://genehub.app/tanks" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        View Tanks
      </a>
    </div>
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        You received this email because you have notifications enabled in GeneHub.
      </p>
      <a href="https://genehub.app/settings" style="color: #3b82f6; font-size: 14px;">
        Manage notification preferences
      </a>
    </div>
  </div>
</body>
</html>
  `;
}

// Email template for low stock alerts
export function lowStockTemplate(data: {
  userName: string;
  items: Array<{ name: string; quantity: number; threshold: number; category: string }>;
}): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${item.category || 'Uncategorized'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: 600;">
        ${item.quantity}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Low Stock Alert</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Hi ${data.userName},
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        The following medical inventory item${data.items.length > 1 ? 's have' : ' has'} fallen below the reorder threshold:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Category</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <a href="https://genehub.app/medical-inventory" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        View Inventory
      </a>
    </div>
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        You received this email because you have notifications enabled in GeneHub.
      </p>
      <a href="https://genehub.app/settings" style="color: #3b82f6; font-size: 14px;">
        Manage notification preferences
      </a>
    </div>
  </div>
</body>
</html>
  `;
}

// Email template for periodic reminder
export function periodicReminderTemplate(data: {
  userName: string;
  tankCount: number;
  lowNitrogenCount: number;
  medicalItemCount: number;
  lowStockCount: number;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Monthly Check-In</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Hi ${data.userName},
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        This is your monthly reminder to check your nitrogen levels and inventory. Here's a quick summary:
      </p>
      <div style="display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 140px; background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #3b82f6;">${data.tankCount}</div>
          <div style="color: #6b7280; font-size: 14px;">Tanks</div>
          ${data.lowNitrogenCount > 0 ? `<div style="color: #dc2626; font-size: 12px; margin-top: 4px;">${data.lowNitrogenCount} low</div>` : ''}
        </div>
        <div style="flex: 1; min-width: 140px; background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #ef4444;">${data.medicalItemCount}</div>
          <div style="color: #6b7280; font-size: 14px;">Medical Items</div>
          ${data.lowStockCount > 0 ? `<div style="color: #dc2626; font-size: 12px; margin-top: 4px;">${data.lowStockCount} low stock</div>` : ''}
        </div>
      </div>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Take a moment to verify your tank nitrogen levels and restock any low inventory items.
      </p>
      <a href="https://genehub.app/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
        View Dashboard
      </a>
    </div>
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        You received this email because you have periodic reminders enabled in GeneHub.
      </p>
      <a href="https://genehub.app/settings" style="color: #3b82f6; font-size: 14px;">
        Manage notification preferences
      </a>
    </div>
  </div>
</body>
</html>
  `;
}
