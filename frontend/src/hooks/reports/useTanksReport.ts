import { useCallback } from 'react';
import type { Tank } from '../../types';

/**
 * Hook to generate printable tanks report
 */
export function useTanksReport(tanks: Tank[] = []) {
  const generateReport = useCallback(() => {
    const reportDate = new Date().toLocaleDateString();

    // Calculate tanks with low nitrogen
    const lowNitrogenTanks = tanks.filter(tank => {
      if (!tank.nitrogen_level || !tank.nitrogen_capacity || !tank.low_level_threshold) return false;
      const percentage = (tank.nitrogen_level / tank.nitrogen_capacity) * 100;
      return percentage <= tank.low_level_threshold;
    });

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tanks Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 1rem; }
            .header { margin-bottom: 0.75rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
            .header h1 { font-size: 1.125rem; margin-bottom: 0.125rem; }
            .header p { color: #666; font-size: 0.6875rem; }
            .summary { display: flex; gap: 1.25rem; margin-bottom: 0.75rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; }
            .summary-item { font-size: 0.75rem; }
            .summary-item strong { display: block; font-size: 1rem; }
            .summary-item.warning strong { color: #d97706; }
            table { width: 100%; border-collapse: collapse; margin-top: 0.375rem; }
            th, td { padding: 0.25rem 0.375rem; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: 600; font-size: 0.5625rem; text-transform: uppercase; }
            td { font-size: 0.6875rem; }
            .low-nitrogen { color: #d97706; font-weight: 600; }
            .footer { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #ddd; font-size: 0.5625rem; color: #666; }
            @media print {
              body { padding: 1rem; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tanks Report</h1>
            <p>Generated: ${reportDate}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <strong>${tanks.length}</strong>
              Total Tanks
            </div>
            <div class="summary-item ${lowNitrogenTanks.length > 0 ? 'warning' : ''}">
              <strong>${lowNitrogenTanks.length}</strong>
              Low Nitrogen
            </div>
          </div>

          ${tanks.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Tank Name</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>N2 Level</th>
                  <th>N2 Capacity</th>
                  <th>Threshold</th>
                  <th>Last Filled</th>
                </tr>
              </thead>
              <tbody>
                ${tanks.map(tank => {
                  const isLowNitrogen = tank.nitrogen_level && tank.nitrogen_capacity && tank.low_level_threshold &&
                    (tank.nitrogen_level / tank.nitrogen_capacity) * 100 <= tank.low_level_threshold;
                  const nitrogenDisplay = tank.nitrogen_level != null
                    ? `${tank.nitrogen_level} ${tank.nitrogen_unit || 'L'}`
                    : '—';
                  const capacityDisplay = tank.nitrogen_capacity != null
                    ? `${tank.nitrogen_capacity} ${tank.nitrogen_unit || 'L'}`
                    : '—';
                  const lastFilledDisplay = tank.last_filled_date
                    ? new Date(tank.last_filled_date).toLocaleDateString()
                    : '—';
                  return `
                    <tr>
                      <td><strong>${tank.tank_name || 'Unknown'}</strong></td>
                      <td>${tank.location || '—'}</td>
                      <td>${tank.capacity || '—'}</td>
                      <td class="${isLowNitrogen ? 'low-nitrogen' : ''}">${nitrogenDisplay}</td>
                      <td>${capacityDisplay}</td>
                      <td>${tank.low_level_threshold ? `${tank.low_level_threshold}%` : '—'}</td>
                      <td>${lastFilledDisplay}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : '<p style="margin-top: 1rem; color: #666;">No tanks on file.</p>'}

          <div class="footer">
            <p>RCK Genetics - Internal Use Only</p>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    iframe.srcdoc = reportHTML;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow!.focus();
          iframe.contentWindow!.print();
        } catch {
          const printWindow = window.open('');
          if (printWindow) {
            printWindow.document.documentElement.innerHTML = reportHTML;
            printWindow.focus();
            printWindow.print();
          }
        }
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    };
  }, [tanks]);

  return { generateReport };
}
