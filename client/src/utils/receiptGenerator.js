import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates and downloads a clean, pixel-perfect 80mm thermal POS receipt PDF.
 * Columns and summary totals are strictly aligned with tabular formatting.
 */
export function generateReceiptPDF(order, settings = {}) {
  if (!order) return;

  const currencySymbol = settings.currencySymbol || '৳';
  const currencyCode = settings.currency || 'BDT';

  // Format currency with thousands separators and 2 or 0 decimals
  const formatMoney = (val) => {
    const num = Number(val || 0);
    return `${currencyCode} ${num.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const rawMoney = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Dynamic receipt height based on items count
  const estimatedHeight = Math.max(170, 105 + (order.items?.length || 1) * 9);
  const doc = new jsPDF({
    format: [80, estimatedHeight],
    unit: 'mm',
    orientation: 'portrait',
  });

  const pageWidth = 80;
  const marginX = 4;
  const rightX = pageWidth - marginX; // 76mm
  const centerX = pageWidth / 2; // 40mm
  const contentWidth = rightX - marginX; // 72mm

  let y = 8;

  const drawDashedDivider = (yPos) => {
    doc.setDrawColor(160);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(marginX, yPos, rightX, yPos);
    doc.setLineDashPattern([], 0); // reset
  };

  const drawSolidDivider = (yPos, width = 0.4) => {
    doc.setDrawColor(100);
    doc.setLineWidth(width);
    doc.line(marginX, yPos, rightX, yPos);
  };

  // 1. Header (Store Branding)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  const storeName = (settings.storeName || 'SoleMate POS').toUpperCase();
  doc.text(storeName, centerX, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);

  const headerDetails = [
    settings.storeAddress,
    settings.storePhone ? `Phone: ${settings.storePhone}` : '',
    settings.storeEmail ? `Email: ${settings.storeEmail}` : '',
  ].filter(Boolean);

  headerDetails.forEach((lineText) => {
    const splitLines = doc.splitTextToSize(lineText, contentWidth - 4);
    doc.text(splitLines, centerX, y, { align: 'center' });
    y += 3.5 * splitLines.length;
  });

  y += 1;
  drawDashedDivider(y);
  y += 4;

  // 2. Receipt Meta (Invoice #, Date, Customer, Cashier)
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);

  // Row 1: Invoice # and Date
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE:', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${order.orderNumber || ''}`, marginX + 14, y);

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  doc.text(format(orderDate, 'dd/MM/yyyy hh:mm a'), rightX, y, { align: 'right' });
  y += 3.8;

  // Row 2: Customer Name
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER:', marginX, y);
  doc.setFont('helvetica', 'normal');
  const custName = order.customerName || 'Walk-in Customer';
  doc.text(custName.length > 28 ? custName.slice(0, 28) + '…' : custName, marginX + 18, y);
  y += 3.8;

  // Row 3: Cashier
  doc.setFont('helvetica', 'bold');
  doc.text('CASHIER:', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(order.cashierName || 'Admin / Staff', marginX + 15, y);

  // Payment Method Pill
  const payMethod = (order.paymentMethod || 'cash').toUpperCase().replace('_', ' ');
  doc.setFont('helvetica', 'bold');
  doc.text(`[${payMethod}]`, rightX, y, { align: 'right' });
  y += 4.5;

  // 3. Tabular Items List (Pixel-Perfect Alignment)
  // Total 72mm width: Item (34mm), Qty (8mm), Rate (15mm), Total (15mm)
  const tableBody = (order.items || []).map((item) => {
    const variantDesc = [item.brand, item.size ? `Sz ${item.size}` : '', item.color]
      .filter(Boolean)
      .join(' · ');
    const descText = variantDesc ? `${item.name}\n${variantDesc}` : item.name;
    const unitPrice = rawMoney(item.price);
    const lineTotal = rawMoney(item.total);
    return [descText, String(item.quantity), unitPrice, lineTotal];
  });

  autoTable(doc, {
    startY: y,
    head: [['ITEM / SPEC', 'QTY', 'RATE', 'TOTAL']],
    body: tableBody,
    theme: 'plain',
    styles: {
      fontSize: 7.2,
      cellPadding: { top: 1.2, bottom: 1.2, left: 0.5, right: 0.5 },
      overflow: 'linebreak',
      font: 'helvetica',
      textColor: [30, 30, 30],
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 7.5,
      textColor: [10, 10, 10],
      borderBottomWidth: 0.4,
      borderBottomColor: 80,
      cellPadding: { top: 1, bottom: 1.5, left: 0.5, right: 0.5 },
    },
    columnStyles: {
      0: { cellWidth: 34, halign: 'left' },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 15, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: marginX, right: marginX },
  });

  y = doc.lastAutoTable.finalY + 3;
  drawDashedDivider(y);
  y += 4;

  // 4. Financial Summary (Right-aligned, perfectly vertical figures)
  const summaryLabelX = 26; // label starts here
  const summaryValueX = rightX; // values flush against right border
  const rowHeight = 4.0;

  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);

  const summaryRows = [
    { label: 'Subtotal:', val: formatMoney(order.subtotal), bold: false },
    order.discountAmount > 0
      ? { label: 'Discount:', val: `-${formatMoney(order.discountAmount)}`, bold: false }
      : null,
    order.taxAmount > 0
      ? {
          label: `${order.taxName || settings.taxName || 'Tax'} (${order.taxRate || settings.taxRate || 0}%):`,
          val: `+${formatMoney(order.taxAmount)}`,
          bold: false,
        }
      : null,
  ].filter(Boolean);

  summaryRows.forEach((r) => {
    doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
    doc.text(r.label, summaryLabelX, y);
    doc.text(r.val, summaryValueX, y, { align: 'right' });
    y += rowHeight;
  });

  // Solid separator before Grand Total
  y += 0.5;
  drawSolidDivider(y, 0.5);
  y += 4.5;

  // GRAND TOTAL (Enlarged, Bold)
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', summaryLabelX, y);
  doc.text(formatMoney(order.total), summaryValueX, y, { align: 'right' });
  y += rowHeight + 1;

  // Paid, Change, and Due
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);

  // Paid
  doc.setFont('helvetica', 'normal');
  doc.text('Paid Amount:', summaryLabelX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMoney(order.paidAmount), summaryValueX, y, { align: 'right' });
  y += rowHeight;

  // Change given
  if (order.paymentDetails?.change > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text('Change Returned:', summaryLabelX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(order.paymentDetails.change), summaryValueX, y, { align: 'right' });
    y += rowHeight;
  }

  // Due Balance
  if (order.dueAmount > 0) {
    y += 0.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 30, 30); // Red highlight
    doc.text('DUE BALANCE:', summaryLabelX, y);
    doc.text(formatMoney(order.dueAmount), summaryValueX, y, { align: 'right' });
    doc.setTextColor(30, 30, 30);
    y += rowHeight;
  }

  y += 2;
  drawDashedDivider(y);
  y += 5;

  // 5. Footer and Thank You Note
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(70, 70, 70);
  const footerMessage = settings.receiptFooter || 'Thank you for shopping with us! Please come again.';
  const footerLines = doc.splitTextToSize(footerMessage, contentWidth);
  doc.text(footerLines, centerX, y, { align: 'center' });
  y += 3.5 * footerLines.length + 2;

  // Barcode / Order Code simulation
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text(`* ${order.orderNumber || ''} *`, centerX, y, { align: 'center' });
  y += 3;
  doc.text('SoleMate Point of Sale System', centerX, y, { align: 'center' });

  // Save PDF
  doc.save(`receipt-${order.orderNumber || 'order'}.pdf`);
}
