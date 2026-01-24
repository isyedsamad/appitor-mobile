const formatMonthLabel = (key: string) => {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

export function feeReceiptHTML(data: any) {
  const {
    schoolName,
    schoolAddress,
    studentName,
    className,
    session,
    receiptNo,
    date,
    paymentMode,
    months,
    heads,
    discount,
    paidAmount,
    collectedBy,
    remark,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial;
    padding: 32px;
    color: #111827;
    background: #ffffff;
  }

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .muted {
    color: #6b7280;
    font-size: 12px;
  }

  .header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .receipt-badge {
    background: #eef2ff;
    color: #4338ca;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.3px;
    margin-top: 6px;
    display: inline-block;
  }

  .divider {
    height: 1px;
    background: #e5e7eb;
    margin: 20px 0;
  }

  .section {
    margin-top: 18px;
    padding-left: 10px;
    padding-right: 10px
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 32px;
    font-size: 13px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
  }

  .info-row span {
    color: #6b7280;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 13px;
  }

  th {
    text-align: left;
    font-size: 12px;
    color: #6b7280;
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
  }

  td {
    padding: 12px 0;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
  }

  .amount {
    text-align: right;
    font-weight: 600;
  }

  .fee-sub {
    font-size: 11px;
    color: #6b7280;
    margin-top: 4px;
  }

  .summary-box {
    margin-top: 16px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 14px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
  }

  .summary-total {
    font-size: 17px;
    font-weight: 800;
    margin-top: 10px;
    border-top: 1px dashed #e5e7eb;
    padding-top: 10px;
  }

  .meta {
    margin-top: 12px;
    font-size: 12px;
    color: #374151;
  }

  .remark {
    background: #eef2ff;
    color: #1e3a8a;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 12px;
    margin-top: 10px;
  }

  .footer {
    margin-top: 30px;
    padding-top: 16px;
    border-top: 1px dashed #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .footer-left {
    font-size: 11px;
    color: #6b7280;
    max-width: 300px;
  }

  .footer-right {
    text-align: right;
    font-size: 11px;
    color: #9ca3af;
  }

  .appitor {
    margin-top: 6px;
    font-weight: 600;
    color: #4338ca;
  }
</style>
</head>

<body>

<div class="header">
    <h1>${schoolName}</h1>
    <div class="muted">${schoolAddress}</div>
    <div class="receipt-badge">SCHOOL FEE RECEIPT</div>
</div>

<div class="divider"></div>
<div class="section">
  <div class="section-title">Receipt Details</div>
  <div class="info-grid">
    <div class="info-row"><span>Student</span><b>${studentName}</b></div>
    <div class="info-row"><span>Date</span><b>${date}</b></div>
    <div class="info-row"><span>Class</span><b>${className}</b></div>
    <div class="info-row"><span>Payment Mode</span><b>${paymentMode}</b></div>
    <div class="info-row"><span>Academic Session</span><b>${session}</b></div>
    <div class="info-row"><span>Receipt No</span><b>${receiptNo}</b></div>
  </div>
</div>

<div class="divider"></div>

<div class="section">
  <div class="section-title">Fee Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Fee Component</th>
        <th class="amount">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${heads
        .map(
          (h: any) => `
        <tr>
          <td>
            <b>${h.name}</b>
            ${
              h.months && h.months.length
                ? `<div class="fee-sub">${h.months.map(formatMonthLabel).join(', ')}</div>`
                : ''
            }
          </td>
          <td class="amount">₹${h.amount}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
</div>

<div class="summary-box">
  ${
    discount
      ? `<div class="summary-row">
           <span>Discount</span>
           <span>- ₹${discount.amount}</span>
         </div>`
      : ''
  }

  <div class="summary-row summary-total">
    <span>Total Amount Paid</span>
    <span>₹${paidAmount}</span>
  </div>
</div>

<div class="meta">
  Collected by: <b>${collectedBy}</b>
</div>

${remark ? `<div class="remark">Remark: ${remark}</div>` : ''}

<div class="footer">
  <div class="footer-left">
    This is a system generated fee receipt.<br/>
    No signature is required.
  </div>
  <div class="footer-right">
    Generated via
    <div class="appitor">Appitor • School ERP</div>
  </div>
</div>

</body>
</html>
`;
}
