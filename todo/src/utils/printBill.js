export const handlePrintBill = (bill) => {
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

  const COL_NAME  = 22;
  const COL_QTY   =  4;
  const COL_PRICE =  9;
  const COL_TOTAL = 13;

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

  // ── Build ESC/POS receipt string ────────────────────────────────────────
  const buildReceiptString = () => {
    let p = "";
    p += FONT_NORMAL;
    p += ALIGN_CENTER;
    p += DOUBLE_WIDTH;
    p += "YOUR SHOP NAME" + "\n";
    p += FONT_NORMAL;
    p += "123 Main Street, City - 600001" + "\n";
    p += "Ph: +91 98765 43210" + "\n";
    p += "GST: 33ABCDE1234F1Z5" + "\n";
    p += SEPARATOR + "\n";
    p += ALIGN_LEFT;
    p += formatLine("Bill No:", bill.billNumber) + "\n";
    p += formatLine("Date:", formattedDate + " " + formattedTime) + "\n";
    p += formatLine("Customer:", bill.customer || "Walk-in Customer") + "\n";
    if (bill.customerPhone) {
      p += formatLine("Phone:", bill.customerPhone) + "\n";
    }
    p += SEPARATOR + "\n";
    p += formatItemRow("Item", "Qty", "Price", "Total", true) + "\n";
    p += SEPARATOR + "\n";

    let calculatedSubtotal = 0;
    if (bill.items && bill.items.length > 0) {
      bill.items.forEach((item) => {
        const name      = String(item.name || item.productName || "").substring(0, COL_NAME);
        const qty       = item.quantity;
        const price     = item.price;
        const itemTotal = price * qty;
        calculatedSubtotal += itemTotal;
        p += formatItemRow(name, qty, price, itemTotal) + "\n";
      });
    } else {
      p += centerText("No items found") + "\n";
    }

    p += SEPARATOR + "\n";
    if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
      p += formatLine("Subtotal:", fmt(calculatedSubtotal)) + "\n";
    }
    if (bill.discount) {
      p += formatLine(
        "Discount (" + bill.discount + "%):",
        "-" + fmt(discountAmount)
      ) + "\n";
    }

    const finalTotal = total || calculatedSubtotal - discountAmount;
    p += ALIGN_RIGHT;
    p += BOLD_ON + "TOTAL: " + fmt(finalTotal) + BOLD_OFF + "\n";
    p += ALIGN_LEFT;
    p += SEPARATOR + "\n";
    p += formatLine("Payment:", bill.paymentMethod?.toUpperCase() || "CASH") + "\n";
    p += formatLine("Paid:", fmt(paid)) + "\n";
    if (due > 0) {
      p += formatLine("Due:", fmt(due)) + "\n";
    }
    p += SEPARATOR + "\n";
    p += ALIGN_CENTER;
    p += "Thank You for Shopping With Us" + "\n";
    p += "Please Visit Again" + "\n";
    p += "Goods once sold cannot be returned" + "\n";
    p += "Powered by POS System" + "\n";
    p += SEPARATOR + "\n";
    p += ALIGN_LEFT;
    p += PAPER_CUT;
    return p;
  };

  // ── Send to RawBT — WebView + Browser compatible ────────────────────────
  //
  // ROOT CAUSE: WebView (Capacitor/Cordova/TWA) blocks window.location.href
  // for custom URI schemes like rawbt:// by default. The fix is to use an
  // invisible <a> tag with a click() — WebViews honour anchor-tag navigation
  // for custom schemes even when location.href is blocked.
  //
  // Strategy (in order of priority):
  //   1. Android WebView bridge  → window.Android.print()   (if you add it in native)
  //   2. Capacitor App plugin    → App.openUrl()             (if using Capacitor)
  //   3. Anchor-click trick      → works in most WebViews    ← primary fix
  //   4. window.location.href    → fallback for plain browser
  //
  const sendToRawBT = (receiptString) => {
    const encodedString = encodeURIComponent(receiptString);
    const intentUrl = `intent:${encodedString}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

    // ── Option 1: Native Android bridge (add this in your WebView activity) ──
    // In your Android WebViewClient:
    //   webView.addJavascriptInterface(new PrintBridge(this), "Android");
    // class PrintBridge { @JavascriptInterface public void print(String url){...} }
    if (window.Android && typeof window.Android.openUrl === "function") {
      try {
        window.Android.openUrl(intentUrl);
        return;
      } catch (e) {
        console.warn("Android bridge failed, trying next method:", e);
      }
    }

    // ── Option 2: Capacitor — use window.Capacitor global (no import needed) ──
    // Capacitor injects itself as window.Capacitor at runtime inside the APK.
    // We call the plugin bridge directly so Vite never tries to resolve a package.
    if (window.Capacitor?.isNativePlatform?.()) {
      try {
        window.Capacitor.Plugins?.App?.openUrl({ url: intentUrl });
        return;
      } catch (e) {
        console.warn("Capacitor App.openUrl failed, falling through:", e);
      }
    }

    // ── Option 3: Anchor-click trick (PRIMARY FIX for plain WebView APKs) ───
    // WebView respects <a href> navigation for custom schemes even when
    // window.location.href assignment is blocked.
    anchorClick(intentUrl);
  };

  const anchorClick = (url) => {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      // Clean up after a tick
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 500);
    } catch (error) {
      console.error("anchorClick failed, falling back to location.href:", error);
      // ── Option 4: Plain browser fallback ────────────────────────────────
      try {
        window.location.href = url;
      } catch (e) {
        alert("Failed to print. Please make sure RawBT app is installed.");
      }
    }
  };

  // ── Build plain-text preview lines ──────────────────────────────────────
  const buildPreviewLines = () => {
    const lines = [];
    let calculatedSubtotal = 0;
    if (bill.items && bill.items.length > 0) {
      bill.items.forEach((item) => {
        calculatedSubtotal += item.price * item.quantity;
      });
    }
    const finalTotal = total || calculatedSubtotal - discountAmount;

    lines.push({ text: "YOUR SHOP NAME",                             style: "shop-name" });
    lines.push({ text: "123 Main Street, City - 600001",             style: "center"    });
    lines.push({ text: "Ph: +91 98765 43210",                        style: "center"    });
    lines.push({ text: "GST: 33ABCDE1234F1Z5",                       style: "center"    });
    lines.push({ text: SEPARATOR,                                    style: "separator" });
    lines.push({ text: formatLine("Bill No:", bill.billNumber),      style: "normal"    });
    lines.push({ text: formatLine("Date:", formattedDate + " " + formattedTime), style: "normal" });
    lines.push({ text: formatLine("Customer:", bill.customer || "Walk-in Customer"), style: "normal" });
    if (bill.customerPhone) {
      lines.push({ text: formatLine("Phone:", bill.customerPhone),   style: "normal"    });
    }
    lines.push({ text: SEPARATOR,                                    style: "separator" });
    lines.push({ text: formatItemRow("Item", "Qty", "Price", "Total", false), style: "header-row" });
    lines.push({ text: SEPARATOR,                                    style: "separator" });

    if (bill.items && bill.items.length > 0) {
      bill.items.forEach((item) => {
        const name = String(item.name || item.productName || "").substring(0, COL_NAME);
        lines.push({
          text:  formatItemRow(name, item.quantity, item.price, item.price * item.quantity, false),
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
      lines.push({
        text:  formatLine("Discount (" + bill.discount + "%):", "-" + fmt(discountAmount)),
        style: "normal",
      });
    }
    lines.push({ text: "TOTAL: " + fmt(finalTotal),                  style: "total"     });
    lines.push({ text: SEPARATOR,                                    style: "separator" });
    lines.push({ text: formatLine("Payment:", bill.paymentMethod?.toUpperCase() || "CASH"), style: "normal" });
    lines.push({ text: formatLine("Paid:", fmt(paid)),               style: "normal"    });
    if (due > 0) {
      lines.push({ text: formatLine("Due:", fmt(due)),               style: "normal"    });
    }
    lines.push({ text: SEPARATOR,                                    style: "separator" });
    lines.push({ text: centerText("Thank You for Shopping With Us"), style: "center"    });
    lines.push({ text: centerText("Please Visit Again"),             style: "center"    });
    lines.push({ text: centerText("Goods once sold cannot be returned"), style: "center" });
    lines.push({ text: centerText("Powered by POS System"),          style: "center"    });
    lines.push({ text: SEPARATOR,                                    style: "separator" });
    return lines;
  };

  // ── Render preview modal ─────────────────────────────────────────────────
  const showPreviewModal = () => {
    const existing = document.getElementById("bill-preview-modal");
    if (existing) existing.remove();

    const lines = buildPreviewLines();

    const receiptRows = lines
      .map(({ text, style }) => {
        let extraStyle = "";
        if (style === "shop-name") {
          extraStyle = "font-size:16px;font-weight:bold;text-align:center;margin-bottom:4px;";
        } else if (style === "center") {
          extraStyle = "text-align:center;color:#555;margin:2px 0;";
        } else if (style === "separator") {
          extraStyle = "color:#ccc;letter-spacing:0;margin:4px 0;";
        } else if (style === "header-row") {
          extraStyle = "font-weight:bold;background:#f0f0f0;margin:2px 0;padding:2px 0;";
        } else if (style === "total") {
          extraStyle = "font-weight:bold;text-align:right;font-size:14px;margin:4px 0;padding-top:2px;";
        }
        const escapedText = text.replace(/[&<>]/g, (m) =>
          m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"
        );
        return `<div style="white-space:pre;font-family:'Courier New',Courier,monospace;font-size:12px;line-height:1.5;${extraStyle}">${escapedText}</div>`;
      })
      .join("");

    const modal = document.createElement("div");
    modal.id = "bill-preview-modal";

    // ── IMPORTANT for APK: use touchstart to close modal, not just click ──
    // Some WebViews swallow click events on the backdrop. touchstart is safer.
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      -webkit-overflow-scrolling: touch;
    `;

    modal.innerHTML = `
      <div id="bill-preview-inner" style="
        background: #fff; border-radius: 16px;
        width: 100%; max-width: 520px; max-height: 90vh;
        display: flex; flex-direction: column;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        overflow: hidden;
      ">
        <div style="
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #e5e5e5;
          flex-shrink: 0; background: #fff;
        ">
          <span style="font-size:16px;font-weight:600;color:#111;">Print Preview</span>
          <button id="bill-preview-close" style="
            background:none;border:none;cursor:pointer;
            font-size:28px;color:#999;line-height:1;padding:0 6px;
            min-width:44px;min-height:44px;
          ">&times;</button>
        </div>

        <div style="
          overflow-y: auto; padding: 20px;
          background: #f8f8f8; flex: 1;
          -webkit-overflow-scrolling: touch;
        ">
          <div style="
            background: white; border-radius: 8px;
            padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow-x: auto;
          ">
            ${receiptRows}
          </div>
        </div>

        <div style="
          display: flex; gap: 12px; padding: 16px 20px;
          border-top: 1px solid #e5e5e5; flex-shrink: 0;
          background: #fff;
          padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
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

    // Close on backdrop tap — use both click and touchend for WebView safety
    const handleBackdropTap = (e) => {
      if (e.target === modal) closeModal();
    };
    modal.addEventListener("click", handleBackdropTap);
    modal.addEventListener("touchend", handleBackdropTap);

    document.getElementById("bill-preview-print")?.addEventListener("click", () => {
      closeModal();
      setTimeout(() => sendToRawBT(buildReceiptString()), 150);
    });
  };

  showPreviewModal();
};