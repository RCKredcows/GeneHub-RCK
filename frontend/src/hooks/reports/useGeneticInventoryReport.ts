import { useState, useCallback } from 'react';
import { fetchGeneticInventoryPaginated } from '../../api/geneticInventory';

interface InventoryReportItem {
  inventory_type?: string | null;
  embryo_name?: string | null;
  sire_name?: string | null;
  sire?: { name?: string | null } | null;
  customer_name?: string | null;
  customer?: { name?: string | null } | null;
  owner_type?: string | null;
  tank?: { tank_name?: string | null } | null;
  canister?: { canister_number?: string | null } | null;
  breed?: string | null;
  cane_number?: string | null;
  quantity?: number | null;
  status?: string | null;
}

/**
 * Hook to generate printable genetic inventory report
 * Fetches ALL inventory when generating report (not just current page)
 */
export function useGeneticInventoryReport() {
  const [loading, setLoading] = useState(false);

  const generateReport = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch ALL inventory for the report
      const result = await fetchGeneticInventoryPaginated({ limit: 10000, offset: 0 });

      if (result.error) throw result.error;

      const inventory = (result.data || []) as InventoryReportItem[];
      const reportDate = new Date().toLocaleDateString();

      // Group inventory by tank for better organization
      const byTank = inventory.reduce<Record<string, InventoryReportItem[]>>((acc, item) => {
        const tankName = item.tank?.tank_name || 'Unassigned';
        if (!acc[tankName]) acc[tankName] = [];
        acc[tankName].push(item);
        return acc;
      }, {});

      const semenCount = inventory.filter(i => i.inventory_type === 'semen').length;
      const embryoCount = inventory.filter(i => i.inventory_type === 'embryo').length;

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Genetic Inventory Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 1rem; }
            .header { margin-bottom: 0.75rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
            .header h1 { font-size: 1.125rem; margin-bottom: 0.125rem; }
            .header p { color: #666; font-size: 0.6875rem; }
            .summary { display: flex; gap: 1.25rem; margin-bottom: 0.75rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; }
            .summary-item { font-size: 0.75rem; }
            .summary-item strong { display: block; font-size: 1rem; }
            .tank-section { margin-bottom: 0.75rem; }
            .tank-header { background: #333; color: #fff; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; margin-bottom: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 0.25rem 0.375rem; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: 600; font-size: 0.5625rem; text-transform: uppercase; }
            td { font-size: 0.6875rem; }
            .type-semen { color: #2563eb; }
            .type-embryo { color: #7c3aed; }
            .footer { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #ddd; font-size: 0.5625rem; color: #666; }
            @media print {
              .tank-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Genetic Inventory Report</h1>
            <p>Generated: ${reportDate}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <strong>${inventory.length}</strong>
              Records
            </div>
            <div class="summary-item">
              <strong>${semenCount}</strong>
              Semen
            </div>
            <div class="summary-item">
              <strong>${embryoCount}</strong>
              Embryo
            </div>
          </div>

          ${Object.entries(byTank).map(([tankName, items]) => `
            <div class="tank-section">
              <div class="tank-header">${tankName} (${items.length} records)</div>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Breed</th>
                    <th>Owner</th>
                    <th>Canister</th>
                    <th>Cane</th>
                    <th>Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => {
                    const isEmbryo = item.inventory_type === 'embryo';
                    const itemName = isEmbryo
                      ? (item.embryo_name || 'Unknown Embryo')
                      : (item.sire_name || item.sire?.name || 'Unknown Sire');
                    const ownerName = item.owner_type === 'rck'
                      ? 'RCK'
                      : (item.customer_name || item.customer?.name || 'Unknown');
                    return `
                      <tr>
                        <td class="${isEmbryo ? 'type-embryo' : 'type-semen'}">${isEmbryo ? 'Embryo' : 'Semen'}</td>
                        <td>${itemName}</td>
                        <td>${item.breed || '—'}</td>
                        <td>${ownerName}</td>
                        <td>${item.canister?.canister_number || '—'}</td>
                        <td>${item.cane_number || '—'}</td>
                        <td>${item.quantity || 0}</td>
                        <td>${item.status || 'stored'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}

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
    } catch (error) {
      console.error('Error generating genetic inventory report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateReport, loading };
}
