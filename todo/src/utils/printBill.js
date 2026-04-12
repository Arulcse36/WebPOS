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

export const handlePrintBill = async (bill) => {
  const company = await fetchCompanyDetails();

  const subtotal =
    bill.subtotal ||
    bill.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
    0;
  const discountAmount =
    bill.discountAmount ||
    (bill.discount ? (subtotal * bill.discount) / 100 : 0);
  const total = bill.total || subtotal - discountAmount;
  const paid = bill.paid || 0;
  const due = bill.due || total - paid;

  const fmt = (num) => Number(num).toFixed(2);

  const printDate = new Date(bill.date);
  const formattedDate = printDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = printDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // ── ESC/POS control codes ────────────────────────────────────────────────
  const ESC = "\x1B";
  const GS  = "\x1D";
  const BOLD_ON      = ESC + "E" + "\x01";
  const BOLD_OFF     = ESC + "E" + "\x00";
  const DOUBLE_WIDTH = GS  + "!" + "\x10";
  const FONT_NORMAL  = GS  + "!" + "\x00";
  const ALIGN_RIGHT  = ESC + "a" + "\x02";
  const ALIGN_LEFT   = ESC + "a" + "\x00";
  const ALIGN_CENTER = ESC + "a" + "\x01";
  const PAPER_CUT    = GS  + "V" + "\x41" + "\x00";

  // ── 3-inch (80mm) thermal roll = 48 chars wide at standard Font A ────────
  // NOTE: 2-inch (58mm) = 32 chars | 3-inch (80mm) = 48 chars
  const LINE_WIDTH = 48;
  const SEPARATOR  = "-".repeat(LINE_WIDTH);

  const centerText = (text) => {
    const s = String(text);
    const pad = Math.max(0, Math.floor((LINE_WIDTH - s.length) / 2));
    return " ".repeat(pad) + s;
  };

  const formatLine = (left, right) => {
    const l = String(left);
    const r = String(right);
    const spaces = Math.max(1, LINE_WIDTH - l.length - r.length);
    return l + " ".repeat(spaces) + r;
  };

  // Column widths — must sum to LINE_WIDTH (48)
  // COL_NAME(20) + COL_QTY(4) + COL_PRICE(10) + COL_TOTAL(14) = 48
  const COL_NAME  = 20;
  const COL_QTY   =  4;
  const COL_PRICE = 10;
  const COL_TOTAL = 14;

  // For ESC/POS printer — header gets BOLD_ON/OFF bytes
  const formatItemRow = (name, qty, price, total, isHeader = false) => {
    const nameStr  = String(name).substring(0, COL_NAME).padEnd(COL_NAME);
    const rawQty   = String(qty);
    const qtyStr   = rawQty.length > COL_QTY
      ? rawQty.substring(rawQty.length - COL_QTY)
      : rawQty.padStart(COL_QTY);
    const rawPrice = String(isHeader ? price : fmt(price));
    const rawTotal = String(isHeader ? total : fmt(total));
    const priceStr = rawPrice.length > COL_PRICE
      ? rawPrice.substring(rawPrice.length - COL_PRICE)
      : rawPrice.padStart(COL_PRICE);
    const totalStr = rawTotal.length > COL_TOTAL
      ? rawTotal.substring(rawTotal.length - COL_TOTAL)
      : rawTotal.padStart(COL_TOTAL);
    const line = nameStr + qtyStr + priceStr + totalStr;
    return isHeader ? BOLD_ON + line + BOLD_OFF : line;
  };

  // For HTML preview — identical layout, zero ESC/POS bytes
  const formatItemRowPlain = (name, qty, price, total, isHeader = false) => {
    const nameStr  = String(name).substring(0, COL_NAME).padEnd(COL_NAME);
    const rawQty   = String(qty);
    const qtyStr   = rawQty.length > COL_QTY
      ? rawQty.substring(rawQty.length - COL_QTY)
      : rawQty.padStart(COL_QTY);
    const rawPrice = String(isHeader ? price : fmt(price));
    const rawTotal = String(isHeader ? total : fmt(total));
    const priceStr = rawPrice.length > COL_PRICE
      ? rawPrice.substring(rawPrice.length - COL_PRICE)
      : rawPrice.padStart(COL_PRICE);
    const totalStr = rawTotal.length > COL_TOTAL
      ? rawTotal.substring(rawTotal.length - COL_TOTAL)
      : rawTotal.padStart(COL_TOTAL);
    return nameStr + qtyStr + priceStr + totalStr;
  };

  // ── Build ESC/POS receipt string (printer) ───────────────────────────────
  const buildReceiptString = () => {
    let p = "";
    p += FONT_NORMAL;
    p += ALIGN_CENTER;
    p += DOUBLE_WIDTH;
    p += (company?.companyPrintOutName || company?.companyName || "YOUR SHOP NAME") + "\n";
    p += FONT_NORMAL;
    if (company?.headerLine1) p += company.headerLine1 + "\n";
    if (company?.headerLine2) p += company.headerLine2 + "\n";
    if (company?.headerLine3) p += company.headerLine3 + "\n";
    p += SEPARATOR + "\n";
    p += ALIGN_LEFT;
    p += formatLine("Bill No:", bill.billNumber) + "\n";
    p += formatLine("Date:", formattedDate + " " + formattedTime) + "\n";
    p += formatLine("Customer:", bill.customer || "Walk-in Customer") + "\n";
    if (bill.customerPhone) p += formatLine("Phone:", bill.customerPhone) + "\n";
    p += SEPARATOR + "\n";
    p += formatItemRow("Item", "Qty", "Price", "Total", true) + "\n";
    p += SEPARATOR + "\n";

    let calculatedSubtotal = 0;
    if (bill.items && bill.items.length > 0) {
      bill.items.forEach((item) => {
        const name      = String(item.name || item.productName || "").substring(0, COL_NAME);
        const itemTotal = item.price * item.quantity;
        calculatedSubtotal += itemTotal;
        p += formatItemRow(name, item.quantity, item.price, itemTotal) + "\n";
      });
    } else {
      p += centerText("No items found") + "\n";
    }

    p += SEPARATOR + "\n";
    if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
      p += formatLine("Subtotal:", fmt(calculatedSubtotal)) + "\n";
    }
    if (bill.discount) {
      p += formatLine("Discount (" + bill.discount + "%):", "-" + fmt(discountAmount)) + "\n";
    }
    const finalTotal = total || calculatedSubtotal - discountAmount;
    p += ALIGN_RIGHT;
    p += BOLD_ON + "TOTAL: " + fmt(finalTotal) + BOLD_OFF + "\n";
    p += ALIGN_LEFT;
    p += SEPARATOR + "\n";
    p += formatLine("Payment:", bill.paymentMethod?.toUpperCase() || "CASH") + "\n";
    p += formatLine("Paid:", fmt(paid)) + "\n";
    if (due > 0) p += formatLine("Due:", fmt(due)) + "\n";
    p += SEPARATOR + "\n";
    p += ALIGN_CENTER;
    if (company?.footer) {
      company.footer.split("\n").forEach(line => {
        if (line.trim()) p += line.trim() + "\n";
      });
    } else {
      p += "Thank You for Shopping With Us" + "\n";
      p += "Please Visit Again" + "\n";
      p += "Goods once sold cannot be returned" + "\n";
      p += "Powered by Bill Mate POS System" + "\n";
    }
    p += SEPARATOR + "\n";
    p += ALIGN_LEFT;
    p += PAPER_CUT;
    return p;
  };

  // ── Send to RawBT ────────────────────────────────────────────────────────
  const sendToRawBT = (receiptString) => {
    const encodedString = encodeURIComponent(receiptString);
    const intentUrl = `intent:${encodedString}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

    if (window.Android && typeof window.Android.openUrl === "function") {
      try { window.Android.openUrl(intentUrl); return; }
      catch (e) { console.warn("Android bridge failed:", e); }
    }
    if (window.Capacitor?.isNativePlatform?.()) {
      try { window.Capacitor.Plugins?.App?.openUrl({ url: intentUrl }); return; }
      catch (e) { console.warn("Capacitor openUrl failed:", e); }
    }
    anchorClick(intentUrl);
  };

  const anchorClick = (url) => {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 500);
    } catch (error) {
      try { window.location.href = url; }
      catch (e) { alert("Failed to print. Please make sure RawBT app is installed."); }
    }
  };

  // ── Build plain-text preview lines (zero ESC/POS bytes) ─────────────────
  const buildPreviewLines = () => {
    const lines = [];
    let calculatedSubtotal = 0;
    if (bill.items && bill.items.length > 0) {
      bill.items.forEach((item) => { calculatedSubtotal += item.price * item.quantity; });
    }
    const finalTotal = total || calculatedSubtotal - discountAmount;

    lines.push({ text: company?.companyPrintOutName || company?.companyName || "YOUR SHOP NAME", style: "shop-name" });
    if (company?.headerLine1) lines.push({ text: company.headerLine1, style: "center" });
    if (company?.headerLine2) lines.push({ text: company.headerLine2, style: "center" });
    if (company?.headerLine3) lines.push({ text: company.headerLine3, style: "center" });
    lines.push({ text: SEPARATOR, style: "separator" });
    lines.push({ text: formatLine("Bill No:", bill.billNumber), style: "normal" });
    lines.push({ text: formatLine("Date:", formattedDate + " " + formattedTime), style: "normal" });
    lines.push({ text: formatLine("Customer:", bill.customer || "Walk-in Customer"), style: "normal" });
    if (bill.customerPhone) lines.push({ text: formatLine("Phone:", bill.customerPhone), style: "normal" });
    lines.push({ text: SEPARATOR, style: "separator" });
    lines.push({ text: formatItemRowPlain("Item", "Qty", "Price", "Total", true), style: "header-row" });
    lines.push({ text: SEPARATOR, style: "separator" });

    if (bill.items && bill.items.length > 0) {
      bill.items.forEach((item) => {
        const name = String(item.name || item.productName || "").substring(0, COL_NAME);
        lines.push({
          text: formatItemRowPlain(name, item.quantity, item.price, item.price * item.quantity, false),
          style: "normal",
        });
      });
    } else {
      lines.push({ text: centerText("No items found"), style: "normal" });
    }

    lines.push({ text: SEPARATOR, style: "separator" });
    if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
      lines.push({ text: formatLine("Subtotal:", fmt(calculatedSubtotal)), style: "normal" });
    }
    if (bill.discount) {
      lines.push({ text: formatLine("Discount (" + bill.discount + "%):", "-" + fmt(discountAmount)), style: "normal" });
    }
    lines.push({ text: formatLine("TOTAL:", fmt(finalTotal)), style: "total" });
    lines.push({ text: SEPARATOR, style: "separator" });
    lines.push({ text: formatLine("Payment:", bill.paymentMethod?.toUpperCase() || "CASH"), style: "normal" });
    lines.push({ text: formatLine("Paid:", fmt(paid)), style: "normal" });
    if (due > 0) lines.push({ text: formatLine("Due:", fmt(due)), style: "normal" });
    lines.push({ text: SEPARATOR, style: "separator" });

    if (company?.footer) {
      company.footer.split("\n").forEach(line => {
        if (line.trim()) lines.push({ text: centerText(line.trim()), style: "center" });
      });
    } else {
      lines.push({ text: centerText("Thank You for Shopping With Us"), style: "center" });
      lines.push({ text: centerText("Please Visit Again"), style: "center" });
      lines.push({ text: centerText("Goods once sold cannot be returned"), style: "center" });
      lines.push({ text: centerText("Powered by Bill Mate POS System"), style: "center" });
    }
    lines.push({ text: SEPARATOR, style: "separator" });
    return lines;
  };

  // ── Render preview modal ─────────────────────────────────────────────────
  const showPreviewModal = () => {
    const existing = document.getElementById("bill-preview-modal");
    if (existing) existing.remove();

    const lines = buildPreviewLines();

    const receiptRows = lines
      .map(({ text, style }) => {
        // Base styles for every row — locked to 48ch width
        let divStyle = [
          "white-space:pre",
          "font-family:'Courier New',Courier,monospace",
          "font-size:12px",
          "line-height:1.55",
          "display:block",
          "width:48ch",          // locked to exactly 48 monospace chars
        ];

        if (style === "shop-name") {
          divStyle.push("font-weight:bold", "text-align:center", "width:48ch", "margin-bottom:2px");
        } else if (style === "center") {
          divStyle.push("text-align:center", "color:#444", "width:48ch", "margin:1px 0");
        } else if (style === "separator") {
          divStyle.push("color:#bbb", "margin:3px 0");
        } else if (style === "header-row") {
          divStyle.push("font-weight:bold", "background:#f5f5f5", "padding:2px 0");
        } else if (style === "total") {
          divStyle.push("font-weight:bold");
        }

        const escapedText = text.replace(/[&<>]/g, (m) =>
          m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"
        );
        return `<div style="${divStyle.join(";")}">${escapedText}</div>`;
      })
      .join("");

    const modal = document.createElement("div");
    modal.id = "bill-preview-modal";
    modal.style.cssText = `
      position:fixed; inset:0; z-index:99999;
      background:rgba(0,0,0,0.65);
      display:flex; align-items:center; justify-content:center;
      padding:16px;
      -webkit-overflow-scrolling:touch;
    `;

    modal.innerHTML = `
      <div id="bill-preview-inner" style="
        background:#fff; border-radius:16px;
        width:100%; max-width:560px; max-height:90vh;
        display:flex; flex-direction:column;
        box-shadow:0 20px 40px rgba(0,0,0,0.2);
        overflow:hidden;
      ">
        <div style="
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 20px; border-bottom:1px solid #e5e5e5;
          flex-shrink:0; background:#fff;
        ">
          <span style="font-size:16px;font-weight:600;color:#111;">Print Preview</span>
          <button id="bill-preview-close" style="
            background:none;border:none;cursor:pointer;
            font-size:26px;color:#999;line-height:1;
            min-width:40px;min-height:40px;padding:0;
          ">&times;</button>
        </div>

        <div style="
          overflow-y:auto; padding:16px;
          background:#f0f0f0; flex:1;
          -webkit-overflow-scrolling:touch;
          display:flex; justify-content:center;
        ">
          <!-- Receipt card sized to content (48ch rows) -->
          <div style="
            background:white; border-radius:8px;
            padding:16px 20px;
            box-shadow:0 1px 4px rgba(0,0,0,0.12);
            display:inline-block;
          ">
            ${receiptRows}
          </div>
        </div>

        <div style="
          display:flex; gap:12px; padding:14px 20px;
          border-top:1px solid #e5e5e5; flex-shrink:0; background:#fff;
          padding-bottom:calc(14px + env(safe-area-inset-bottom, 0px));
        ">
          <button id="bill-preview-cancel" style="
            flex:1;padding:12px;border-radius:8px;
            border:1px solid #ddd;background:white;
            font-size:14px;color:#666;cursor:pointer;
            font-weight:500;min-height:48px;
          ">Cancel</button>
          <button id="bill-preview-print" style="
            flex:2;padding:12px;border-radius:8px;
            border:none;background:#1a1a1a;
            font-size:14px;color:white;cursor:pointer;
            font-weight:600;min-height:48px;
          ">🖨 Print Receipt</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      const el = document.getElementById("bill-preview-modal");
      if (el) el.remove();
    };

    document.getElementById("bill-preview-close")?.addEventListener("click", closeModal);
    document.getElementById("bill-preview-cancel")?.addEventListener("click", closeModal);

    const handleBackdropTap = (e) => { if (e.target === modal) closeModal(); };
    modal.addEventListener("click", handleBackdropTap);
    modal.addEventListener("touchend", handleBackdropTap);

    document.getElementById("bill-preview-print")?.addEventListener("click", () => {
      closeModal();
      setTimeout(() => sendToRawBT(buildReceiptString()), 150);
    });
  };

  showPreviewModal();
};