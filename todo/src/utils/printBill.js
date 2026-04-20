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
    
    // Make sure the API URL is constructed correctly
    const apiUrl = API.endsWith('/') ? API : `${API}/`;
    const url = `${apiUrl}bills/${billId}`;
    
    console.log("Fetching bill from URL:", url);
    console.log("With params:", { companyId });
    
    const response = await axios.get(url, {
      params: { companyId },
      timeout: 10000
    });
    
    console.log("Bill fetch response:", response.data);
    
    // Extract the bill data from the response
    // The backend returns { success: true, data: formattedBill }
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
// ALWAYS fetches fresh data from product model
const enrichBillItemsWithProductDetails = async (items, companyId) => {
  if (!items || items.length === 0) return items;
  
  const enrichedItems = [];
  
  for (const currentItem of items) {
    // ALWAYS fetch product details if productId exists
    if (currentItem.productId) {
      try {
        const product = await fetchProductDetails(currentItem.productId, companyId);
        if (product) {
          enrichedItems.push({
            ...currentItem,
            // ALWAYS use the fresh data from product model
            name: product.name || currentItem.name,
            tamilName: product.tamilName || "", // Always use fresh Tamil name from product
            productCode: product.productCode,
            mrp: product.mrp,
            retailRate: product.retailRate,
            wholesaleRate: product.wholesaleRate,
            price: currentItem.price, // Keep the original price from the bill
            quantity: currentItem.quantity // Keep the original quantity from the bill
          });
          console.log(`Fetched fresh Tamil name for ${product.name}: ${product.tamilName || 'Not available'}`);
        } else {
          // If product not found, keep original but log warning
          console.warn(`Product not found for ID: ${currentItem.productId}`);
          enrichedItems.push(currentItem);
        }
      } catch (error) {
        console.error("Error fetching product for item:", currentItem, error);
        enrichedItems.push(currentItem);
      }
    } else {
      // No productId, keep as is
      enrichedItems.push(currentItem);
    }
  }
  
  return enrichedItems;
};

const hasTamil = (text) => /[\u0B80-\u0BFF]/.test(String(text));

const ensureTamilFontLoaded = async () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontFamilies = [
    "'Noto Sans Tamil'",
    "'Noto Sans Tamil UI'",
    "'Latha'",
    "'Tamil MN'",
    "'Tamil Vijay'",
    "sans-serif",
  ];
  for (const fontFamily of fontFamilies) {
    ctx.font = `24px ${fontFamily}`;
    ctx.measureText("அ");
  }
  await document.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 100));
};

const tamilTextToEscPos = async (text, { fontSize = 24, paperWidthPx = 384 } = {}) => {
  await ensureTamilFontLoaded();
  return new Promise(async (resolve) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const fontFamily = `${fontSize}px 'Noto Sans Tamil', 'Noto Sans Tamil UI', 'Latha', 'Tamil MN', 'Arial Unicode MS', sans-serif`;
      canvas.width = paperWidthPx;
      ctx.font = fontFamily;
      ctx.textBaseline = "top";

      const maxWidth = paperWidthPx - 8;
      const chars = [...String(text)];
      const lines = [];
      let currentLine = "";
      for (const char of chars) {
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      if (lines.length === 0 && text.length > 0) lines.push(text);

      const lineHeight = fontSize * 1.5;
      canvas.height = lineHeight * lines.length + 12;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.font = fontFamily;
      ctx.textBaseline = "top";
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 4, i * lineHeight + 4);
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const widthBytes = Math.ceil(canvas.width / 8);
      const height = canvas.height;
      const header = [
        0x1d, 0x76, 0x30, 0x00,
        widthBytes & 0xff, (widthBytes >> 8) & 0xff,
        height & 0xff, (height >> 8) & 0xff,
      ];
      const bitmapBytes = [];
      for (let y = 0; y < height; y++) {
        for (let xByte = 0; xByte < widthBytes; xByte++) {
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) {
            const x = xByte * 8 + bit;
            if (x < canvas.width) {
              const idx = (y * canvas.width + x) * 4;
              const isDark =
                imgData.data[idx] < 200 ||
                imgData.data[idx + 1] < 200 ||
                imgData.data[idx + 2] < 200;
              if (isDark) byte |= 0x80 >> bit;
            }
          }
          bitmapBytes.push(byte);
        }
      }
      resolve(new Uint8Array([...header, ...bitmapBytes]));
    } catch (error) {
      console.error("Error in tamilTextToEscPos:", error);
      resolve(new Uint8Array([0x1d, 0x76, 0x30, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00]));
    }
  });
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

// Modified to accept billId instead of bill object
export const handlePrintBill = async (billId, onClose) => {
  await ensureTamilFontLoaded();
  
  // Fetch complete bill details from backend
  console.log("Fetching bill details for ID:", billId);
  const fetchedBill = await fetchBillDetails(billId);
  
  if (!fetchedBill) {
    console.error("Failed to fetch bill details");
    alert("Could not load bill details. Please try again.");
    if (typeof onClose === "function") onClose();
    return;
  }
  
  console.log("Fetched bill details:", fetchedBill);
  
  const company = await fetchCompanyDetails();
  const companyId = localStorage.getItem("companyId");

  // Use the fetched bill data
  let enrichedItems = fetchedBill.items || [];
  
  if (enrichedItems.length > 0) {
    console.log("Fetching fresh Tamil names from product model...");
    enrichedItems = await enrichBillItemsWithProductDetails(enrichedItems, companyId);
    console.log("Enriched items with fresh Tamil names:", enrichedItems.map(i => ({
      name: i.name,
      tamilName: i.tamilName,
      productId: i.productId
    })));
  }
  
  const enrichedBill = { ...fetchedBill, items: enrichedItems };

  // Calculate totals correctly
  const subtotal = enrichedBill.subtotal || enrichedBill.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0;
  const discountAmount = enrichedBill.discountAmount || 0;
  const total = enrichedBill.total || (subtotal - discountAmount);
  
  // Calculate paid amount - combine original payment and payment history
  const paidOriginal = enrichedBill.paidOriginal || enrichedBill.paidAmount || 0;
  const paidFromHistory = enrichedBill.paidFromHistory || 0;
  const paid = paidOriginal + paidFromHistory;
  
  // Calculate due amount
  const due = Math.max(0, total - paid);
  
  console.log("Payment calculation:", {
    subtotal,
    discountAmount,
    total,
    paidOriginal,
    paidFromHistory,
    paid,
    due
  });
  
  const fmt = (n) => Number(n).toFixed(2);

  const printDate = new Date(enrichedBill.date || enrichedBill.createdAt || enrichedBill.billDate || Date.now());
  const formattedDate = printDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const formattedTime = printDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

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

  const centerText = (text) => {
    const s = String(text);
    const pad = Math.max(0, Math.floor((LINE_WIDTH - s.length) / 2));
    return " ".repeat(pad) + s;
  };

  const formatLine = (left, right) => {
    const l = String(left);
    const r = String(right);
    return l + " ".repeat(Math.max(1, LINE_WIDTH - l.length - r.length)) + r;
  };

  const COL_NAME = 20;
  const COL_QTY = 4;
  const COL_PRICE = 10;
  const COL_TOTAL = 14;

  const buildItemRowPlain = (name, qty, price, total, isHeader = false) => {
    const nameStr = String(name || "").substring(0, COL_NAME).padEnd(COL_NAME);
    const qtyRaw = String(qty);
    const qtyStr = qtyRaw.length > COL_QTY ? qtyRaw.slice(-COL_QTY) : qtyRaw.padStart(COL_QTY);
    const priceRaw = String(isHeader ? price : fmt(price));
    const priceStr = priceRaw.length > COL_PRICE ? priceRaw.slice(-COL_PRICE) : priceRaw.padStart(COL_PRICE);
    const totalRaw = String(isHeader ? total : fmt(total));
    const totalStr = totalRaw.length > COL_TOTAL ? totalRaw.slice(-COL_TOTAL) : totalRaw.padStart(COL_TOTAL);
    return nameStr + qtyStr + priceStr + totalStr;
  };

  const buildItemRowEscPos = (name, qty, price, total, isHeader = false) => {
    const plain = buildItemRowPlain(name, qty, price, total, isHeader);
    return isHeader ? BOLD_ON + plain + BOLD_OFF : plain;
  };

  const buildReceiptSegments = async () => {
    const segments = [];
    const t = (text) => segments.push(text);
    const b = (uint8) => segments.push(uint8);

    const tamilLine = async (text, align = ALIGN_LEFT, fontSize = 24) => {
      if (hasTamil(text)) {
        t(align);
        try {
          b(await tamilTextToEscPos(String(text), { fontSize }));
          t("\n");
        } catch {
          t(String(text) + "\n");
        }
      } else {
        t(text + "\n");
      }
    };

    t(FONT_NORMAL);
    t(ALIGN_CENTER);
    t(DOUBLE_WIDTH);
    t((company?.companyPrintOutName || company?.companyName || "YOUR SHOP NAME") + "\n");
    t(FONT_NORMAL);
    if (company?.headerLine1) t(company.headerLine1 + "\n");
    if (company?.headerLine2) t(company.headerLine2 + "\n");
    if (company?.headerLine3) t(company.headerLine3 + "\n");
    t(SEPARATOR + "\n");
    t(ALIGN_LEFT);
    t(formatLine("Bill No:", enrichedBill.billNumber) + "\n");
    t(formatLine("Date:", formattedDate + " " + formattedTime) + "\n");
    
    // Handle customer name - could be string or object
    const customerName = typeof enrichedBill.customer === 'string' 
      ? enrichedBill.customer 
      : enrichedBill.customer?.name || "Walk-in Customer";
    const customerPhone = typeof enrichedBill.customer === 'string' 
      ? null 
      : enrichedBill.customer?.phone;
    
    t(formatLine("Customer:", customerName) + "\n");
    if (customerPhone) t(formatLine("Phone:", customerPhone) + "\n");
    
    t(SEPARATOR + "\n");
    t(buildItemRowEscPos("Item", "Qty", "Price", "Total", true) + "\n");
    t(SEPARATOR + "\n");

    let calculatedSubtotal = 0;
    if (enrichedBill.items && enrichedBill.items.length > 0) {
      for (const item of enrichedBill.items) {
        let displayName = "";
        
        // ALWAYS use Tamil name from product model (freshly fetched)
        if (item.tamilName && item.tamilName.trim()) {
          displayName = item.tamilName.trim();
          console.log(`Using Tamil name for printing: ${displayName}`);
        } else if (item.name && item.name.trim()) {
          displayName = item.name.trim();
          console.log(`No Tamil name available, using English name: ${displayName}`);
        } else {
          displayName = "Unknown Item";
          console.log(`No name available for product`);
        }
        
        const itemTotal = item.price * item.quantity;
        calculatedSubtotal += itemTotal;

        t(buildItemRowEscPos(displayName, item.quantity, item.price, itemTotal) + "\n");
      }
    } else {
      t(centerText("No items found") + "\n");
    }

    t(SEPARATOR + "\n");
    if (Math.abs(calculatedSubtotal - subtotal) > 0.01)
      t(formatLine("Subtotal:", fmt(calculatedSubtotal)) + "\n");
    if (enrichedBill.discount)
      t(formatLine(`Discount (${enrichedBill.discount}%):`, `-${fmt(discountAmount)}`) + "\n");

    const finalTotal = total || calculatedSubtotal - discountAmount;
    t(ALIGN_RIGHT);
    t(BOLD_ON + "TOTAL: " + fmt(finalTotal) + BOLD_OFF + "\n");
    t(ALIGN_LEFT);
    t(SEPARATOR + "\n");
    t(formatLine("Payment:", (enrichedBill.paymentMethod || "CASH").toUpperCase()) + "\n");
    t(formatLine("Paid:", fmt(paid)) + "\n");
    if (due > 0) t(formatLine("Due:", fmt(due)) + "\n");
    t(SEPARATOR + "\n");
    t(ALIGN_CENTER);

    if (company?.footer) {
      for (const line of company.footer.split("\n")) {
        if (line.trim()) await tamilLine(line.trim(), ALIGN_CENTER, 20);
      }
    } else {
      await tamilLine("Thank You for Shopping With Us", ALIGN_CENTER, 20);
      await tamilLine("Please Visit Again", ALIGN_CENTER, 20);
      await tamilLine("Goods once sold cannot be returned", ALIGN_CENTER, 20);
      await tamilLine("Powered by Bill Mate POS System", ALIGN_CENTER, 18);
    }
    t(SEPARATOR + "\n");
    t(ALIGN_LEFT);
    t(PAPER_CUT);
    return segments;
  };

  const buildReceiptString = async () => {
    const segments = await buildReceiptSegments();
    return segments.map((seg) => (seg instanceof Uint8Array ? uint8ToBinaryStr(seg) : seg)).join("");
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
    if (enrichedBill.items?.length > 0) {
      for (const item of enrichedBill.items) {
        let displayName = "";
        
        // ALWAYS use Tamil name from product model (freshly fetched)
        if (item.tamilName && item.tamilName.trim()) {
          displayName = item.tamilName.trim();
        } else if (item.name && item.name.trim()) {
          displayName = item.name.trim();
        } else {
          displayName = "Unknown Item";
        }
        
        const itemTotal = item.price * item.quantity;
        const nameStyle = hasTamil(displayName) 
          ? 'font-family: "Noto Sans Tamil", "Latha", "Tamil MN", sans-serif;' 
          : '';
        
        itemRows += `
          <tr>
            <td class="p-name" style="${nameStyle}">${escHtml(displayName)}</td>
            <td class="p-qty">${item.quantity}</td>
            <td class="p-price">${fmt(item.price)}</td>
            <td class="p-total">${fmt(itemTotal)}</td>
          </tr>`;
      }
    } else {
      itemRows = `<tr><td colspan="4" style="text-align:center;padding:6px 0">No items found</td></tr>`;
    }

    const headerLines = [company?.headerLine1, company?.headerLine2, company?.headerLine3]
      .filter(Boolean)
      .map((l) => `<div class="p-sub">${escHtml(l)}</div>`)
      .join("");

    let footerHtml = "";
    if (company?.footer) {
      footerHtml = company.footer.split("\n").filter((l) => l.trim())
        .map((l) => `<div class="p-footer">${escHtml(l.trim())}</div>`).join("");
    } else {
      footerHtml = `
        <div class="p-footer">Thank You for Shopping With Us</div>
        <div class="p-footer">Please Visit Again</div>
        <div class="p-footer">Goods once sold cannot be returned</div>
        <div class="p-footer p-powered">Powered by Bill Mate POS System</div>`;
    }

    // Handle customer name for preview
    const customerName = typeof enrichedBill.customer === 'string' 
      ? enrichedBill.customer 
      : enrichedBill.customer?.name || "Walk-in Customer";
    const customerPhone = typeof enrichedBill.customer === 'string' 
      ? null 
      : enrichedBill.customer?.phone;

    return `
      <style>
        .preview-receipt { font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.55; color: #111; width: 280px; }
        .preview-receipt .p-shop { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 3px; }
        .preview-receipt .p-sub { text-align: center; font-size: 11px; }
        .preview-receipt .p-div { border-top: 1px dashed #999; margin: 5px 0; }
        .preview-receipt .p-div-solid { border-top: 1px solid #999; margin: 5px 0; }
        .preview-receipt .kv { display: flex; justify-content: space-between; font-size: 11.5px; }
        .preview-receipt .kv .v { text-align: right; max-width: 55%; word-break: break-word; }
        .preview-receipt .items-tbl { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 11px; }
        .preview-receipt .items-tbl th, .preview-receipt .items-tbl td { vertical-align: top; padding: 1px 1px; }
        .preview-receipt .items-tbl thead th { font-weight: bold; border-bottom: 1px dashed #999; padding-bottom: 3px; }
        .preview-receipt .p-name { width: 44%; text-align: left; word-break: break-word; }
        .preview-receipt .p-qty { width: 8%; text-align: right; }
        .preview-receipt .p-price { width: 22%; text-align: right; }
        .preview-receipt .p-total { width: 26%; text-align: right; }
        .preview-receipt .totals-tbl { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 11.5px; }
        .preview-receipt .totals-tbl td { padding: 1px 0; }
        .preview-receipt .totals-tbl .tl { text-align: left; }
        .preview-receipt .totals-tbl .tv { text-align: right; }
        .preview-receipt .grand td { font-weight: bold; font-size: 12.5px; padding-top: 3px; }
        .preview-receipt .p-footer { text-align: center; font-size: 11px; line-height: 1.7; }
        .preview-receipt .p-powered { font-size: 10px; color: #888; }
      </style>
      <div class="preview-receipt">
        <div class="p-shop">${escHtml(company?.companyPrintOutName || company?.companyName || "YOUR SHOP NAME")}</div>
        ${headerLines}
        <div class="p-div"></div>
        <div class="kv"><span>Bill No</span><span class="v">${escHtml(String(enrichedBill.billNumber))}</span></div>
        <div class="kv"><span>Date</span><span class="v">${formattedDate} ${formattedTime}</span></div>
        <div class="kv"><span>Customer</span><span class="v">${escHtml(customerName)}</span></div>
        ${customerPhone ? `<div class="kv"><span>Phone</span><span class="v">${escHtml(String(customerPhone))}</span></div>` : ""}
        <div class="p-div"></div>
        <table class="items-tbl">
          <thead>
            <tr>
              <th class="p-name">Item</th>
              <th class="p-qty">Qty</th>
              <th class="p-price">Price</th>
              <th class="p-total">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="p-div"></div>
        <table class="totals-tbl">
          ${Math.abs(calculatedSubtotal - subtotal) > 0.01 ? `<tr><td class="tl">Subtotal</td><td class="tv">${fmt(calculatedSubtotal)}</td></tr>` : ""}
          ${enrichedBill.discount ? `<tr><td class="tl">Discount (${enrichedBill.discount}%)</td><td class="tv">-${fmt(discountAmount)}</td></tr>` : ""}
        </table>
        <div class="p-div-solid"></div>
        <table class="totals-tbl grand"><tr><td class="tl">TOTAL</td><td class="tv">${fmt(finalTotal)}</td></tr></table>
        <div class="p-div"></div>
        <table class="totals-tbl">
          <tr><td class="tl">Payment</td><td class="tv">${escHtml((enrichedBill.paymentMethod || "CASH").toUpperCase())}</td></tr>
          <tr><td class="tl">Paid</td><td class="tv">${fmt(paid)}</td></tr>
          ${due > 0 ? `<tr><td class="tl">Due</td><td class="tv">${fmt(due)}</td></tr>` : ""}
        </table>
        <div class="p-div"></div>
        ${footerHtml}
        <div class="p-div"></div>
      </div>`;
  };

  const showPreviewModal = () => {
    const existing = document.getElementById("bill-preview-modal");
    if (existing) existing.remove();

    const mobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const androidDevice = /android/i.test(navigator.userAgent);
    const hasQZTray = typeof window.qz !== "undefined";
    const isNative = !!window.Capacitor?.isNativePlatform?.();

    const previewHtml = buildPreviewHtml();

    const btnBase = "flex:1;padding:14px;border-radius:8px;border:none;font-size:14px;font-weight:bold;cursor:pointer;min-height:52px;min-width:0;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.1);";

    let printButtons = `
      <button id="bpm-cancel" style="flex:1;padding:14px;border-radius:8px;border:1px solid #ddd;background:#f5f5f5;font-size:14px;color:#666;cursor:pointer;font-weight:600;min-height:52px;min-width:0;">Cancel</button>`;

    if (mobileDevice || androidDevice || isNative) {
      printButtons += `<button id="bpm-rawbt" style="${btnBase}background:#2c3e50;color:white;border:2px solid #1a2632;">🖨️ Print (RawBT)</button>`;
    } else if (hasQZTray) {
      printButtons += `<button id="bpm-qz" style="${btnBase}background:#0f766e;color:white;border:2px solid #0a5c55;">🖨️ Print (QZ Tray)</button>`;
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
      #bpm-cancel:hover { background:#e8e8e8 !important; }
    `;
    modal.appendChild(style);
    document.body.appendChild(modal);

    const closeModal = () => {
      document.getElementById("bill-preview-modal")?.remove();
      document.removeEventListener("keydown", handleKeyDown);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    document.getElementById("bpm-close")?.addEventListener("click", closeModal);
    document.getElementById("bpm-cancel")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById("bpm-qz")?.addEventListener("click", () => {
      closeModal();
      setTimeout(async () => printWithQZTray(await buildReceiptString()), 150);
    });

    document.getElementById("bpm-rawbt")?.addEventListener("click", () => {
      closeModal();
      setTimeout(async () => sendToRawBT(await buildReceiptString()), 150);
    });

    setTimeout(() => {
      (document.getElementById("bpm-rawbt") || document.getElementById("bpm-qz"))?.focus();
    }, 50);
  };

  showPreviewModal();
};