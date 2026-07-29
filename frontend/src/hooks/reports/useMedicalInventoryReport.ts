import { tenant } from '../../config/tenant';
import { useCallback } from 'react';

interface ReportInventoryItem {
  item_name?: string | null;
  quantity: number;
  unit?: string | null;
  reorder_threshold?: number | null;
  expiration_date?: string | null;
  supplier_name?: string | null;
  category?: { name?: string | null } | null;
}

interface ReportCategory {
  id: string;
  name: string;
}

/**
 * Hook to generate printable medical/supply inventory report
 */
export function useMedicalInventoryReport(items: ReportInventoryItem[] = [], categories: ReportCategory[] = []) {
  const generateReport = useCallback(() => {
    const reportDate = new Date().toLocaleDateString();

    // Group items by category
    const byCategory = items.reduce<Record<string, ReportInventoryItem[]>>((acc, item) => {
      const categoryName = item.category?.name || 'Uncategorized';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(item);
      return acc;
    }, {});

    // Calculate low stock items
    const lowStockItems = items.filter(item =>
      item.reorder_threshold && item.quantity <= item.reorder_threshold
    );

    // Calculate expired items
    const today = new Date();
    const expiredItems = items.filter(item =>
      item.expiration_date && new Date(item.expiration_date) < today
    );

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Medical Inventory Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 1rem; }
            .header { margin-bottom: 0.75rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
            .header h1 { font-size: 1.125rem; margin-bottom: 0.125rem; }
            .header p { color: #666; font-size: 0.6875rem; }
            .summary { display: flex; gap: 1.25rem; margin-bottom: 0.75rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; flex-wrap: wrap; }
            .summary-item { font-size: 0.75rem; }
            .summary-item strong { display: block; font-size: 1rem; }
            .summary-item.warning strong { color: #d97706; }
            .summary-item.danger strong { color: #dc2626; }
            .category-section { margin-bottom: 0.75rem; }
            .category-header { background: #333; color: #fff; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 0.25rem 0.375rem; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: 600; font-size: 0.5625rem; text-transform: uppercase; }
            td { font-size: 0.6875rem; }
            .low-stock { color: #d97706; font-weight: 600; }
            .expired { color: #dc2626; font-weight: 600; }
            .footer { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #ddd; font-size: 0.5625rem; color: #666; }
            @media print {
              .category-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medical Inventory Report</h1>
            <p>Generated: ${reportDate}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <strong>${items.length}</strong>
              Total Items
            </div>
            <div class="summary-item">
              <strong>${categories.length}</strong>
              Categories
            </div>
            <div class="summary-item ${lowStockItems.length > 0 ? 'warning' : ''}">
              <strong>${lowStockItems.length}</strong>
              Low Stock
            </div>
            <div class="summary-item ${expiredItems.length > 0 ? 'danger' : ''}">
              <strong>${expiredItems.length}</strong>
              Expired
            </div>
          </div>

          ${Object.entries(byCategory).map(([categoryName, categoryItems]) => `
            <div class="category-section">
              <div class="category-header">${categoryName} (${categoryItems.length} items)</div>
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Reorder At</th>
                    <th>Expires</th>
                    <th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoryItems.map(item => {
                    const isLowStock = item.reorder_threshold && item.quantity <= item.reorder_threshold;
                    const isExpired = item.expiration_date && new Date(item.expiration_date) < today;
                    const expirationDisplay = item.expiration_date
                      ? new Date(item.expiration_date).toLocaleDateString()
                      : '—';
                    return `
                      <tr>
                        <td>${item.item_name || 'Unknown'}</td>
                        <td class="${isLowStock ? 'low-stock' : ''}">${item.quantity || 0}</td>
                        <td>${item.unit || '—'}</td>
                        <td>${item.reorder_threshold || '—'}</td>
                        <td class="${isExpired ? 'expired' : ''}">${expirationDisplay}</td>
                        <td>${item.supplier_name || '—'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}

          <div class="footer">
            <p>${tenant.reportFooter}</p>
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
  }, [items, categories]);

  return { generateReport };
}
