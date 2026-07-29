import { useState, useCallback } from 'react';
import { fetchCustomersPaginated } from '../../api/customers';

/**
 * Hook to generate printable customers report
 * Fetches ALL customers when generating report (not just current page)
 */
export function useCustomersReport() {
  const [loading, setLoading] = useState(false);

  const generateReport = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch ALL customers for the report
      const result = await fetchCustomersPaginated({ limit: 10000, offset: 0 });

      if (result.error) throw result.error;

      const customers = result.data || [];
      const reportDate = new Date().toLocaleDateString();

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Customers Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 1rem; }
            .header { margin-bottom: 0.75rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
            .header h1 { font-size: 1.125rem; margin-bottom: 0.125rem; }
            .header p { color: #666; font-size: 0.6875rem; }
            .summary { display: flex; gap: 1.25rem; margin-bottom: 0.75rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; }
            .summary-item { font-size: 0.75rem; }
            .summary-item strong { display: block; font-size: 1rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 0.375rem; }
            th, td { padding: 0.25rem 0.375rem; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: 600; font-size: 0.5625rem; text-transform: uppercase; }
            td { font-size: 0.6875rem; }
            .footer { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #ddd; font-size: 0.5625rem; color: #666; }
            @media print {
              body { padding: 1rem; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Customers Report</h1>
            <p>Generated: ${reportDate}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <strong>${customers.length}</strong>
              Total Customers
            </div>
          </div>

          ${customers.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(customer => {
                  return `
                    <tr>
                      <td><strong>${customer.name || 'Unknown'}</strong></td>
                      <td>${customer.phone || '—'}</td>
                      <td>${customer.email || '—'}</td>
                      <td>${customer.address || '—'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : '<p style="margin-top: 1rem; color: #666;">No customers on file.</p>'}

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
      console.error('Error generating customers report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateReport, loading };
}
