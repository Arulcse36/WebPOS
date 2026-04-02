import RNPrint from 'react-native-print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import axios from 'axios';

const API_URL = 'http://your-server-ip:5000/api'; // Replace with your server IP

class PrintService {
  // Currency formatter (matches your backend)
  formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Generate HTML bill content
  generateBillHTML = (bill, showPrintButton = false) => {
    const billDate = new Date(bill.billDate || bill.date);
    const formattedDate = billDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const formattedTime = billDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Calculate totals if not present
    const subtotal = bill.subtotal || 
      bill.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const discountAmount = bill.discountAmount || 
      (bill.discount ? (subtotal * bill.discount / 100) : 0);
    const total = bill.total || (subtotal - discountAmount);
    const paidAmount = bill.paidAmount || bill.paid || 0;
    const dueAmount = bill.dueAmount || bill.due || (total - paidAmount);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill #${bill.billNumber}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', 'Lucida Console', monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
              padding: 4px;
              background: white;
              color: black;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 2mm;
              }
              .no-print {
                display: none;
              }
            }
            
            .header {
              text-align: center;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 1px dashed #000;
            }
            
            .shop-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .shop-address {
              font-size: 10px;
              margin-bottom: 2px;
            }
            
            .shop-phone {
              font-size: 10px;
            }
            
            .bill-info {
              margin-bottom: 8px;
              padding: 4px 0;
              border-bottom: 1px dotted #000;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 10px;
            }
            
            .info-label {
              font-weight: bold;
            }
            
            .items-table {
              width: 100%;
              margin-bottom: 8px;
              border-collapse: collapse;
            }
            
            .items-table th {
              text-align: left;
              font-size: 10px;
              padding: 4px 0;
              border-bottom: 1px solid #000;
              font-weight: bold;
            }
            
            .items-table td {
              padding: 3px 0;
              font-size: 10px;
              vertical-align: top;
            }
            
            .item-name {
              max-width: 40mm;
              word-wrap: break-word;
              white-space: normal;
            }
            
            .item-qty {
              text-align: center;
              width: 12mm;
            }
            
            .item-price {
              text-align: right;
              width: 15mm;
            }
            
            .item-total {
              text-align: right;
              width: 15mm;
            }
            
            .totals {
              margin: 8px 0;
              padding-top: 4px;
              border-top: 1px dashed #000;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 10px;
            }
            
            .grand-total {
              font-size: 12px;
              font-weight: bold;
              margin-top: 4px;
              padding-top: 4px;
              border-top: 1px solid #000;
            }
            
            .payment-info {
              margin: 8px 0;
              padding: 4px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
            }
            
            .footer {
              text-align: center;
              margin-top: 8px;
              padding-top: 4px;
              font-size: 9px;
              border-top: 1px dashed #000;
            }
            
            .thankyou {
              font-size: 11px;
              font-weight: bold;
              margin: 6px 0;
            }
            
            .cut-line {
              text-align: center;
              margin: 6px 0;
              font-size: 8px;
              letter-spacing: 2px;
            }
            
            .qr-code {
              text-align: center;
              margin: 10px 0;
              font-family: monospace;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">YOUR SHOP NAME</div>
            <div class="shop-address">123 Main Street, City - 600001</div>
            <div class="shop-phone">📞 +91 98765 43210 | GST: 33ABCDE1234F1Z5</div>
          </div>
          
          <div class="bill-info">
            <div class="info-row">
              <span class="info-label">Bill No:</span>
              <span>${bill.billNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span>${formattedTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Customer:</span>
              <span>${bill.customer?.name || bill.customerName || "Walk-in Customer"}</span>
            </div>
            ${(bill.customer?.phone || bill.customerPhone) ? `
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span>${bill.customer?.phone || bill.customerPhone}</span>
            </div>
            ` : ''}
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th class="item-name">Item</th>
                <th class="item-qty">Qty</th>
                <th class="item-price">Price</th>
                <th class="item-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items?.map(item => `
                <tr>
                  <td class="item-name">${item.name || item.productName}</td>
                  <td class="item-qty">${item.quantity}</td>
                  <td class="item-price">${this.formatCurrency(item.price)}</td>
                  <td class="item-total">${this.formatCurrency(item.price * item.quantity)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4" style="text-align:center">No items</td></tr>'}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${this.formatCurrency(subtotal)}</span>
            </div>
            ${bill.discount ? `
            <div class="total-row">
              <span>Discount (${bill.discount}%):</span>
              <span>-${this.formatCurrency(discountAmount)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span><strong>TOTAL:</strong></span>
              <span><strong>${this.formatCurrency(total)}</strong></span>
            </div>
          </div>
          
          <div class="payment-info">
            <div class="total-row">
              <span>Payment Method:</span>
              <span>${(bill.paymentMethod || 'CASH').toUpperCase()}</span>
            </div>
            <div class="total-row">
              <span>Amount Paid:</span>
              <span>${this.formatCurrency(paidAmount)}</span>
            </div>
            ${bill.cashPaid > 0 ? `
            <div class="total-row">
              <span>Cash:</span>
              <span>${this.formatCurrency(bill.cashPaid)}</span>
            </div>
            ` : ''}
            ${bill.upiPaid > 0 ? `
            <div class="total-row">
              <span>UPI:</span>
              <span>${this.formatCurrency(bill.upiPaid)}</span>
            </div>
            ` : ''}
            ${dueAmount > 0 ? `
            <div class="total-row">
              <span>Due Amount:</span>
              <span style="color: red;">${this.formatCurrency(dueAmount)}</span>
            </div>
            ` : ''}
          </div>
          
          ${bill.notes ? `
          <div class="footer" style="margin-top: 8px;">
            <div><strong>Notes:</strong> ${bill.notes}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <div class="thankyou">✨ THANK YOU! ✨</div>
            <div>Visit Again!</div>
            <div style="margin-top: 4px;">* Goods once sold cannot be returned *</div>
            <div style="margin-top: 4px;">Powered by POS System</div>
          </div>
          
          <div class="cut-line">
            - - - - - - - - - - - - - - - - - - - - - - - - -
          </div>
          
          ${showPrintButton ? `
          <div class="no-print" style="text-align: center; margin-top: 10px;">
            <button onclick="window.print()" style="padding: 8px 16px; margin: 5px; font-size: 12px;">🖨️ Print</button>
            <button onclick="window.close()" style="padding: 8px 16px; margin: 5px; font-size: 12px;">❌ Close</button>
          </div>
          ` : ''}
        </body>
      </html>
    `;
  };

  // Direct print using RNPrint
  printBill = async (bill) => {
    try {
      const html = this.generateBillHTML(bill, false);
      
      await RNPrint.print({
        html: html,
        printerURL: null,
        jobName: `Bill_${bill.billNumber}`,
      });
      
      // Update print status in backend
      await this.updatePrintStatus(bill._id);
      
      return { success: true, message: 'Bill printed successfully' };
    } catch (error) {
      console.error('Print error:', error);
      throw new Error('Failed to print. Please check printer connection.');
    }
  };

  // Save as PDF
  saveAsPDF = async (bill) => {
    try {
      const html = this.generateBillHTML(bill, false);
      const fileName = `Bill_${bill.billNumber}_${Date.now()}`;
      
      const options = {
        html: html,
        fileName: fileName,
        directory: 'Documents',
      };
      
      const pdf = await RNHTMLtoPDF.convert(options);
      
      return {
        success: true,
        filePath: pdf.filePath,
        fileName: fileName
      };
    } catch (error) {
      console.error('PDF creation error:', error);
      throw new Error('Failed to create PDF');
    }
  };

  // Share bill
  shareBill = async (bill) => {
    try {
      const pdfResult = await this.saveAsPDF(bill);
      
      await Share.open({
        url: `file://${pdfResult.filePath}`,
        type: 'application/pdf',
        title: `Bill ${bill.billNumber}`,
        message: `Please find attached bill #${bill.billNumber}`,
      });
      
      return { success: true, message: 'Bill shared successfully' };
    } catch (error) {
      console.error('Share error:', error);
      throw new Error('Failed to share bill');
    }
  };

  // Email bill
  emailBill = async (bill, email) => {
    try {
      const pdfResult = await this.saveAsPDF(bill);
      
      // Read PDF file
      const pdfBase64 = await RNFS.readFile(pdfResult.filePath, 'base64');
      
      // Send to backend for email
      const response = await axios.post(`${API_URL}/bills/${bill._id}/email`, {
        email: email,
        pdfBase64: pdfBase64,
        billNumber: bill.billNumber
      });
      
      return { success: true, message: 'Bill sent via email' };
    } catch (error) {
      console.error('Email error:', error);
      throw new Error('Failed to send email');
    }
  };

  // WhatsApp bill
  whatsappBill = async (bill, phoneNumber) => {
    try {
      const pdfResult = await this.saveAsPDF(bill);
      
      // Create WhatsApp URL with file
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=Please find attached bill #${bill.billNumber}`;
      
      // For sharing file, we need to use Share API
      await Share.open({
        url: `file://${pdfResult.filePath}`,
        type: 'application/pdf',
        title: `Bill ${bill.billNumber}`,
      });
      
      return { success: true, message: 'Bill shared via WhatsApp' };
    } catch (error) {
      console.error('WhatsApp error:', error);
      throw new Error('Failed to share on WhatsApp');
    }
  };

  // Update print status in backend
  updatePrintStatus = async (billId) => {
    try {
      await axios.patch(`${API_URL}/bills/${billId}/print`, {
        printed: true,
        printedAt: new Date(),
        printCount: 1
      });
    } catch (error) {
      console.error('Error updating print status:', error);
    }
  };

  // Bulk print multiple bills
  printMultipleBills = async (bills) => {
    const results = [];
    
    for (const bill of bills) {
      try {
        await this.printBill(bill);
        results.push({ billNumber: bill.billNumber, success: true });
        // Small delay between prints
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.push({ billNumber: bill.billNumber, success: false, error: error.message });
      }
    }
    
    return results;
  };

  // Preview bill in modal
  previewBill = (bill, onPrint, onClose) => {
    const html = this.generateBillHTML(bill, true);
    // You can use WebView to show preview
    return html;
  };
}

export default new PrintService();