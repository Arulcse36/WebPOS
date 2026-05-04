import axios from "axios";

const API = import.meta.env.VITE_API_URL;

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
  // For Desktop users: Show Download TXT, Web Print, and QZ Tray
  else {
    // Add Download TXT option for desktop
    printButtons += `<button id="bpm-download" style="${btnBase}background:#FF9800;color:white;border:2px solid #F57C00;box-shadow:0 0 0 3px rgba(255,152,0,0.3);">📄 1. Download TXT</button>`;
    
    // Add Web Print option for desktop
    printButtons += `<button id="bpm-web" style="${btnBase}background:#2196F3;color:white;border:2px solid #0b7dda;">🌐 2. Web Print</button>`;
    
    // Add QZ Tray button for desktop (only if available)
    if (hasQZTray) {
      printButtons += `<button id="bpm-qz" style="${btnBase}background:#0f766e;color:white;border:2px solid #0a5c55;">🖨️ 3. QZ Tray</button>`;
      console.log("Desktop mode - Showing Download TXT, Web Print, and QZ Tray");
    } else {
      console.log("Desktop mode - Showing Download TXT and Web Print only (QZ Tray not available)");
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
  
  // IMPROVED: Keyboard handler with number shortcuts (1,2,3)
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
      
      if (e.key === "2") {
        e.preventDefault();
        console.log("Shortcut 2: Web Print");
        const webBtn = document.getElementById("bpm-web");
        if (webBtn) {
          webBtn.click();
        }
        return;
      }
      
      if (e.key === "3") {
        e.preventDefault();
        console.log("Shortcut 3: QZ Tray");
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
        } else if (focusedElement && focusedElement.id === "bpm-web") {
          document.getElementById("bpm-web")?.click();
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
            const webBtn = document.getElementById("bpm-web");
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

  // Add Web Print event listener for desktop users only
  const webBtn = document.getElementById("bpm-web");
  if (webBtn) {
    webBtn.addEventListener("click", () => {
      console.log("Web Print button clicked");
      closeModal();
      setTimeout(() => printViaWebBrowser(previewHtml, onClose), 150);
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
      // On desktop, focus QZ Tray if available, else Web Print, else Download
      const qzBtn = document.getElementById("bpm-qz");
      if (qzBtn) {
        qzBtn.focus();
        console.log("Desktop - Focus set on QZ Tray button");
      } else {
        const webBtn = document.getElementById("bpm-web");
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
        hint.innerHTML = "💡 Keyboard Shortcuts: <kbd style=\"background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;\">1</kbd> Download TXT • <kbd style=\"background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;\">2</kbd> Web Print • <kbd style=\"background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;\">3</kbd> QZ Tray • <kbd style=\"background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;\">Tab</kbd> + <kbd style=\"background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;\">Enter</kbd> on button • <kbd style=\"background:#f5f5f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:bold;\">Esc</kbd> close";
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