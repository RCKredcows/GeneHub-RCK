import { tenant } from '../../config/tenant';
import { useCallback } from 'react';

interface ReportCustomer {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

interface ReportInventoryItem {
  inventory_type?: string | null;
  embryo_name?: string | null;
  sire_name?: string | null;
  sire?: { name?: string | null; breed?: string | null } | null;
  breed?: string | null;
  tank_name?: string | null;
  tank?: { tank_name?: string | null } | null;
  canister?: { canister_number?: string | null } | null;
  sex_type?: string | null;
  is_ivf?: boolean | null;
  quantity?: number | null;
  cane_number?: string | null;
}

/**
 * Hook to generate printable inventory reports for customers
 */
interface ReportOptions {
  includeEmbryos?: boolean;
  includeSemen?: boolean;
}

export function useCustomerInventoryReport(customer: ReportCustomer | null, inventory: ReportInventoryItem[] = []) {
  const generateReport = useCallback((options: ReportOptions = {}) => {
    if (!customer) return;

    const { includeEmbryos = true, includeSemen = true } = options;
    const filteredInventory = inventory.filter(item => {
      const isEmbryo = item.inventory_type === 'embryo';
      return isEmbryo ? includeEmbryos : includeSemen;
    });

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inventory Report - ${customer.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 1rem; }
            .header { margin-bottom: 0.75rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
            .header h1 { font-size: 1.125rem; margin-bottom: 0.125rem; }
            .header p { color: #666; font-size: 0.6875rem; }
            .customer-info { margin-bottom: 0.75rem; }
            .customer-info h2 { margin-bottom: 0.25rem; font-size: 1rem; }
            .customer-info p { margin-bottom: 0.0625rem; font-size: 0.75rem; line-height: 1.25; }
            h3 { margin-bottom: 0.25rem; font-size: 0.875rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 0.375rem; }
            th, td { padding: 0.25rem 0.375rem; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: 600; font-size: 0.5625rem; text-transform: uppercase; }
            td { font-size: 0.6875rem; }
            .total-row { font-weight: 600; background: #f9f9f9; }
            .footer { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #ddd; font-size: 0.5625rem; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inventory Report</h1>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="customer-info">
            <h2>${customer.name}</h2>
            ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
            ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
            ${customer.address ? `<p>${customer.address}</p>` : ''}
            ${customer.city || customer.state || customer.zip ?
              `<p>${customer.city || ''}${customer.city && customer.state ? ', ' : ''}${customer.state || ''} ${customer.zip || ''}</p>` : ''}
          </div>

          <h3>Stored Inventory</h3>
          ${filteredInventory.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Breed</th>
                  <th>Qty</th>
                  <th>Tank</th>
                  <th>Canister</th>
                  <th>Cane</th>
                </tr>
              </thead>
              <tbody>
                ${filteredInventory.map(item => {
                const isEmbryo = item.inventory_type === 'embryo';
                const itemName = isEmbryo
                  ? (item.embryo_name || 'Unknown Embryo')
                  : (item.sire_name || item.sire?.name || 'Unknown Sire');
                const breedDisplay = item.breed || item.sire?.breed || '—';
                const tankName = item.tank_name || item.tank?.tank_name || '—';

                // Build type display with sex type and IVF
                let typeDisplay = isEmbryo ? 'Embryo' : 'Semen';
                const extras: string[] = [];
                if (item.sex_type === 'sexed_female') extras.push('Sexed F');
                if (item.sex_type === 'sexed_male') extras.push('Sexed M');
                if (item.is_ivf) extras.push('IVF');
                if (extras.length > 0) typeDisplay += ' (' + extras.join(', ') + ')';

                return `
                  <tr>
                    <td>${itemName}</td>
                    <td>${typeDisplay}</td>
                    <td>${breedDisplay}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${tankName}</td>
                    <td>${item.canister?.canister_number || '—'}</td>
                    <td>${item.cane_number || '—'}</td>
                  </tr>
                `;
              }).join('')}
                <tr class="total-row">
                  <td colspan="3">Total Units</td>
                  <td colspan="4">${Number(filteredInventory.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(2))}</td>
                </tr>
              </tbody>
            </table>
          ` : '<p style="margin-top: 1rem; color: #666;">No inventory on file.</p>'}

          <div class="footer">
            <p>${tenant.legalName}</p>
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
  }, [customer, inventory]);

  return { generateReport };
}
