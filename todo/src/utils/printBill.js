import axios from "axios";

const API = import.meta.env.VITE_API_URL;

// ---- Print option visibility toggles ----
const SHOW_WEB_PRINT = false; // set to true to bring back the "Web Print" button

const fetchCompanyDetails = async () => {
  try {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) {
      console.warn("No company ID found");
      return null;
    }
    const response = await axios.get(`${API}/companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching company details:", error);
    return null;
  }
};

// Fetch complete bill details from the backend
const fetchBillDetails = async (billId) => {
  try {
    if (!billId) {
      console.warn("No bill ID provided");
      return null;
    }

    const companyId = localStorage.getItem("companyId");
    if (!companyId) {
      console.warn("No company ID found");
      return null;
    }

    const apiUrl = API.endsWith('/') ? API : `${API}/`;
    const url = `${apiUrl}bills/${billId}`;

    console.log("Fetching bill from URL:", url);
    console.log("With params:", { companyId });

    const response = await axios.get(url, {
      params: { companyId },
      timeout: 10000
    });

    console.log("Bill fetch response:", response.data);

    const billData = response.data.data || response.data;
    return billData;
  } catch (error) {
    console.error("Error fetching bill details:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
      console.error("Request URL:", error.config?.url);
    }
    return null;
  }
};

// Fetch product details including Tamil name - single product
const fetchProductDetails = async (productId, companyId) => {
  try {
    if (!productId) return null;
    const response = await axios.get(`${API}/products/${productId}`, {
      params: { companyId }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching product details for ID:", productId, error);
    return null;
  }
};

// Enrich bill items with product details including Tamil name
const enrichBillItemsWithProductDetails = async (items, companyId) => {
  if (!items || items.length === 0) return items;

  const enrichedItems = [];

  for (const currentItem of items) {
    if (currentItem.productId) {
      try {
        const product = await fetchProductDetails(currentItem.productId, companyId);
        if (product) {
          enrichedItems.push({
            ...currentItem,
            name: product.name || currentItem.name,
            tamilName: product.tamilName || "",
            productCode: product.productCode,
            mrp: product.mrp,
            retailRate: product.retailRate,
            wholesaleRate: product.wholesaleRate,
            price: currentItem.price,
            quantity: currentItem.quantity
          });
          console.log(`Fetched fresh Tamil name for ${product.name}: ${product.tamilName || 'Not available'}`);
        } else {
          console.warn(`Product not found for ID: ${currentItem.productId}`);
          enrichedItems.push(currentItem);
        }
      } catch (error) {
        console.error("Error fetching product for item:", currentItem, error);
        enrichedItems.push(currentItem);
      }
    } else {
      enrichedItems.push(currentItem);
    }
  }

  return enrichedItems;
};

const uint8ToBinaryStr = (arr) => {
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return s;
};

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// Helper function to extract customer name from various possible structures
const getCustomerName = (billData) => {
  const customer = billData;

  if (!customer) return "Walk-in Customer";

  if (typeof customer === 'string') {
    const trimmed = customer.trim();
    return trimmed ? trimmed : "Walk-in Customer";
  }

  if (typeof customer === 'object') {
    const name = customer.name ||
                 customer.customerName ||
                 customer.fullName ||
                 customer.displayName;

    if (name && typeof name === 'string' && name.trim()) {
      return name.trim();
    }
  }

  if (billData.customerName && typeof billData.customerName === 'string') {
    const trimmed = billData.customerName.trim();
    if (trimmed) return trimmed;
  }

  return "Walk-in Customer";
};

// Helper function to extract customer phone
const getCustomerPhone = (billData) => {
  const customer = billData.customer;

  if (!customer || typeof customer !== 'object') {
    return billData.customerPhone || billData.phone || null;
  }

  return customer.phone ||
         customer.mobile ||
         customer.phoneNumber ||
         billData.customerPhone ||
         null;
};

// Safe string padding utility functions
const safePad = (str, length, padChar = ' ') => {
  const strLen = String(str).length;
  const padding = Math.max(0, length - strLen);
  return String(str) + padChar.repeat(padding);
};

const safePadStart = (str, length, padChar = ' ') => {
  const strLen = String(str).length;
  const padding = Math.max(0, length - strLen);
  return padChar.repeat(padding) + String(str);
};

// New function to download bill as TXT file using bill number as filename
const downloadBillAsTxt = async (enrichedBill, company, customerName, customerPhone, formattedDate, formattedTime, fmt, subtotal, discountAmount, total, paid, due) => {
  // Build the plain text receipt string (similar to buildReceiptString but without ESC/POS commands)
  const LINE_WIDTH = 48;
  const SEPARATOR = "-".repeat(LINE_WIDTH);

  const formatLine = (left, right) => {
    const l = String(left);
    const r = String(right);
    const totalWidth = LINE_WIDTH;
    const leftSpace = Math.max(0, totalWidth - l.length - r.length);
    const spaces = " ".repeat(leftSpace);
    return l + spaces + r;
  };

  const centerText = (text) => {
    const s = String(text);
    const pad = Math.max(0, Math.floor((LINE_WIDTH - s.length) / 2));
    return " ".repeat(pad) + s;
  };

  // Define column widths
  const COL_ITEM = 25;
  const COL_QTY = 5;
  const COL_PRICE = 8;
  const COL_TOTAL = 10;

  const buildHeaderRow = () => {
    const itemHeader = safePad("Item", COL_ITEM);
    const qtyHeader = safePadStart("Qty", COL_QTY);
    const priceHeader = safePadStart("Price", COL_PRICE);
    const totalHeader = safePadStart("Total", COL_TOTAL);
    return itemHeader + qtyHeader + priceHeader + totalHeader;
  };

  const buildItemRow = (name, qty, price, total) => {
    let nameStr = String(name || "");
    let qtyStr = String(qty);
    let priceStr = fmt(price);
    let totalStr = fmt(total);

    if (nameStr.length > COL_ITEM) {
      nameStr = nameStr.substring(0, COL_ITEM - 3) + "...";
    }

    nameStr = safePad(nameStr, COL_ITEM);

    const qtyLen = qtyStr.length;
    const qtyPadding = Math.max(0, COL_QTY - qtyLen);
    const qtyLeftPad = Math.floor(qtyPadding / 2);
    const qtyRightPad = Math.max(0, qtyPadding - qtyLeftPad);
    qtyStr = " ".repeat(qtyLeftPad) + qtyStr + " ".repeat(qtyRightPad);

    priceStr = safePadStart(priceStr, COL_PRICE);
    totalStr = safePadStart(totalStr, COL_TOTAL);

    return nameStr + qtyStr + priceStr + totalStr;
  };

  let receiptText = "";

  // Header
  receiptText += centerText(company?.companyPrintOutName || company?.companyName || "YOUR SHOP NAME") + "\n";
  if (company?.headerLine1) receiptText += centerText(company.headerLine1) + "\n";
  if (company?.headerLine2) receiptText += centerText(company.headerLine2) + "\n";
  if (company?.headerLine3) receiptText += centerText(company.headerLine3) + "\n";
  receiptText += SEPARATOR + "\n";
  receiptText += formatLine("Bill No:", enrichedBill.billNumber) + "\n";
  receiptText += formatLine("Date:", formattedDate + " " + formattedTime) + "\n";
  receiptText += formatLine("Customer:", customerName) + "\n";
  if (customerPhone) receiptText += formatLine("Phone:", customerPhone) + "\n";
  receiptText += SEPARATOR + "\n";
  receiptText += buildHeaderRow() + "\n";
  receiptText += SEPARATOR + "\n";

  // Items
  let calculatedSubtotal = 0;
  if (enrichedBill.items && enrichedBill.items.length > 0) {
    for (const item of enrichedBill.items) {
      let displayName = "";

      if (item.tamilName && item.tamilName.trim()) {
        displayName = item.tamilName.trim();
      } else if (item.name && item.name.trim()) {
        displayName = item.name.trim();
      } else {
        displayName = "Unknown Item";
      }

      const itemTotal = item.price * item.quantity;
      calculatedSubtotal += itemTotal;

      receiptText += buildItemRow(displayName, item.quantity, item.price, itemTotal) + "\n";
    }
  } else {
    receiptText += centerText("No items found") + "\n";
  }

  // Totals
  receiptText += SEPARATOR + "\n";
  if (Math.abs(calculatedSubtotal - subtotal) > 0.01)
    receiptText += formatLine("Subtotal:", fmt(calculatedSubtotal)) + "\n";
  if (enrichedBill.discount)
    receiptText += formatLine(`Discount (${enrichedBill.discount}%):`, `-${fmt(discountAmount)}`) + "\n";

  const finalTotal = total || calculatedSubtotal - discountAmount;
  receiptText += formatLine("TOTAL:", fmt(finalTotal)) + "\n";
  receiptText += SEPARATOR + "\n";
  receiptText += formatLine("Payment:", (enrichedBill.paymentMethod || "CASH").toUpperCase()) + "\n";
  receiptText += formatLine("Paid:", fmt(paid)) + "\n";
  if (due > 0) receiptText += formatLine("Due:", fmt(due)) + "\n";
  receiptText += SEPARATOR + "\n";

  // Footer
  if (company?.footer) {
    for (const line of company.footer.split("\n")) {
      if (line.trim()) receiptText += centerText(line.trim()) + "\n";
    }
  } else {
    receiptText += centerText("Thank You for Shopping With Us") + "\n";
    receiptText += centerText("Please Visit Again") + "\n";
    receiptText += centerText("Goods once sold cannot be returned") + "\n";
    receiptText += centerText("Powered by Bill Mate POS System") + "\n";
  }
  receiptText += SEPARATOR + "\n";

  // Create and download the file using bill number as filename
  // Clean the bill number to remove any invalid filename characters
  let billNumber = String(enrichedBill._id || "bill");
  // Replace any characters that might be invalid in filenames
  billNumber = billNumber.replace(/[\\/:*?"<>|]/g, '_');
  const fileName = `${billNumber}.txt`;

  const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`Bill downloaded as: ${fileName}`);
};

// Improved web print method for 3-inch thermal printers
const printViaWebBrowser = (receiptHtml, onClose) => {
  const printWindow = window.open('', '_blank', 'width=500,height=700,toolbars=yes,scrollbars=yes');
  if (!printWindow) {
    alert("Please allow pop-ups to print the bill");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Bill</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          .print-container {
            margin: 0;
            padding: 0;
          }
          .preview-receipt {
            margin: 0;
            padding: 2mm;
            width: 100%;
          }
        }

        body {
          font-family: 'Courier New', Courier, monospace;
          background: #fff;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }

        .print-container {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .preview-receipt {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          width: 100%;
          padding: 3mm 2mm;
          background: white;
          font-weight: bold;
        }

        /* Make text darker and bolder for thermal printers */
        .preview-receipt * {
          font-weight: bold;
          color: #000;
        }

        .preview-receipt .p-shop {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }

        .preview-receipt .p-sub {
          text-align: center;
          font-size: 11px;
          font-weight: bold;
        }

        .preview-receipt .p-div {
          border-top: 1px dashed #000;
          margin: 4px 0;
        }

        .preview-receipt .p-div-solid {
          border-top: 1px solid #000;
          margin: 4px 0;
        }

        .preview-receipt .kv {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: bold;
          margin: 2px 0;
        }

        .preview-receipt .kv .v {
          text-align: right;
          word-break: break-word;
        }

        .preview-receipt .items-tbl {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          font-weight: bold;
        }

        .preview-receipt .items-tbl th,
        .preview-receipt .items-tbl td {
          padding: 2px 1px;
          text-align: right;
          font-weight: bold;
        }

        .preview-receipt .items-tbl th:first-child,
        .preview-receipt .items-tbl td:first-child {
          text-align: left;
          width: 52%;
        }

        .preview-receipt .items-tbl th:nth-child(2),
        .preview-receipt .items-tbl td:nth-child(2) {
          width: 12%;
          text-align: right;
          padding-right: 2px;
        }

        .preview-receipt .items-tbl th:nth-child(3),
        .preview-receipt .items-tbl td:nth-child(3) {
          width: 16%;
          text-align: right;
          padding-right: 2px;
        }

        .preview-receipt .items-tbl th:nth-child(4),
        .preview-receipt .items-tbl td:nth-child(4) {
          width: 20%;
          text-align: right;
        }

        .preview-receipt .items-tbl thead th {
          font-weight: bold;
          border-bottom: 1px dashed #000;
          padding-bottom: 3px;
        }

        .preview-receipt .totals-tbl {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          font-weight: bold;
        }

        .preview-receipt .totals-tbl td {
          padding: 2px 0;
        }

        .preview-receipt .totals-tbl .tl {
          text-align: left;
        }

        .preview-receipt .totals-tbl .tv {
          text-align: right;
        }

        .preview-receipt .grand td {
          font-weight: bold;
          font-size: 14px;
          padding-top: 3px;
        }

        .preview-receipt .p-footer {
          text-align: center;
          font-size: 11px;
          font-weight: bold;
          margin: 3px 0;
        }

        .preview-receipt .p-powered {
          font-size: 10px;
          color: #333;
        }

        button {
          margin: 10px auto;
          padding: 12px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          width: 90%;
          display: block;
        }

        button:hover {
          background: #45a049;
        }

        .close-btn {
          background: #666;
          margin-bottom: 20px;
        }

        .close-btn:hover {
          background: #555;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${receiptHtml}
        <button onclick="window.print(); setTimeout(() => window.close(), 1000);" class="no-print">🖨️ Print Bill</button>
        <button onclick="window.close()" class="no-print close-btn">Close</button>
      </div>
      <script>
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            if (window.opener) {
              const searchInput = window.opener.document.getElementById('item-search') ||
                                 window.opener.document.querySelector('input[placeholder*="search"]') ||
                                 window.opener.document.querySelector('input[type="text"]');
              if (searchInput) {
                searchInput.focus();
              }
            }
            window.close();
          }, 1000);
        }, 500);
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();

  setTimeout(() => {
    const searchInput = document.getElementById('item-search') ||
                       document.querySelector('input[placeholder*="search"]') ||
                       document.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.focus();
    }
  }, 100);
};

// A5 Landscape print method — formal invoice-style layout for standard printers
const printViaA5Landscape = ({
  enrichedBill,
  company,
  customerName,
  customerPhone,
  formattedDate,
  fmt,
  subtotal,
  discountAmount,
  total,
  paid,
  due,
  onClose
}) => {
  const printWindow = window.open('', '_blank', 'width=1000,height=700,toolbars=yes,scrollbars=yes');
  if (!printWindow) {
    alert("Please allow pop-ups to print the bill");
    return;
  }

  const ACCENT = "#4f8a72";
  const ACCENT_LIGHT = "#eef4f1";
  const TEXT_DARK = "#1f2937";
  const TEXT_MUTED = "#6b7280";

  // ---- Build normalized item list (name resolution + totals) ----
  let calculatedSubtotal = 0;
  const normalizedItems = (enrichedBill.items || []).map((item, index) => {
    let displayName = "";
    if (item.tamilName && item.tamilName.trim()) {
      displayName = item.tamilName.trim();
    } else if (item.name && item.name.trim()) {
      displayName = item.name.trim();
    } else {
      displayName = "Unknown Item";
    }
    const itemTotal = item.price * item.quantity;
    calculatedSubtotal += itemTotal;
    return {
      sno: index + 1,
      qty: item.quantity,
      name: displayName,
      price: fmt(item.price),
      total: fmt(itemTotal)
    };
  });

  const finalTotal = total || calculatedSubtotal - discountAmount;
  const taxOrDiscountLabel = enrichedBill.discount
    ? `Discount (${enrichedBill.discount}%)`
    : null;

  // Due date: 14 days after bill date if not explicitly present on the bill
  const billDateObj = new Date(enrichedBill.date || enrichedBill.createdAt || enrichedBill.billDate || Date.now());
  const dueDateObj = enrichedBill.dueDate
    ? new Date(enrichedBill.dueDate)
    : new Date(billDateObj.getTime() + 14 * 24 * 60 * 60 * 1000);
  const dueDateFormatted = dueDateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const companyName = company?.companyPrintOutName || company?.companyName || "Your Company";
  const companyAddressLines = [company?.headerLine1, company?.headerLine2, company?.headerLine3].filter(Boolean);

  // Get payment method
  const paymentMethod = (enrichedBill.paymentMethod || "CASH").toUpperCase();

  // ---- Static HTML fragments (identical on every page) ----
  const headerHtml = `
    <table class="header-table">
      <tr>
        <td>
          <div class="company-name">${escHtml(companyName)}</div>
          <div class="company-address">
            ${companyAddressLines.map(l => escHtml(l)).join("<br>")}
          </div>
        </td>
      </tr>
    </table>

    <div class="invoice-title">INVOICE</div>

    <table class="meta-table">
      <tr>
        <td>
          <div class="bill-to-label">Bill To</div>
          <div class="bill-to-name">${escHtml(customerName)}</div>
          ${customerPhone ? `<div class="bill-to-detail">Phone: ${escHtml(String(customerPhone))}</div>` : ""}
        </td>
        <td class="invoice-meta">
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Invoice #</span>
            <span class="invoice-meta-value">${escHtml(String(enrichedBill.billNumber))}</span>
          </div>
          <div class="invoice-meta-row">
            <span class="invoice-meta-label">Invoice date</span>
            <span class="invoice-meta-value">${formattedDate}</span>
          </div>
        </td>
      </tr>
    </table>
  `;

  const contNoteHtml = `<div class="cont-note">(continued)</div>`;

  // Table header: S.No | Description | QTY | Unit Price | Amount
  const theadHtml = `
    <tr>
      <th class="col-sno">S.No</th>
      <th class="col-desc">Description</th>
      <th class="col-qty">QTY</th>
      <th class="col-price">Unit Price</th>
      <th class="col-amount">Amount</th>
    </tr>
  `;

  // Updated totals footer - includes payment method
  const totalsFooterHtml = `
    <div class="totals-block">
      ${Math.abs(calculatedSubtotal - subtotal) > 0.01
        ? `<div class="totals-row"><span>Subtotal</span><span>${fmt(calculatedSubtotal)}</span></div>`
        : ""}
      ${taxOrDiscountLabel ? `<div class="totals-row"><span>${escHtml(taxOrDiscountLabel)}</span><span>-${fmt(discountAmount)}</span></div>` : ""}
      <div class="totals-row grand"><span>TOTAL</span><span>${fmt(finalTotal)}</span></div>
      <div class="totals-row"><span>Payment</span><span>${escHtml(paymentMethod)}</span></div>
      <div class="totals-row"><span>Paid</span><span>${fmt(paid)}</span></div>
      ${due > 0 ? `<div class="totals-row"><span>Due</span><span>${fmt(due)}</span></div>` : ""}
    </div>
    <div class="footer-block">
      <div class="terms-label">Terms and Conditions</div>
      <div class="terms-text">
        ${company?.footer
          ? company.footer.split("\n").filter(l => l.trim()).map(l => escHtml(l.trim())).join("<br>")
          : `Goods once sold cannot be returned.`}
      </div>
    </div>
  `;

  const itemsJson = JSON.stringify(
    normalizedItems.map(r => ({
      sno: r.sno,
      qty: r.qty,
      name: escHtml(r.name),
      price: escHtml(r.price),
      total: escHtml(r.total)
    }))
  ).replace(/</g, "\\u003c");

  const headerHtmlJs = JSON.stringify(headerHtml).replace(/</g, "\\u003c");
  const contNoteHtmlJs = JSON.stringify(contNoteHtml).replace(/</g, "\\u003c");
  const theadHtmlJs = JSON.stringify(theadHtml).replace(/</g, "\\u003c");
  const totalsFooterHtmlJs = JSON.stringify(totalsFooterHtml).replace(/</g, "\\u003c");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${escHtml(String(enrichedBill.billNumber))}</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: A5 landscape;
          margin: 0;
        }

        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #ddd;
          padding: 20px;
        }

        .print-container {
          display: block;
        }

        .a5-page {
          width: 210mm;
          min-height: 148mm;
          background: white;
          box-shadow: 0 0 12px rgba(0,0,0,0.2);
          padding: 8mm 10mm;
          margin: 0 auto 20px auto;
          position: relative;
        }

        .measure-box {
          position: absolute;
          left: -99999px;
          top: 0;
          visibility: hidden;
          width: 190mm;
        }

        .header-table {
          width: 100%;
          border-collapse: collapse;
        }

        .header-table td {
          padding: 0;
          vertical-align: top;
        }

        .company-name {
          font-size: 15px;
          font-weight: 700;
          color: ${TEXT_DARK};
          margin-bottom: 3px;
        }

        .company-address {
          font-size: 10px;
          color: ${TEXT_MUTED};
          line-height: 1.4;
        }

        .invoice-title {
          text-align: center;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 3px;
          color: ${ACCENT};
          padding: 4px 0 8px;
        }

        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .meta-table td {
          padding: 0;
          vertical-align: top;
        }

        .bill-to-label {
          font-size: 10px;
          font-weight: 700;
          color: ${ACCENT};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .bill-to-name {
          font-size: 13px;
          font-weight: 700;
          color: ${TEXT_DARK};
          margin-bottom: 2px;
        }

        .bill-to-detail {
          font-size: 10px;
          color: ${TEXT_MUTED};
          line-height: 1.4;
        }

        .invoice-meta {
          text-align: right;
        }

        .invoice-meta-row {
          font-size: 10.5px;
          margin-bottom: 3px;
        }

        .invoice-meta-label {
          font-weight: 700;
          color: ${ACCENT};
        }

        .invoice-meta-value {
          color: ${TEXT_DARK};
          display: inline-block;
          min-width: 75px;
          text-align: right;
        }

        .cont-note {
          font-size: 9px;
          font-style: italic;
          color: ${TEXT_MUTED};
          text-align: right;
          margin-bottom: 4px;
        }

        table.items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          margin-bottom: 6px;
        }

        table.items-table thead th {
          background: ${ACCENT};
          color: white;
          font-weight: 700;
          text-align: left;
          padding: 6px 8px;
          border: none;
        }

        table.items-table thead th.col-sno {
          width: 6%;
          text-align: center;
        }
        table.items-table thead th.col-desc {
          width: 42%;
          text-align: left;
        }
        table.items-table thead th.col-qty {
          width: 8%;
          text-align: center;
        }
        table.items-table thead th.col-price {
          width: 20%;
          text-align: right;
        }
        table.items-table thead th.col-amount {
          width: 24%;
          text-align: right;
        }

        table.items-table tbody td {
          padding: 5px 8px;
          border-bottom: 1px solid #e5e7eb;
          color: ${TEXT_DARK};
        }

        table.items-table tbody td.col-sno {
          text-align: center;
        }
        table.items-table tbody td.col-desc {
          text-align: left;
          word-break: break-word;
        }
        table.items-table tbody td.col-qty {
          text-align: center;
        }
        table.items-table tbody td.col-price,
        table.items-table tbody td.col-amount {
          text-align: right;
        }

        .totals-block {
          margin-left: auto;
          width: 45%;
          font-size: 10.5px;
          margin-top: 4px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          color: ${TEXT_DARK};
        }

        .totals-row.grand {
          background: ${ACCENT_LIGHT};
          font-weight: 800;
          font-size: 12px;
          color: ${ACCENT};
          border-top: 1px solid ${ACCENT};
          margin-top: 2px;
          margin-bottom: 2px;
        }

        .footer-block {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .terms-label {
          font-size: 10px;
          font-weight: 700;
          color: ${ACCENT};
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        .terms-text {
          font-size: 9.5px;
          color: ${TEXT_MUTED};
          line-height: 1.4;
        }

        /* Page number styling - bottom right */
        .page-number {
          position: absolute;
          bottom: 5mm;
          right: 10mm;
          font-size: 9px;
          color: ${TEXT_MUTED};
          font-weight: 400;
        }

        .btn-row {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        button {
          padding: 12px 24px;
          background: #6d28d9;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
        }

        button:hover { background: #5b21b6; }
        .close-btn { background: #666; }
        .close-btn:hover { background: #555; }

        #status-msg {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 13px;
          color: #666;
          text-align: center;
          padding: 40px;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            display: block;
          }
          .a5-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
          }
          .a5-page.last-page {
            page-break-after: auto;
          }
          table.items-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .totals-block,
          .footer-block {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div id="status-msg" class="no-print">Preparing invoice…</div>
        <div id="pages-container"></div>
        <div class="btn-row no-print" id="btn-row" style="display:none;">
          <button id="manual-print-btn">🖨️ Print (A5 Landscape)</button>
          <button onclick="window.close()" class="close-btn">Close</button>
        </div>
      </div>
      <script>
        (async function () {
          const ITEMS = ${itemsJson};
          const HEADER_HTML = ${headerHtmlJs};
          const CONT_NOTE_HTML = ${contNoteHtmlJs};
          const THEAD_HTML = ${theadHtmlJs};
          const TOTALS_FOOTER_HTML = ${totalsFooterHtmlJs};

          const MM_TO_PX = 96 / 25.4;
          const PAGE_HEIGHT_MM = 148;
          const PAD_V_MM = 8;
          const SAFETY_MM = 14; // extra buffer for print-engine rounding differences
          const USABLE_HEIGHT_PX = (PAGE_HEIGHT_MM - PAD_V_MM * 2 - SAFETY_MM) * MM_TO_PX;

          function rowHtml(item) {
            return '<tr><td class="col-sno">' + item.sno + '</td><td class="col-desc">' + item.name +
                   '</td><td class="col-qty">' + item.qty + '</td><td class="col-price">' + item.price +
                   '</td><td class="col-amount">' + item.total + '</td></tr>';
          }

          function measure(html) {
            const box = document.createElement('div');
            box.className = 'measure-box';
            box.innerHTML = html;
            document.body.appendChild(box);
            const h = box.offsetHeight;
            document.body.removeChild(box);
            return h;
          }

          // Wait for web fonts (incl. Tamil script fonts) to finish loading
          // before measuring anything. Measuring against a fallback font
          // undercounts the height of wrapped/longer lines, which was
          // causing pages to silently overflow at print time.
          if (document.fonts && document.fonts.ready) {
            try { await document.fonts.ready; } catch (e) {}
          }

          const headerH = measure(HEADER_HTML);
          const contNoteH = measure(CONT_NOTE_HTML);
          const totalsFooterH = measure(TOTALS_FOOTER_HTML);

          const theadH = (() => {
            const box = document.createElement('div');
            box.className = 'measure-box';
            box.innerHTML = '<table class="items-table"><thead>' + THEAD_HTML + '</thead></table>';
            document.body.appendChild(box);
            const h = box.querySelector('thead').offsetHeight;
            document.body.removeChild(box);
            return Math.max(1, h);
          })();

          // Measure the EXACT height of every single item row instead of
          // averaging from 1-2 sample rows. Row height varies with text
          // length/wrapping — especially for Tamil names — so a uniform
          // average row height was the root cause of the mispagination
          // (pages overflowing at print time and duplicating a row onto
          // an extra physical page).
          const rowHeights = ITEMS.map((item) => {
            const box = document.createElement('div');
            box.className = 'measure-box';
            box.innerHTML = '<table class="items-table"><tbody>' + rowHtml(item) + '</tbody></table>';
            document.body.appendChild(box);
            const h = box.querySelector('tr').offsetHeight;
            document.body.removeChild(box);
            return Math.max(1, h);
          });

          // ---- Paginate using exact per-row measured heights ----
          const pages = [];
          if (ITEMS.length === 0) {
            pages.push({ items: [], isContinuation: false });
          } else {
            let startIdx = 0;
            let pageIndex = 0;
            while (startIdx < ITEMS.length) {
              const isContinuation = pageIndex > 0;
              const headerBudget = headerH + theadH + (isContinuation ? contNoteH : 0);

              // Try to fit the rest of the items as the LAST page (header + rows + totals footer)
              let idx = startIdx;
              let usedAsLast = headerBudget + totalsFooterH;
              while (idx < ITEMS.length && usedAsLast + rowHeights[idx] <= USABLE_HEIGHT_PX) {
                usedAsLast += rowHeights[idx];
                idx++;
              }

              if (idx >= ITEMS.length) {
                // Everything remaining fits on this page as the final page
                pages.push({ items: ITEMS.slice(startIdx), isContinuation });
                startIdx = ITEMS.length;
              } else {
                // Doesn't fit as last page — fit as many as possible as a non-final page (no totals footer)
                let idx2 = startIdx;
                let usedAsNonLast = headerBudget;
                while (idx2 < ITEMS.length && usedAsNonLast + rowHeights[idx2] <= USABLE_HEIGHT_PX) {
                  usedAsNonLast += rowHeights[idx2];
                  idx2++;
                }
                // Always take at least one row so pagination makes forward progress
                const takeUpTo = Math.max(idx2, startIdx + 1);
                pages.push({ items: ITEMS.slice(startIdx, takeUpTo), isContinuation });
                startIdx = takeUpTo;
              }
              pageIndex++;
            }
          }

          // ---- Build final visible pages with page numbers ----
          const container = document.getElementById('pages-container');
          let finalHtml = '';
          const totalPages = pages.length;
          
          pages.forEach((p, idx) => {
            const isVeryLast = idx === pages.length - 1;
            const pageNumber = idx + 1;
            
            finalHtml += '<div class="a5-page' + (isVeryLast ? ' last-page' : '') + '">';
            finalHtml += HEADER_HTML;
            if (p.isContinuation) finalHtml += CONT_NOTE_HTML;
            finalHtml += '<table class="items-table"><thead>' + THEAD_HTML + '</thead><tbody>' +
                         (p.items.length > 0
                           ? p.items.map(rowHtml).join('')
                           : '<tr><td colspan="5" style="text-align:center;padding:14px 0;color:#6b7280;">No items found</td></tr>') +
                         '</tbody></table>';
            if (isVeryLast) finalHtml += TOTALS_FOOTER_HTML;
            
            // Add page number at bottom right
            finalHtml += '<div class="page-number">Page ' + pageNumber + ' of ' + totalPages + '</div>';
            
            finalHtml += '</div>';
          });
          container.innerHTML = finalHtml;

          document.getElementById('status-msg').style.display = 'none';
          document.getElementById('btn-row').style.display = 'flex';

          function doPrint() {
            window.print();
            setTimeout(() => {
              if (window.opener) {
                const searchInput = window.opener.document.getElementById('item-search') ||
                                   window.opener.document.querySelector('input[placeholder*="search"]') ||
                                   window.opener.document.querySelector('input[type="text"]');
                if (searchInput) searchInput.focus();
              }
              window.close();
            }, 1000);
          }

          document.getElementById('manual-print-btn').addEventListener('click', doPrint);

          setTimeout(doPrint, 300);
        })();
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    const searchInput = document.getElementById('item-search') ||
                       document.querySelector('input[placeholder*="search"]') ||
                       document.querySelector('input[type="text"]');
    if (searchInput) searchInput.focus();
  }, 100);

  if (typeof onClose === "function") onClose();
};
// Modified to accept billId instead of bill object
export const handlePrintBill = async (billId, onClose) => {
  console.log("Fetching bill details for ID:", billId);
  const fetchedBill = await fetchBillDetails(billId);

  if (!fetchedBill) {
    console.error("Failed to fetch bill details");
    alert("Could not load bill details. Please try again.");
    if (typeof onClose === "function") onClose();
    return;
  }

  console.log("Fetched bill details:", fetchedBill);

  console.log("Customer data structure:", fetchedBill.customer);
  console.log("Customer type:", typeof fetchedBill.customer);
  if (fetchedBill.customer && typeof fetchedBill.customer === 'object') {
    console.log("Customer object keys:", Object.keys(fetchedBill.customer));
    console.log("Full customer object:", JSON.stringify(fetchedBill.customer, null, 2));
  }

  const company = await fetchCompanyDetails();
  const companyId = localStorage.getItem("companyId");

  let enrichedItems = fetchedBill.items || [];

  if (enrichedItems.length > 0) {
    console.log("Fetching fresh product details...");
    enrichedItems = await enrichBillItemsWithProductDetails(enrichedItems, companyId);
  }

  const enrichedBill = { ...fetchedBill, items: enrichedItems };

  // Calculate totals
  const subtotal = enrichedBill.subtotal || enrichedBill.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0;
  const discountAmount = enrichedBill.discountAmount || 0;
  const total = enrichedBill.total || (subtotal - discountAmount);

  const paidOriginal = enrichedBill.paidOriginal || enrichedBill.paidAmount || 0;
  const paidFromHistory = enrichedBill.paidFromHistory || 0;
  const paid = paidOriginal + paidFromHistory;
  const due = Math.max(0, total - paid);

  console.log("Payment calculation:", { subtotal, discountAmount, total, paidOriginal, paidFromHistory, paid, due });

  const fmt = (n) => Number(n).toFixed(2);

  const printDate = new Date(enrichedBill.date || enrichedBill.createdAt || enrichedBill.billDate || Date.now());
  const formattedDate = printDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const formattedTime = printDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const customerName = getCustomerName(enrichedBill);
  const customerPhone = getCustomerPhone(enrichedBill);

  console.log("Final customer name:", customerName);
  console.log("Final customer phone:", customerPhone);

  const ESC = "\x1B";
  const GS = "\x1D";
  const BOLD_ON = ESC + "E" + "\x01";
  const BOLD_OFF = ESC + "E" + "\x00";
  const DOUBLE_WIDTH = GS + "!" + "\x10";
  const FONT_NORMAL = GS + "!" + "\x00";
  const ALIGN_RIGHT = ESC + "a" + "\x02";
  const ALIGN_LEFT = ESC + "a" + "\x00";
  const ALIGN_CENTER = ESC + "a" + "\x01";
  const PAPER_CUT = GS + "V" + "\x41" + "\x00";

  const LINE_WIDTH = 48;
  const SEPARATOR = "-".repeat(LINE_WIDTH);

  const formatLine = (left, right) => {
    const l = String(left);
    const r = String(right);
    const totalWidth = LINE_WIDTH;
    const leftSpace = Math.max(0, totalWidth - l.length - r.length);
    const spaces = " ".repeat(leftSpace);
    return l + spaces + r;
  };

  // Define exact column widths
  const COL_ITEM = 25;
  const COL_QTY = 5;
  const COL_PRICE = 8;
  const COL_TOTAL = 10;

  const buildHeaderRow = () => {
    const itemHeader = safePad("Item", COL_ITEM);
    const qtyHeader = safePadStart("Qty", COL_QTY);
    const priceHeader = safePadStart("Price", COL_PRICE);
    const totalHeader = safePadStart("Total", COL_TOTAL);
    return BOLD_ON + itemHeader + qtyHeader + priceHeader + totalHeader + BOLD_OFF;
  };

  const buildItemRow = (name, qty, price, total) => {
    let nameStr = String(name || "");
    let qtyStr = String(qty);
    let priceStr = fmt(price);
    let totalStr = fmt(total);

    // Truncate name if too long
    if (nameStr.length > COL_ITEM) {
      nameStr = nameStr.substring(0, COL_ITEM - 3) + "...";
    }

    // Pad to exact widths
    nameStr = safePad(nameStr, COL_ITEM);

    // Center align quantity
    const qtyLen = qtyStr.length;
    const qtyPadding = Math.max(0, COL_QTY - qtyLen);
    const qtyLeftPad = Math.floor(qtyPadding / 2);
    const qtyRightPad = Math.max(0, qtyPadding - qtyLeftPad);
    qtyStr = " ".repeat(qtyLeftPad) + qtyStr + " ".repeat(qtyRightPad);

    // Right align price and total
    priceStr = safePadStart(priceStr, COL_PRICE);
    totalStr = safePadStart(totalStr, COL_TOTAL);

    return nameStr + qtyStr + priceStr + totalStr;
  };

  // Helper function for centering text
  const centerText = (text) => {
    const s = String(text);
    const pad = Math.max(0, Math.floor((LINE_WIDTH - s.length) / 2));
    return " ".repeat(pad) + s;
  };

  const buildReceiptString = () => {
    let receipt = "";

    // Header
    receipt += FONT_NORMAL;
    receipt += ALIGN_CENTER;
    receipt += DOUBLE_WIDTH;
    receipt += (company?.companyPrintOutName || company?.companyName || "YOUR SHOP NAME") + "\n";
    receipt += FONT_NORMAL;
    if (company?.headerLine1) receipt += company.headerLine1 + "\n";
    if (company?.headerLine2) receipt += company.headerLine2 + "\n";
    if (company?.headerLine3) receipt += company.headerLine3 + "\n";
    receipt += SEPARATOR + "\n";
    receipt += ALIGN_LEFT;
    receipt += formatLine("Bill No:", enrichedBill.billNumber) + "\n";
    receipt += formatLine("Date:", formattedDate + " " + formattedTime) + "\n";
    receipt += formatLine("Customer:", customerName) + "\n";
    if (customerPhone) receipt += formatLine("Phone:", customerPhone) + "\n";
    receipt += SEPARATOR + "\n";
    receipt += buildHeaderRow() + "\n";
    receipt += SEPARATOR + "\n";

    // Items
    let calculatedSubtotal = 0;
    if (enrichedBill.items && enrichedBill.items.length > 0) {
      for (const item of enrichedBill.items) {
        let displayName = "";

        // Use Tamil name if available, otherwise use English name
        if (item.tamilName && item.tamilName.trim()) {
          displayName = item.tamilName.trim();
        } else if (item.name && item.name.trim()) {
          displayName = item.name.trim();
        } else {
          displayName = "Unknown Item";
        }

        const itemTotal = item.price * item.quantity;
        calculatedSubtotal += itemTotal;

        receipt += buildItemRow(displayName, item.quantity, item.price, itemTotal) + "\n";
      }
    } else {
      receipt += centerText("No items found") + "\n";
    }

    // Totals
    receipt += SEPARATOR + "\n";
    if (Math.abs(calculatedSubtotal - subtotal) > 0.01)
      receipt += formatLine("Subtotal:", fmt(calculatedSubtotal)) + "\n";
    if (enrichedBill.discount)
      receipt += formatLine(`Discount (${enrichedBill.discount}%):`, `-${fmt(discountAmount)}`) + "\n";

    const finalTotal = total || calculatedSubtotal - discountAmount;
    receipt += ALIGN_RIGHT;
    receipt += BOLD_ON + "TOTAL: " + fmt(finalTotal) + BOLD_OFF + "\n";
    receipt += ALIGN_LEFT;
    receipt += SEPARATOR + "\n";
    receipt += formatLine("Payment:", (enrichedBill.paymentMethod || "CASH").toUpperCase()) + "\n";
    receipt += formatLine("Paid:", fmt(paid)) + "\n";
    if (due > 0) receipt += formatLine("Due:", fmt(due)) + "\n";
    receipt += SEPARATOR + "\n";
    receipt += ALIGN_CENTER;

    // Footer
    if (company?.footer) {
      for (const line of company.footer.split("\n")) {
        if (line.trim()) receipt += line.trim() + "\n";
      }
    } else {
      receipt += "Thank You for Shopping With Us\n";
      receipt += "Please Visit Again\n";
      receipt += "Goods once sold cannot be returned\n";
      receipt += "Powered by Bill Mate POS System\n";
    }
    receipt += SEPARATOR + "\n";
    receipt += ALIGN_LEFT;
    receipt += PAPER_CUT;

    return receipt;
  };

  const printWithQZTray = async (receiptString) => {
    try {
      if (typeof window.qz === "undefined") throw new Error("QZ Tray JS library not loaded");
      if (!window.qz.websocket.isActive()) await window.qz.websocket.connect();
      const savedPrinter = localStorage.getItem("qzPrinterName");
      const printer = savedPrinter || (await window.qz.printers.getDefault());
      if (!printer) throw new Error("No default printer found via QZ Tray");
      const config = window.qz.configs.create(printer, { encoding: "ISO_8859_1", copies: 1 });
      await window.qz.print(config, [{ type: "raw", format: "plain", data: receiptString }]);

      setTimeout(() => {
        const searchInput = document.getElementById('item-search') ||
                           document.querySelector('input[placeholder*="search"]') ||
                           document.querySelector('input[type="text"]');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);

      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("QZ Tray print failed:", err);
      alert("QZ Tray is not available or not configured.\n\nPlease ensure QZ Tray is installed and running.");
      if (typeof onClose === "function") onClose();
    }
  };

  const sendToRawBT = (receiptString) => {
    const encodedString = encodeURIComponent(receiptString);
    const intentUrl = `intent:${encodedString}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    let rawBTLaunched = false;
    let fallbackTimeout = null;

    const cleanup = () => {
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
    };
    const onSuccess = () => {
      if (!rawBTLaunched) {
        rawBTLaunched = true;
        cleanup();

        setTimeout(() => {
          const searchInput = document.getElementById('item-search') ||
                             document.querySelector('input[placeholder*="search"]') ||
                             document.querySelector('input[type="text"]');
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);

        setTimeout(() => {
          if (typeof onClose === "function") onClose();
        }, 500);
      }
    };
    const onFailure = () => {
      if (!rawBTLaunched) {
        cleanup();
        alert("RawBT is not installed on this device.\n\nPlease install RawBT from the Google Play Store.");
        if (typeof onClose === "function") onClose();
      }
    };

    if (window.Android?.openUrl) {
      try {
        window.Android.openUrl(intentUrl);
        onSuccess();
        return;
      } catch (e) {}
    }
    if (window.Capacitor?.isNativePlatform?.()) {
      try {
        window.Capacitor.Plugins?.App?.openUrl({ url: intentUrl });
        onSuccess();
        return;
      } catch (e) {}
    }

    try {
      const a = document.createElement("a");
      a.href = intentUrl;
      a.style.display = "none";
      document.body.appendChild(a);
      const visibilityHandler = () => {
        if (document.hidden) {
          onSuccess();
          cleanup2();
        }
      };
      const blurHandler = () => {
        onSuccess();
        cleanup2();
      };
      const cleanup2 = () => {
        document.removeEventListener("visibilitychange", visibilityHandler);
        window.removeEventListener("blur", blurHandler);
      };
      document.addEventListener("visibilitychange", visibilityHandler);
      window.addEventListener("blur", blurHandler);
      a.click();
      fallbackTimeout = setTimeout(() => {
        cleanup2();
        if (!rawBTLaunched && !document.hidden) onFailure();
      }, 3000);
      setTimeout(() => a.parentNode?.removeChild(a), 500);
    } catch (error) {
      console.error("Anchor click failed:", error);
      onFailure();
    }
  };

  const buildPreviewHtml = () => {
    let calculatedSubtotal = 0;
    enrichedBill.items?.forEach((i) => {
      calculatedSubtotal += i.price * i.quantity;
    });

    const finalTotal = total || calculatedSubtotal - discountAmount;

    let itemRows = "";

    if (enrichedBill.items && enrichedBill.items.length > 0) {
      for (const item of enrichedBill.items) {
        let displayName = "";

        if (item.tamilName && item.tamilName.trim()) {
          displayName = item.tamilName.trim();
        } else if (item.name && item.name.trim()) {
          displayName = item.name.trim();
        } else {
          displayName = "Unknown Item";
        }

        const itemTotal = item.price * item.quantity;

        itemRows += `
          <tr>
            <td class="p-name">${escHtml(displayName)}</td>
            <td class="p-qty" style="text-align:center !important; text-align-last:center !important;">${item.quantity}</td>
            <td class="p-price">${fmt(item.price)}</td>
            <td class="p-total">${fmt(itemTotal)}</td>
          </tr>`;
      }
    } else {
      itemRows = `<tr><td colspan="4" style="text-align:center;padding:4px 0">No items found</td></tr>`;
    }

    const headerLines = [company?.headerLine1, company?.headerLine2, company?.headerLine3]
      .filter(Boolean)
      .map((l) => `<div class="p-sub">${escHtml(l)}</div>`)
      .join("");

    let footerHtml = "";
    if (company?.footer) {
      footerHtml = company.footer
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean)
        .map((l) => `<div class="p-footer">${escHtml(l)}</div>`)
        .join("");
    } else {
      footerHtml = `
        <div class="p-footer">Thank You for Shopping With Us</div>
        <div class="p-footer">Please Visit Again</div>
        <div class="p-footer">Goods once sold cannot be returned</div>
        <div class="p-footer p-powered">Powered by Bill Mate POS System</div>`;
    }

    return `
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .preview-receipt {
            margin: 0;
            padding: 2mm;
            width: 100%;
          }

          /* Force print styles */
          .p-qty {
            text-align: center !important;
            text-align-last: center !important;
          }

          .items-tbl td.p-qty {
            text-align: center !important;
          }
        }

        .preview-receipt {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          width: 280px;
          color: #000;
        }

        .preview-receipt * {
          font-weight: bold;
        }

        .p-shop {
          text-align: center;
          font-size: 14px;
          margin-bottom: 3px;
        }

        .p-sub {
          text-align: center;
          font-size: 11px;
        }

        .p-div {
          border-top: 1px dashed #000;
          margin: 3px 0;
        }

        .p-div-solid {
          border-top: 1px solid #000;
          margin: 3px 0;
        }

        .kv {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          margin: 1px 0;
        }

        .items-tbl {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 11px;
        }

        .items-tbl th,
        .items-tbl td {
          padding: 1px 0;
        }

        .items-tbl th {
          border-bottom: 1px dashed #000;
          padding-bottom: 3px;
        }

        .p-name {
          width: 52%;
          text-align: left;
          word-break: break-word;
        }

        .p-qty {
          width: 12%;
          text-align: center !important;
          text-align-last: center !important;
          padding-right: 2px;
        }

        .p-price {
          width: 16%;
          text-align: right;
          padding-right: 2px;
        }

        .p-total {
          width: 20%;
          text-align: right;
        }

        .totals-tbl {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
        }

        .totals-tbl td {
          padding: 1px 0;
        }

        .tl { text-align: left; }
        .tv { text-align: right; }

        .grand td {
          font-size: 13px;
        }

        .p-footer {
          text-align: center;
          font-size: 11px;
          margin: 2px 0;
        }

        .p-powered {
          font-size: 10px;
        }

        /* Additional print-specific styles */
        @media print {
          .p-qty {
            text-align: center !important;
          }

          .items-tbl td.p-qty {
            text-align: center !important;
          }
        }
      </style>

      <div class="preview-receipt">
        <div class="p-shop">${escHtml(company?.companyPrintOutName || company?.companyName || "YOUR SHOP NAME")}</div>
        ${headerLines}

        <div class="p-div"></div>

        <div class="kv"><span>Bill No</span><span>${escHtml(String(enrichedBill.billNumber))}</span></div>
        <div class="kv"><span>Date</span><span>${formattedDate} ${formattedTime}</span></div>
        <div class="kv"><span>Customer</span><span>${escHtml(customerName)}</span></div>
        ${customerPhone ? `<div class="kv"><span>Phone</span><span>${escHtml(String(customerPhone))}</span></div>` : ""}

        <div class="p-div"></div>

        <table class="items-tbl">
          <thead>
            <tr>
              <th class="p-name">Item</th>
              <th class="p-qty" style="text-align:center !important;">Qty</th>
              <th class="p-price">Price</th>
              <th class="p-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="p-div"></div>

        <table class="totals-tbl">
          ${Math.abs(calculatedSubtotal - subtotal) > 0.01
            ? `<tr><td class="tl">Subtotal</td><td class="tv">${fmt(calculatedSubtotal)}</td></tr>`
            : ""}
          ${enrichedBill.discount
            ? `<tr><td class="tl">Discount (${enrichedBill.discount}%)</td><td class="tv">-${fmt(discountAmount)}</td></tr>`
            : ""}
        </table>

        <table class="totals-tbl grand">
          <tr>
            <td class="tl">TOTAL</td>
            <td class="tv">${fmt(finalTotal)}</td>
          </tr>
        </table>

        <div class="p-div"></div>

        <table class="totals-tbl">
          <tr><td class="tl">Payment</td><td class="tv">${escHtml((enrichedBill.paymentMethod || "CASH").toUpperCase())}</td></tr>
          <tr><td class="tl">Paid</td><td class="tv">${fmt(paid)}</td></tr>
          ${due > 0 ? `<tr><td class="tl">Due</td><td class="tv">${fmt(due)}</td></tr>` : ""}
        </table>

        <div class="p-div"></div>

        ${footerHtml}

        <div class="p-div"></div>
      </div>
    `;
  };

const showPreviewModal = () => {
  const existing = document.getElementById("bill-preview-modal");
  if (existing) existing.remove();

  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
  const hasQZTray = typeof window.qz !== "undefined";

  const previewHtml = buildPreviewHtml();

  const btnBase = "flex:1;padding:14px;border-radius:8px;border:none;font-size:14px;font-weight:bold;cursor:pointer;min-height:52px;min-width:0;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.1);";

  let printButtons = `
    <button id="bpm-cancel" style="flex:1;padding:14px;border-radius:8px;border:1px solid #ddd;background:#f5f5f5;font-size:14px;color:#666;cursor:pointer;font-weight:600;min-height:52px;min-width:0;">Cancel</button>`;

  // For Mobile users: Show ONLY RawBT button
  if (isMobile) {
    printButtons += `<button id="bpm-rawbt" style="${btnBase}background:#2c3e50;color:white;border:2px solid #1a2632;box-shadow:0 0 0 3px rgba(44,62,80,0.3);">🖨️ Print Bill</button>`;
    console.log("Mobile mode - Showing only RawBT button");
  }
  // For Desktop users: Show Download TXT, (optionally) Web Print, A5 Landscape, and QZ Tray
  else {
    // Add Download TXT option for desktop
    printButtons += `<button id="bpm-download" style="${btnBase}background:#FF9800;color:white;border:2px solid #F57C00;box-shadow:0 0 0 3px rgba(255,152,0,0.3);">📄 1. Download TXT</button>`;

    // Add Web Print option for desktop — controlled by SHOW_WEB_PRINT
    if (SHOW_WEB_PRINT) {
      printButtons += `<button id="bpm-web" style="${btnBase}background:#2196F3;color:white;border:2px solid #0b7dda;">🌐 2. Web Print</button>`;
    }

    // Add A5 Landscape option for desktop
    printButtons += `<button id="bpm-a5" style="${btnBase}background:#6d28d9;color:white;border:2px solid #5b21b6;">📃 ${SHOW_WEB_PRINT ? '3' : '2'}. A5 Landscape</button>`;

    // Add QZ Tray button for desktop (only if available)
    if (hasQZTray) {
      printButtons += `<button id="bpm-qz" style="${btnBase}background:#0f766e;color:white;border:2px solid #0a5c55;">🖨️ ${SHOW_WEB_PRINT ? '4' : '3'}. QZ Tray</button>`;
      console.log("Desktop mode - Showing Download TXT" + (SHOW_WEB_PRINT ? ", Web Print" : "") + ", A5 Landscape, and QZ Tray");
    } else {
      console.log("Desktop mode - Showing Download TXT" + (SHOW_WEB_PRINT ? ", Web Print" : "") + ", and A5 Landscape only (QZ Tray not available)");
    }
  }

  const modal = document.createElement("div");
  modal.id = "bill-preview-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;padding:16px;";

  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:100%;max-width:400px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 40px rgba(0,0,0,0.25);overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #e5e5e5;flex-shrink:0;background:#fff;">
        <span style="font-size:15px;font-weight:600;color:#111;">Print Bill</span>
        <button id="bpm-close" style="background:none;border:none;cursor:pointer;font-size:26px;color:#999;line-height:1;width:40px;height:40px;padding:0;">&times;</button>
      </div>
      <div style="overflow-y:auto;padding:16px;background:#e8e8e8;flex:1;display:flex;justify-content:center;-webkit-overflow-scrolling:touch;">
        <div style="background:white;border-radius:8px;padding:14px 18px;box-shadow:0 1px 4px rgba(0,0,0,0.12);display:inline-block;">
          ${previewHtml}
        </div>
      </div>
      <div style="display:flex;gap:10px;padding:14px 16px;border-top:1px solid #e5e5e5;flex-shrink:0;background:#fff;padding-bottom:calc(14px + env(safe-area-inset-bottom, 0px));flex-wrap:wrap;">
        ${printButtons}
      </div>
    </div>`;

  const style = document.createElement("style");
  style.textContent = `
    #bpm-rawbt:hover { background:#1a2632 !important; transform:translateY(-2px); }
    #bpm-qz:hover { background:#0a5c55 !important; transform:translateY(-2px); }
    #bpm-web:hover { background:#0b7dda !important; transform:translateY(-2px); }
    #bpm-download:hover { background:#F57C00 !important; transform:translateY(-2px); }
    #bpm-a5:hover { background:#5b21b6 !important; transform:translateY(-2px); }
    #bpm-cancel:hover { background:#e8e8e8 !important; }

    /* Focus styles for better visibility */
    #bpm-rawbt:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(44,62,80,0.5);
      transform: scale(1.02);
    }

    #bpm-download:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(255,152,0,0.5);
      transform: scale(1.02);
    }

    #bpm-web:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(33,150,243,0.5);
      transform: scale(1.02);
    }

    #bpm-a5:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(109,40,217,0.5);
      transform: scale(1.02);
    }

    #bpm-qz:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(15,118,110,0.5);
      transform: scale(1.02);
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    /* Add pulse animation only for mobile RawBT button */
    #bpm-rawbt {
      animation: pulse 1s ease-in-out 2;
    }

    /* Add pulse animation for desktop download button */
    #bpm-download {
      animation: pulse 1s ease-in-out 2;
    }

    /* Mobile-specific button adjustments */
    @media (max-width: 480px) {
      button {
        font-size: 16px !important;
        padding: 14px !important;
      }
    }
  `;
  modal.appendChild(style);
  document.body.appendChild(modal);

  const closeModal = () => {
    document.getElementById("bill-preview-modal")?.remove();
    document.removeEventListener("keydown", handleKeyDown);
  };

  // IMPROVED: Keyboard handler with number shortcuts, adjusted for whether Web Print is shown
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
    }

    // Number shortcuts for quick printing (Desktop only)
    if (!isMobile) {
      if (e.key === "1") {
        e.preventDefault();
        console.log("Shortcut 1: Download TXT");
        const downloadBtn = document.getElementById("bpm-download");
        if (downloadBtn) {
          downloadBtn.click();
        }
        return;
      }

      if (SHOW_WEB_PRINT && e.key === "2") {
        e.preventDefault();
        console.log("Shortcut 2: Web Print");
        const webBtn = document.getElementById("bpm-web");
        if (webBtn) {
          webBtn.click();
        }
        return;
      }

      if (e.key === (SHOW_WEB_PRINT ? "3" : "2")) {
        e.preventDefault();
        console.log("Shortcut: A5 Landscape");
        const a5Btn = document.getElementById("bpm-a5");
        if (a5Btn) {
          a5Btn.click();
        }
        return;
      }

      if (e.key === (SHOW_WEB_PRINT ? "4" : "3")) {
        e.preventDefault();
        console.log("Shortcut: QZ Tray");
        const qzBtn = document.getElementById("bpm-qz");
        if (qzBtn) {
          qzBtn.click();
        }
        return;
      }
    }

    // Enter key triggers the focused button
    if (e.key === "Enter") {
      e.preventDefault();
      const focusedElement = document.activeElement;

      if (isMobile) {
        const rawbtBtn = document.getElementById("bpm-rawbt");
        if (rawbtBtn && document.activeElement === rawbtBtn) {
          rawbtBtn.click();
        } else if (rawbtBtn) {
          rawbtBtn.click();
        }
      } else {
        // Check which button is focused
        if (focusedElement && focusedElement.id === "bpm-download") {
          document.getElementById("bpm-download")?.click();
        } else if (SHOW_WEB_PRINT && focusedElement && focusedElement.id === "bpm-web") {
          document.getElementById("bpm-web")?.click();
        } else if (focusedElement && focusedElement.id === "bpm-a5") {
          document.getElementById("bpm-a5")?.click();
        } else if (focusedElement && focusedElement.id === "bpm-qz") {
          document.getElementById("bpm-qz")?.click();
        } else if (focusedElement && focusedElement.id === "bpm-cancel") {
          closeModal();
        } else {
          // Default: trigger the first available print button
          const qzBtn = document.getElementById("bpm-qz");
          if (qzBtn) {
            qzBtn.click();
          } else {
            const webBtn = SHOW_WEB_PRINT ? document.getElementById("bpm-web") : null;
            if (webBtn) {
              webBtn.click();
            } else {
              const downloadBtn = document.getElementById("bpm-download");
              if (downloadBtn) {
                downloadBtn.click();
              }
            }
          }
        }
      }
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  // Close button events
  document.getElementById("bpm-close")?.addEventListener("click", closeModal);
  document.getElementById("bpm-cancel")?.addEventListener("click", closeModal);

  // IMPORTANT: Remove backdrop click to close modal - only close via buttons or Escape
  // modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  // User cannot click outside to close - intentional for better UX

  // Add QZ Tray event listener for desktop users
  const qzBtn = document.getElementById("bpm-qz");
  if (qzBtn) {
    qzBtn.addEventListener("click", () => {
      console.log("QZ Tray button clicked");
      closeModal();
      setTimeout(async () => {
        const receiptString = await buildReceiptString();
        printWithQZTray(receiptString);
      }, 150);
    });
  }

  // Add RawBT event listener for mobile users only
  const rawbtBtn = document.getElementById("bpm-rawbt");
  if (rawbtBtn) {
    rawbtBtn.addEventListener("click", () => {
      console.log("RawBT button clicked");
      closeModal();
      setTimeout(async () => {
        const receiptString = await buildReceiptString();
        sendToRawBT(receiptString);
      }, 150);
    });
  }

  // Add Download TXT event listener for desktop users only
  const downloadBtn = document.getElementById("bpm-download");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      console.log("Download TXT button clicked");
      closeModal();
      setTimeout(async () => {
        await downloadBillAsTxt(enrichedBill, company, customerName, customerPhone, formattedDate, formattedTime, fmt, subtotal, discountAmount, total, paid, due);
        if (typeof onClose === "function") onClose();
      }, 150);
    });
  }

  // Add Web Print event listener for desktop users only — gated by SHOW_WEB_PRINT
  if (SHOW_WEB_PRINT) {
    const webBtn = document.getElementById("bpm-web");
    if (webBtn) {
      webBtn.addEventListener("click", () => {
        console.log("Web Print button clicked");
        closeModal();
        setTimeout(() => printViaWebBrowser(previewHtml, onClose), 150);
      });
    }
  }

  // Add A5 Landscape event listener for desktop users only
  const a5Btn = document.getElementById("bpm-a5");
  if (a5Btn) {
    a5Btn.addEventListener("click", () => {
      console.log("A5 Landscape button clicked");
      closeModal();
      setTimeout(() => {
        printViaA5Landscape({
          enrichedBill,
          company,
          customerName,
          customerPhone,
          formattedDate,
          fmt,
          subtotal,
          discountAmount,
          total,
          paid,
          due,
          onClose
        });
      }, 150);
    });
  }

  // Focus on the appropriate button after modal opens
  setTimeout(() => {
    if (isMobile) {
      const rawbtBtn = document.getElementById("bpm-rawbt");
      if (rawbtBtn) {
        rawbtBtn.focus();
        console.log("Mobile - Focus set on RawBT button");
      }
    } else {
      // On desktop, focus QZ Tray if available, else Web Print (if shown), else Download
      const qzBtn = document.getElementById("bpm-qz");
      if (qzBtn) {
        qzBtn.focus();
        console.log("Desktop - Focus set on QZ Tray button");
      } else {
        const webBtn = SHOW_WEB_PRINT ? document.getElementById("bpm-web") : null;
        if (webBtn) {
          webBtn.focus();
          console.log("Desktop - Focus set on Web Print button");
        } else {
          const downloadBtn = document.getElementById("bpm-download");
          if (downloadBtn) {
            downloadBtn.focus();
            console.log("Desktop - Focus set on Download TXT button");
          }
        }
      }
    }

    // Log which buttons are available for debugging
    console.log("Device type:", isMobile ? "Mobile" : "Desktop");
    console.log("Available buttons:", {
      download: !!document.getElementById("bpm-download"),
      web: !!document.getElementById("bpm-web"),
      a5: !!document.getElementById("bpm-a5"),
      rawbt: !!document.getElementById("bpm-rawbt"),
      qz: !!document.getElementById("bpm-qz")
    });

    // Add improved keyboard shortcut hint with number shortcuts
    const modalContainer = document.querySelector("#bill-preview-modal div:first-child");
    if (modalContainer && !modalContainer.querySelector(".keyboard-hint")) {
      const hint = document.createElement("div");
      hint.className = "keyboard-hint";
      hint.style.cssText = "text-align:center;padding:8px 16px 0;font-size:11px;color:#999;border-top:1px solid #f0f0f0;margin-top:8px;";

      if (isMobile) {
        hint.innerHTML = "💡 Press <kbd style=\"background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;\">Enter</kbd> to print • <kbd style=\"background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;\">Esc</kbd> to close";
      } else {
        const webPrintHint = SHOW_WEB_PRINT
          ? ` • <kbd style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;">2</kbd> Web Print`
          : "";
        const a5Num = SHOW_WEB_PRINT ? "3" : "2";
        const qzNum = SHOW_WEB_PRINT ? "4" : "3";
        hint.innerHTML = `💡 Keyboard Shortcuts: <kbd style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;">1</kbd> Download TXT${webPrintHint} • <kbd style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;">${a5Num}</kbd> A5 Landscape • <kbd style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;">${qzNum}</kbd> QZ Tray • <kbd style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;">Tab</kbd> + <kbd style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;">Enter</kbd> on button • <kbd style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;">Esc</kbd> close`;
      }

      const buttonContainer = modal.querySelector("div:last-child");
      if (buttonContainer) {
        buttonContainer.parentNode.insertBefore(hint, buttonContainer.nextSibling);
      }
    }
  }, 100);
};

  showPreviewModal();
};