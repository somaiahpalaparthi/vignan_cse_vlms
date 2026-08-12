// Helper utility to generate printable documents and export PDFs for Stock, Issues, and Reports

const openPrintWindow = (htmlContent, documentTitle = 'LabFlow_Report') => {
  const printWindow = window.open('', '_blank', 'width=950,height=800');
  if (!printWindow) {
    alert('Please allow popups for this page to print or generate PDF documents.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${documentTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 13px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .header-title h1 {
            margin: 0;
            font-size: 20px;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-title p {
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #64748b;
          }
          .header-meta {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .meta-badge {
            background: #e0f2fe;
            color: #0369a1;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 4px;
          }
          .kpi-row {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }
          .kpi-box {
            flex: 1;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            padding: 10px 14px;
            border-radius: 6px;
          }
          .kpi-box span {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            display: block;
          }
          .kpi-box strong {
            font-size: 16px;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 700;
            border-bottom: 2px solid #cbd5e1;
            text-transform: uppercase;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
          }
          .badge-completed { background: #dcfce7; color: #15803d; }
          .badge-pending { background: #ffedd5; color: #c2410c; }
          .badge-critical { background: #fee2e2; color: #b91c1c; }
          .badge-high { background: #fef3c7; color: #b45309; }
          .badge-medium { background: #e0f2fe; color: #0369a1; }
          
          /* Single Ticket Card Layout */
          .ticket-card {
            border: 2px solid #0284c7;
            border-radius: 8px;
            padding: 20px;
            background: #fafafa;
            margin-top: 10px;
          }
          .ticket-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 16px;
          }
          .ticket-field {
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 6px;
          }
          .ticket-field label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            display: block;
            margin-bottom: 2px;
          }
          .ticket-field value {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
          }

          .footer-sig {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .sig-box {
            text-align: center;
            width: 200px;
          }
          .sig-line {
            border-top: 1px solid #64748b;
            margin-top: 40px;
            padding-top: 4px;
            font-size: 11px;
            color: #475569;
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// 1. Print All Stock Entries
export const printStockEntries = (stockList = [], labScope = 'All Labs') => {
  const today = new Date().toLocaleDateString();
  const totalItems = stockList.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalValue = stockList.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitCost || 0)), 0);

  const rowsHtml = stockList.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${item.id || item._id || 'N/A'}</strong></td>
      <td>
        <div><strong>${item.name || item.deviceName || 'N/A'}</strong></div>
        ${(item.serialNo || item.serialNumber || item.deviceSerialNo || item.itemSerialNo || item.serial) ? `<div style="font-size: 10px; color: #0284c7; font-weight: bold; font-family: monospace; margin-top:2px;">🏷️ S/N: ${item.serialNo || item.serialNumber || item.deviceSerialNo || item.itemSerialNo || item.serial}</div>` : ''}
      </td>
      <td>${item.category || 'Hardware'}</td>
      <td>${item.subCategory || '-'}</td>
      <td style="text-align:center;"><strong>${item.quantity || 0}</strong></td>
      <td style="text-align:right;">$${Number(item.unitCost || 0).toLocaleString()}</td>
      <td style="text-align:right;"><strong>$${(Number(item.quantity || 0) * Number(item.unitCost || 0)).toLocaleString()}</strong></td>
      <td>${item.supplier || 'Authorized Supplier'}</td>
      <td>${item.labLocation || 'Lab 12'}</td>
    </tr>
  `).join('');

  const html = `
    <div class="header">
      <div class="header-title">
        <h1>VLMS - Stock Entry & Master Inventory Report</h1>
        <p>Virtual Laboratory Management System - Official Asset Audit Log</p>
      </div>
      <div class="header-meta">
        <span class="meta-badge">Scope: ${labScope}</span>
        <div>Generated Date: ${today}</div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-box">
        <span>Total Registered Entries</span>
        <strong>${stockList.length} Stock Records</strong>
      </div>
      <div class="kpi-box">
        <span>Total Units in Stock</span>
        <strong>${totalItems} Units</strong>
      </div>
      <div class="kpi-box">
        <span>Total Inventory Valuation</span>
        <strong style="color:#0284c7;">$${totalValue.toLocaleString()}</strong>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Stock ID</th>
          <th>Item / Equipment Name</th>
          <th>Category</th>
          <th>Subcategory</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Cost</th>
          <th style="text-align:right;">Total Cost</th>
          <th>Supplier</th>
          <th>Lab Location</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="10" style="text-align:center;">No stock entries recorded.</td></tr>'}
      </tbody>
    </table>

    <div class="footer-sig">
      <div class="sig-box">
        <div class="sig-line">Prepared By (Lab Staff)</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">Verified By (Administrator)</div>
      </div>
    </div>
  `;

  openPrintWindow(html, `Stock_Entry_Report_${today.replace(/\//g, '-')}`);
};

// 2. Print All Issue Tickets
export const printAllIssues = (issuesList = [], labScope = 'All Labs', titleText = 'VLMS - Hardware Maintenance & Issue Ticket Audit') => {
  const today = new Date().toLocaleDateString();
  const pendingCount = issuesList.filter(i => i.status === 'Pending Repair' || i.status === 'Offline').length;
  const completedCount = issuesList.filter(i => i.status === 'Completed').length;

  const getTechName = (iss) => {
    if (!iss) return 'Unassigned';
    const tech = iss.assignedTech || iss.assignedTechnician || iss.technician || iss.assignedStaff;
    if (!tech) return 'Unassigned';
    if (typeof tech === 'object') return tech.name || tech.technicianName || 'Technician Assigned';
    return String(tech);
  };

  const getDaysDisplay = (iss) => {
    if (iss.status !== 'Completed') return 'In Progress';
    const raw = iss.daysTaken ? String(iss.daysTaken).trim() : '';
    if (raw && raw !== '0 Days' && raw !== '0' && raw !== '0 Days (Same Day)') return raw;
    const startStr = iss.postedDate || iss.date || (iss.createdAt ? new Date(iss.createdAt).toISOString().split('T')[0] : null);
    const endStr = iss.resolvedDate || (iss.updatedAt ? new Date(iss.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    if (!startStr) return '1 Day';
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffMs = Math.abs(end - start);
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return `${days} ${days === 1 ? 'Day' : 'Days'}`;
    } catch (e) {
      return '1 Day';
    }
  };

  const rowsHtml = issuesList.map((iss, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${iss.id || iss._id || 'ISSUE'}</strong></td>
      <td>
        <div><strong>${iss.equipmentName || iss.deviceId || 'N/A'}</strong></div>
        ${(iss.serialNo || iss.serialNumber || iss.deviceSerialNo || iss.itemSerialNo || iss.serial) ? `<div style="font-size: 10px; color: #0284c7; font-weight: bold; font-family: monospace; margin-top:2px;">🏷️ S/N: ${iss.serialNo || iss.serialNumber || iss.deviceSerialNo || iss.itemSerialNo || iss.serial}</div>` : ''}
      </td>
      <td>${iss.category || 'Hardware'} (${iss.subCategory || 'cpu'})</td>
      <td>${iss.title || 'Maintenance Issue'}</td>
      <td>
        <span class="badge ${iss.severity === 'Critical' ? 'badge-critical' : iss.severity === 'High' ? 'badge-high' : 'badge-medium'}">
          ${iss.severity || 'Medium'}
        </span>
      </td>
      <td>
        <span class="badge ${iss.status === 'Completed' ? 'badge-completed' : 'badge-pending'}">
          ${iss.status || 'Pending Repair'}
        </span>
      </td>
      <td>${iss.labLocation || 'Lab 12'}</td>
      <td>${iss.reportedBy || 'Staff'}</td>
      <td>${iss.postedDate || iss.date || 'Today'}</td>
      <td><strong>${getTechName(iss)}</strong></td>
      <td>${getDaysDisplay(iss)}</td>
    </tr>
  `).join('');

  const html = `
    <div class="header">
      <div class="header-title">
        <h1>${titleText}</h1>
        <p>Virtual Laboratory Management System - Maintenance Log Report</p>
      </div>
      <div class="header-meta">
        <span class="meta-badge">Scope: ${labScope}</span>
        <div>Generated Date: ${today}</div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-box">
        <span>Total Tickets Logged</span>
        <strong>${issuesList.length} Tickets</strong>
      </div>
      <div class="kpi-box">
        <span>Pending Repairs</span>
        <strong style="color:#c2410c;">${pendingCount} Pending</strong>
      </div>
      <div class="kpi-box">
        <span>Resolved Maintenance</span>
        <strong style="color:#15803d;">${completedCount} Completed</strong>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Ticket ID</th>
          <th>Equipment Name</th>
          <th>Category</th>
          <th>Issue Description</th>
          <th>Severity</th>
          <th>Status</th>
          <th>Lab Location</th>
          <th>Reported By</th>
          <th>Posted Date</th>
          <th>Assigned Tech</th>
          <th>Days to Resolve</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="12" style="text-align:center;">No issue tickets logged.</td></tr>'}
      </tbody>
    </table>

    <div class="footer-sig">
      <div class="sig-box">
        <div class="sig-line">Reported By (Lab Technician)</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">Approved By (Administrator)</div>
      </div>
    </div>
  `;

  openPrintWindow(html, `Issues_Master_Report_${today.replace(/\//g, '-')}`);
};

export const printPendingIssues = (issuesList = [], labScope = 'All Labs') => {
  const pendingOnly = issuesList.filter((i) => i.status !== 'Completed' && i.status !== 'Resolved');
  printAllIssues(pendingOnly, labScope, 'VLMS - Pending Repairs & Maintenance Queue Report');
};

export const printCompletedIssues = (issuesList = [], labScope = 'All Labs') => {
  const completedOnly = issuesList.filter((i) => i.status === 'Completed' || i.status === 'Resolved');
  printAllIssues(completedOnly, labScope, 'VLMS - Maintenance Done & Resolved Audit Report');
};

// 3. Print Individual Issue Ticket Slip / Work Order
export const printIndividualIssue = (iss) => {
  if (!iss) return;
  const today = new Date().toLocaleDateString();

  const getTechDetails = (item) => {
    if (!item) return { name: 'Unassigned', phone: 'N/A' };
    const tech = item.assignedTech || item.assignedTechnician || item.technician || item.assignedStaff;
    if (!tech) return { name: 'Unassigned', phone: 'N/A' };
    if (typeof tech === 'object') return { name: tech.name || 'Assigned', phone: tech.phone || 'N/A' };
    return { name: String(tech), phone: 'N/A' };
  };

  const tech = getTechDetails(iss);

  const html = `
    <div class="header">
      <div class="header-title">
        <h1>VLMS - Hardware Repair Work Order Slip</h1>
        <p>Virtual Laboratory Management System - Individual Ticket Record</p>
      </div>
      <div class="header-meta">
        <span class="meta-badge">Ticket #: ${iss.id || iss._id}</span>
        <div>Printed Date: ${today}</div>
      </div>
    </div>

    <div class="ticket-card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px;">
        <div>
          <h2 style="margin:0; font-size:18px; color:#0f172a;">${iss.equipmentName || iss.deviceId}</h2>
          <span style="font-size:11px; color:#64748b;">Device ID: ${iss.deviceId || 'N/A'}</span>
          ${(iss.serialNo || iss.serialNumber || iss.deviceSerialNo || iss.itemSerialNo || iss.serial) ? `<span style="font-size:11px; color:#0284c7; font-weight:bold; margin-left: 12px; font-family: monospace;">🏷️ S/N: ${iss.serialNo || iss.serialNumber || iss.deviceSerialNo || iss.itemSerialNo || iss.serial}</span>` : ''}
        </div>
        <span class="badge ${iss.status === 'Completed' ? 'badge-completed' : 'badge-pending'}" style="font-size:12px; padding:6px 12px;">
          STATUS: ${iss.status || 'Pending Repair'}
        </span>
      </div>

      <div class="ticket-grid">
        <div class="ticket-field">
          <label>Category / Subcategory</label>
          <div class="value">${iss.category || 'Hardware'} (${iss.subCategory || 'cpu'})</div>
        </div>

        <div class="ticket-field">
          <label>Item Serial No (S/N)</label>
          <div class="value" style="color:#0284c7; font-family:monospace; font-weight:bold;">
            🏷️ ${iss.serialNo || iss.serialNumber || iss.deviceSerialNo || iss.itemSerialNo || iss.serial || 'N/A'}
          </div>
        </div>

        <div class="ticket-field">
          <label>Systems Affected (Quantity)</label>
          <div class="value">${iss.quantity || 1} Systems</div>
        </div>

        <div class="ticket-field">
          <label>Severity Level</label>
          <div class="value">
            <span class="badge ${iss.severity === 'Critical' ? 'badge-critical' : iss.severity === 'High' ? 'badge-high' : 'badge-medium'}">
              ${iss.severity || 'Medium'}
            </span>
          </div>
        </div>

        <div class="ticket-field">
          <label>Lab Location / Room</label>
          <div class="value" style="color:#0284c7;">📍 ${iss.labLocation || 'Lab 12'}</div>
        </div>

        <div class="ticket-field">
          <label>Reported By</label>
          <div class="value">👤 ${iss.reportedBy || 'Staff'}</div>
        </div>

        <div class="ticket-field">
          <label>Posted Date</label>
          <div class="value">📅 ${iss.postedDate || iss.date || 'Today'}</div>
        </div>

        <div class="ticket-field" style="grid-column: span 2;">
          <label>Issue Description & Fault Symptoms</label>
          <div class="value" style="font-weight:normal; background:#ffffff; padding:10px; border:1px solid #e2e8f0; border-radius:4px; margin-top:4px;">
            ${iss.title || 'Maintenance required on hardware component.'}
          </div>
        </div>

        <div class="ticket-field">
          <label>Assigned Repair Technician</label>
          <div class="value" style="color:#c2410c;">🔧 ${tech.name} ${tech.phone !== 'N/A' ? `(📱 ${tech.phone})` : ''}</div>
        </div>

        <div class="ticket-field">
          <label>Resolution Status & Days Taken</label>
          <div class="value">
            ${iss.status === 'Completed' ? `✅ Resolved in ${iss.daysTaken || '0 Days'}` : '⏱️ Work In Progress'}
          </div>
        </div>
      </div>
    </div>

    <div class="footer-sig">
      <div class="sig-box">
        <div class="sig-line">Technician Signature</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">Lab In-Charge Verification</div>
      </div>
    </div>
  `;

  openPrintWindow(html, `Ticket_${iss.id || iss._id}`);
};

// 4. Print Full Reports
export const printReport = (reportType = 'combined_master', reportData = {}, labScope = 'All Labs') => {
  const today = new Date().toLocaleDateString();

  let title = 'Master Comprehensive Laboratory Audit Report';
  if (reportType === 'stock_valuation') title = 'Stock & Asset Financial Valuation Report';
  if (reportType === 'maintenance_queue') title = 'Pending Maintenance Queue Audit Report';
  if (reportType === 'category_breakdown') title = 'Category & Subcategory Hardware Breakdown';

  const html = `
    <div class="header">
      <div class="header-title">
        <h1>VLMS - ${title}</h1>
        <p>Virtual Laboratory Management System - Official Analytics & Compliance Audit</p>
      </div>
      <div class="header-meta">
        <span class="meta-badge">Scope: ${labScope}</span>
        <div>Generated Date: ${today}</div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-box">
        <span>Active Lab Location</span>
        <strong>${labScope}</strong>
      </div>
      <div class="kpi-box">
        <span>Report Category</span>
        <strong style="color:#0284c7;">${title}</strong>
      </div>
    </div>

    <div style="padding:20px; border:1px solid #cbd5e1; border-radius:6px; background:#fafafa;">
      <h3 style="margin-top:0; color:#0f172a;">Executive Audit Summary</h3>
      <p style="font-size:12px; color:#475569;">
        This document serves as an official audit record generated from the VLMS database.
        All hardware inventories, stock entries, and maintenance tickets matching <strong>${labScope}</strong> have been verified for system compliance.
      </p>
    </div>

    <div class="footer-sig">
      <div class="sig-box">
        <div class="sig-line">Audit Supervisor</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">System Administrator Signature</div>
      </div>
    </div>
  `;

  openPrintWindow(html, `VLMS_Report_${reportType}_${today.replace(/\//g, '-')}`);
};
