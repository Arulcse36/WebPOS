import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { formatDateTime, formatForInput, formatCurrency, formatQuantityDisplay } from '../utils/formatters';
import { roundToTwoDecimals } from '../utils/mathHelpers';
import { handlePrintBill } from '../utils/printBill';

// On reprint button click:
<button onClick={() => handlePrintBill(bill)}>Reprint</button>

// Dynamic API URL - works on both mobile and desktop
const API = import.meta.env.VITE_API_URL;

const Reports = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({
    grandTotal: 0,
    totalPaid: 0,
    totalDue: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Customer filter states
  const [customerFilter, setCustomerFilter] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Payment history modal states
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedBillForHistory, setSelectedBillForHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ✅ Set default dates when switching to custom
  useEffect(() => {
    if (type === "custom") {
      const today = new Date().toISOString().split("T")[0];
      setFrom(today);
      setTo(today);
    }
  }, [type]);

  // ✅ Fetch unique customers for filter
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await axios.get(`${API}/bills/customers`, {
        timeout: 10000
      });
      if (response.data.success) {
        setCustomers(response.data.customers);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API}/reports/bills?type=${type}`;

      if (type === "custom") {
        if (!from || !to) {
          alert("Please select date range");
          setLoading(false);
          return;
        }
        url += `&from=${from}&to=${to}`;
      }

      // Add customer filter if selected
      if (customerFilter) {
        url += `&customer=${encodeURIComponent(customerFilter)}`;
      }

      console.log("Fetching from URL:", url);
      
      const res = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log("Response received:", res.data);
      
      // Format amounts to 2 decimal places
      const formattedSummary = {
        grandTotal: roundToTwoDecimals(res.data.summary?.grandTotal || 0),
        totalPaid: roundToTwoDecimals(res.data.summary?.totalPaid || 0),
        totalDue: roundToTwoDecimals(res.data.summary?.totalDue || 0)
      };
      
      // Ensure each bill has an ID and formatted amounts
      const billsWithIds = (res.data.bills || []).map(bill => {
        return {
          ...bill,
          _id: bill._id || bill.id || bill.billId,
          originalId: bill._id || bill.id,
          total: roundToTwoDecimals(bill.total || 0),
          paid: roundToTwoDecimals(bill.paid || 0),
          due: roundToTwoDecimals(bill.due || 0),
          subtotal: roundToTwoDecimals(bill.subtotal || 0),
          discountAmount: roundToTwoDecimals(bill.discountAmount || 0)
        };
      });
      
      setBills(billsWithIds);
      setSummary(formattedSummary);
    } catch (err) {
      console.error("Fetch error:", err);
      
      let errorMessage = "Failed to load report. ";
      
      if (err.code === 'ECONNABORTED') {
        errorMessage += "Request timeout. Please check your connection.";
      } else if (err.message === 'Network Error') {
        errorMessage += "Network error. Make sure your mobile is connected to the same network as the server.\n\n";
        errorMessage += "If using localhost, try using your computer's IP address instead.\n";
        errorMessage += `Current API: ${API}`;
      } else if (err.response) {
        errorMessage += `Server error: ${err.response.status}`;
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [type, from, to, customerFilter]);

  // ✅ Format date → 22-Mar-2026
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // ✅ Handle edit bill - Navigate to POS with edit mode
  const handleEditBill = (bill) => {
    const billId = bill._id || bill.id || bill.billId;
    
    if (!billId) {
      alert("Cannot edit this bill: No ID found. Please check the bill data.");
      return;
    }
    
    navigate(`/pos/edit/${billId}`);
  };

  // ✅ Handle delete bill
  const handleDeleteBill = async (bill) => {
    const billId = bill._id || bill.id || bill.billId;
    
    if (!billId) {
      alert("Invalid bill ID");
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete bill #${bill.billNumber}?`)) {
      try {
        const response = await axios.delete(`${API}/bills/${billId}`, {
          timeout: 10000
        });
        
        if (response.data.success) {
          alert("Bill deleted successfully!");
          fetchReport(); // Refresh the report
        } else {
          alert("Failed to delete bill");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to delete bill. Error: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // ✅ Handle view bill details
  const handleViewBill = (bill) => {
    const message = `
      Bill #${bill.billNumber}
      ID: ${bill._id || bill.id || 'N/A'}
      Date: ${formatDate(bill.date)}
      Customer: ${bill.customer || "Walk-in"}
      Total: ${formatCurrency(bill.total)}
      Paid: ${formatCurrency(bill.paid)}
      Due: ${formatCurrency(bill.due)}
      Payment: ${bill.paymentMethod}
      ${bill.items ? `Items: ${bill.items.length}` : ''}
    `;
    alert(message);
  };

  // ✅ Handle print bill - Using the imported handlePrintBill
  const handlePrintBillWeb = (bill) => {
    handlePrintBill(bill);
  };

const handlePrintPaymentHistory = () => {
  if (!selectedBillForHistory) return;

  const ESC = '\x1B';
  const GS  = '\x1D';

  // ── Printer commands ────────────────────────────────────────────────────
  const INIT        = ESC + '@';
  const BOLD_ON     = ESC + 'E' + '\x01';
  const BOLD_OFF    = ESC + 'E' + '\x00';
  const ALIGN_LEFT  = ESC + 'a' + '\x00';
  const ALIGN_CTR   = ESC + 'a' + '\x01';
  const FONT_NORMAL = GS  + '!' + '\x00';
  const FONT_DBLH   = GS  + '!' + '\x10';
  const PAPER_CUT   = GS  + 'V' + '\x41' + '\x00';

  const LINE_WIDTH = 48;
  const SEP        = '-'.repeat(LINE_WIDTH);
  const SEP2       = '='.repeat(LINE_WIDTH);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const left = (text) => {
    const s = String(text);
    return s.substring(0, LINE_WIDTH) + '\n';
  };

  const twoCol = (l, r, width = LINE_WIDTH) => {
    const ls = String(l);
    const rs = String(r);
    const spaces = Math.max(1, width - ls.length - rs.length);
    return ls + ' '.repeat(spaces) + rs + '\n';
  };

  const fmtAmt = (amt) => {
    const n = Number(amt);
    return isNaN(n) ? '0.00' : n.toFixed(2);
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

  // ── Build receipt ─────────────────────────────────────────────────────────
  let p = '';
  p += INIT;
  p += FONT_NORMAL;

  // ── HEADER ───────────────────────────────────────────────────────────────
  p += ALIGN_CTR;
  p += FONT_DBLH;
  p += 'YOUR SHOP NAME\n';
  p += FONT_NORMAL;
  p += '123 Main Street, City - 600001\n';
  p += 'Ph: +91 98765 43210\n';
  p += 'GST: 33ABCDE1234F1Z5\n';
  p += SEP + '\n';
  p += BOLD_ON + 'PAYMENT HISTORY\n' + BOLD_OFF;
  p += SEP + '\n';

  // ── BILL INFO ─────────────────────────────────────────────────────────────
  p += ALIGN_LEFT;
  p += BOLD_ON + 'BILL INFORMATION\n' + BOLD_OFF;
  p += SEP + '\n';
  p += twoCol('Bill No:', selectedBillForHistory.billNumber);
  p += twoCol('Date:', fmtDate(new Date()));
  p += twoCol('Time:', fmtTime(new Date()));
  p += twoCol(
    'Customer:',
    String(selectedBillForHistory.customer || 'Walk-in Customer').substring(0, 24)
  );
  if (selectedBillForHistory.customerPhone) {
    p += twoCol('Phone:', selectedBillForHistory.customerPhone);
  }
  p += SEP + '\n';

  // ── PAYMENT SUMMARY ───────────────────────────────────────────────────────
  p += ALIGN_LEFT;
  p += BOLD_ON + 'PAYMENT SUMMARY\n' + BOLD_OFF;
  p += SEP + '\n';
  p += twoCol('Bill Total:',       'Rs.' + fmtAmt(selectedBillForHistory.total));
  p += twoCol('Paid at Creation:', 'Rs.' + fmtAmt(selectedBillForHistory.originalPaidAmount || 0));
  p += twoCol('Due at Creation:',  'Rs.' + fmtAmt(selectedBillForHistory.originalDueAmount  || 0));

  if ((selectedBillForHistory.totalFromHistory || 0) > 0) {
    p += twoCol('Additional Paid:', 'Rs.' + fmtAmt(selectedBillForHistory.totalFromHistory));
  }

  p += SEP + '\n';
  p += BOLD_ON;
  p += twoCol('TOTAL PAID:',    'Rs.' + fmtAmt(selectedBillForHistory.totalPaid));
  p += twoCol('REMAINING DUE:', 'Rs.' + fmtAmt(selectedBillForHistory.remainingDue));
  p += BOLD_OFF;
  p += SEP2 + '\n';

  // ── PAYMENT RECORDS ───────────────────────────────────────────────────────
  p += ALIGN_LEFT;
  if (paymentHistory.length > 0) {
    p += BOLD_ON + 'PAYMENT RECORDS\n' + BOLD_OFF;
    p += SEP + '\n';

    paymentHistory.forEach((payment, index) => {
      p += BOLD_ON + `#${index + 1}  ${payment.paymentMethod.toUpperCase()}\n` + BOLD_OFF;
      p += twoCol('Date:',   fmtDate(payment.date));
      p += twoCol('Time:',   fmtTime(payment.date));
      p += twoCol('Amount:', 'Rs.' + fmtAmt(payment.amount));

      if (payment.transactionId) {
        const txn = String(payment.transactionId);
        if (txn.length <= LINE_WIDTH - 8) {
          p += twoCol('TXN ID:', txn);
        } else {
          p += left('TXN ID:');
          p += left('  ' + txn.substring(0, LINE_WIDTH - 2));
        }
      }

      if (payment.notes) {
        p += left('Note: ' + String(payment.notes).substring(0, LINE_WIDTH - 6));
      }

      if (payment.recordedBy && payment.recordedBy !== 'system') {
        p += twoCol('By:', payment.recordedBy);
      }

      p += SEP + '\n';
    });

  } else {
    p += SEP + '\n';
    p += ALIGN_CTR;
    p += 'No Additional Payments\n';
    p += 'Only original payment at\n';
    p += 'bill creation recorded\n';
    p += ALIGN_LEFT;
    p += SEP + '\n';
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  p += ALIGN_CTR;
  p += '* Official Payment Record *\n';
  p += 'Thank You for Your Payment\n';
  p += 'Please Visit Again\n';
  p += SEP + '\n';
  p += 'Powered by POS System\n';
  p += SEP + '\n';

  // ── CUT ───────────────────────────────────────────────────────────────────
  p += ALIGN_LEFT;
  p += PAPER_CUT;

  // ── Send to RawBT ─────────────────────────────────────────────────────────
  try {
    const intentUrl = `intent:${encodeURIComponent(p)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    window.location.href = intentUrl;
  } catch (error) {
    console.error('Print error:', error);
    alert('Failed to print. Please make sure RawBT app is installed.');
  }
};
  // ✅ Fetch payment history
  const fetchPaymentHistory = async (bill) => {
    const billId = bill._id || bill.id;
    if (!billId) {
      alert("Invalid bill ID");
      return;
    }
    
    console.log("Fetching payment history for bill:", billId);
    
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API}/bills/${billId}/payment-history`);
      console.log("Payment history response:", response.data);
      
      if (response.data.success) {
        // Format payment history amounts
        const formattedHistory = (response.data.paymentHistory || []).map(payment => ({
          ...payment,
          amount: roundToTwoDecimals(payment.amount || 0)
        }));
        
        setPaymentHistory(formattedHistory);
        setSelectedBillForHistory({
          ...bill,
          total: roundToTwoDecimals(response.data.bill.total),
          originalPaidAmount: roundToTwoDecimals(response.data.bill.originalPaidAmount || 0),
          originalDueAmount: roundToTwoDecimals(response.data.bill.originalDueAmount || 0),
          totalFromHistory: roundToTwoDecimals(response.data.bill.totalFromHistory || 0),
          totalPaid: roundToTwoDecimals(response.data.bill.totalPaid || 0),
          remainingDue: roundToTwoDecimals(response.data.bill.remainingDue || 0)
        });
        setShowPaymentHistoryModal(true);
      } else {
        alert("Failed to fetch payment history");
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
      alert("Failed to fetch payment history. Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingHistory(false);
    }
  };

  // ✅ Handle pay due - Open payment modal
  const handlePayDue = (bill) => {
    console.log("Opening payment modal for bill:", bill);
    if (bill.due <= 0) {
      alert("This bill has no due amount");
      return;
    }
    setSelectedBill(bill);
    setPaymentAmount(bill.due.toString()); // Default to full due amount
    setPaymentMethod("cash");
    setTransactionId("");
    setShowPaymentModal(true);
  };

  // ✅ Process payment
  const processPayment = async () => {
    if (!selectedBill) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    
    if (amount > selectedBill.due) {
      alert(`Payment amount cannot exceed due amount of ${formatCurrency(selectedBill.due)}`);
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const billId = selectedBill._id || selectedBill.id;
      const paymentData = {
        amount: roundToTwoDecimals(amount),
        paymentMethod: paymentMethod
      };
      
      // Add transaction ID for UPI payments
      if (paymentMethod === "upi" && transactionId) {
        paymentData.transactionId = transactionId;
      }
      
      console.log("Processing payment for bill ID:", billId);
      console.log("Payment data:", paymentData);
      
      const response = await axios.post(
        `${API}/bills/${billId}/payment`,
        paymentData,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Payment response:", response.data);
      
      if (response.data.success) {
        alert(`Payment of ${formatCurrency(amount)} recorded successfully!`);
        setShowPaymentModal(false);
        setSelectedBill(null);
        setPaymentAmount("");
        setTransactionId("");
        fetchReport(); // Refresh the report
      } else {
        alert("Failed to record payment");
      }
    } catch (err) {
      console.error("Payment error:", err);
      let errorMessage = "Failed to record payment. ";
      
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message === 'Network Error') {
        errorMessage += "Network error. Please check your connection.";
      } else {
        errorMessage += err.message;
      }
      
      alert(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  // ✅ Close payment modal
  const closePaymentModal = () => {
    if (!processingPayment) {
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentAmount("");
      setTransactionId("");
    }
  };

  // ✅ Clear customer filter
  const clearCustomerFilter = () => {
    setCustomerFilter("");
  };

  // ✅ Retry fetch
  const handleRetry = () => {
    fetchReport();
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <h1 className="text-xl font-bold mb-4 text-gray-800">
        📊 Sales Report
      </h1>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="text-sm">{error}</p>
          <button 
            onClick={handleRetry}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="space-y-3 mb-4">
        {/* Date Type and Custom Date Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 border rounded-lg text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={loading}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>

          {type === "custom" && (
            <>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="p-2 border rounded-lg bg-white text-gray-800"
                disabled={loading}
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="p-2 border rounded-lg bg-white text-gray-800"
                disabled={loading}
              />
              <button
                onClick={fetchReport}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Loading..." : "Apply"}
              </button>
            </>
          )}
        </div>

        {/* Customer Filter Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={loading || loadingCustomers}
            >
              <option value="">All Customers</option>
              {customers.map((customer, index) => (
                <option key={index} value={customer}>
                  {customer === "Walk-in" ? "🚶 Walk-in Customer" : `👤 ${customer}`}
                </option>
              ))}
            </select>
          </div>
          
          {customerFilter && (
            <button
              onClick={clearCustomerFilter}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm whitespace-nowrap"
              disabled={loading}
            >
              Clear Filter
            </button>
          )}
          
          {loadingCustomers && (
            <div className="text-sm text-gray-500">Loading customers...</div>
          )}
        </div>

        {/* Active Filter Indicator */}
        {customerFilter && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Active Filter:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              Customer: {customerFilter === "Walk-in" ? "Walk-in Customer" : customerFilter}
            </span>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading report...</p>
        </div>
      )}

      {/* SUMMARY CARDS */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Card title="Total Sales" value={summary.grandTotal} color="blue" />
            <Card title="Total Paid" value={summary.totalPaid} color="green" />
            <Card title="Total Due" value={summary.totalDue} color="orange" />
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm text-gray-800">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="p-2 text-left">Bill No</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-right">Bill Amount</th>
                  <th className="p-2 text-right">Total Paid</th>
                  <th className="p-2 text-right">Total Due</th>
                  <th className="p-2 text-center">Payment</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length > 0 ? (
                  bills.map((bill, index) => (
                    <tr key={bill._id || bill.id || index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-semibold">
                        {bill.billNumber}
                      </td>
                      <td className="p-2">
                        {formatDate(bill.date)}
                      </td>
                      <td className="p-2">
                        {bill.customer || "Walk-in"}
                      </td>
                      <td className="p-2 text-right text-blue-600 font-bold">
                        {formatCurrency(bill.total)}
                      </td>
                      <td className="p-2 text-right text-green-600">
                        {formatCurrency(bill.paid)}
                      </td>
                      <td className={`p-2 text-right ${bill.due > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {formatCurrency(bill.due)}
                      </td>
                      <td className="p-2 text-center capitalize">
                        {bill.paymentMethod}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">

                          <button
                            onClick={() => handleEditBill(bill)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                            title="Edit Bill"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => fetchPaymentHistory(bill)}
                            className="bg-indigo-500 text-white px-2 py-1 rounded text-xs hover:bg-indigo-600"
                            title="View Payment History"
                          >
                            📜
                          </button>
                          {bill.due > 0 && (
                            <button
                              onClick={() => handlePayDue(bill)}
                              className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                              title="Pay Due"
                            >
                              💰
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintBillWeb(bill)}
                            className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
                            title="Print Bill"
                          >
                            🖨️
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            title="Delete Bill"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center p-6 text-gray-400">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Export Options */}
          {bills.length > 0 && (
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  const csv = [
                    ['Bill No', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Payment Method'],
                    ...bills.map(bill => [
                      bill.billNumber,
                      formatDate(bill.date),
                      bill.customer || 'Walk-in',
                      bill.total.toFixed(2),
                      bill.paid.toFixed(2),
                      bill.due.toFixed(2),
                      bill.paymentMethod
                    ])
                  ].map(row => row.join(',')).join('\n');
                  
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sales_report_${customerFilter ? `customer_${customerFilter}_` : ''}${type}_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                📥 Export CSV
              </button>
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closePaymentModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-800">
                Pay Due Amount
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Bill #{selectedBill.billNumber} - Customer: {selectedBill.customer || "Walk-in"}
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Bill Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Total Bill Amount:</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(selectedBill.total)}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Amount Already Paid:</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(selectedBill.paid)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 pt-2 border-t border-gray-300 mt-1">
                  <span className="text-gray-800 font-bold">Remaining Due:</span>
                  <span className="text-red-600 font-bold text-lg">{formatCurrency(selectedBill.due)}</span>
                </div>
              </div>
              
              {/* Payment Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-gray-900 bg-white"
                  style={{ color: 'black' }}
                  placeholder="Enter amount"
                  min="1"
                  max={selectedBill.due}
                  step="0.01"
                  disabled={processingPayment}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum amount: {formatCurrency(selectedBill.due)}
                </p>
              </div>
              
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cash");
                      setTransactionId("");
                    }}
                    className={`p-3 border-2 rounded-lg font-medium transition ${
                      paymentMethod === "cash"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-yellow-300"
                    }`}
                    disabled={processingPayment}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("upi");
                    }}
                    className={`p-3 border-2 rounded-lg font-medium transition ${
                      paymentMethod === "upi"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-yellow-300"
                    }`}
                    disabled={processingPayment}
                  >
                    📱 UPI
                  </button>
                </div>
              </div>

              {/* Transaction ID for UPI payments */}
              {paymentMethod === "upi" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-gray-900 bg-white"
                    placeholder="Enter UPI transaction ID"
                    disabled={processingPayment}
                  />
                </div>
              )}
            </div>
            
            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-white p-4 border-t rounded-b-lg flex gap-3">
              <button
                onClick={closePaymentModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay ${formatCurrency(parseFloat(paymentAmount) || 0)}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

{/* Payment History Modal */}
{showPaymentHistoryModal && selectedBillForHistory && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={() => setShowPaymentHistoryModal(false)}
  >
    <div 
      className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white p-4 border-b rounded-t-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Payment History
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Bill #{selectedBillForHistory.billNumber} - {selectedBillForHistory.customer || "Walk-in"}
            </p>
          </div>
          <button
            onClick={handlePrintPaymentHistory}
            className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-600 transition-colors flex items-center gap-1"
            title="Print Payment History"
          >
            🖨️ Print
          </button>
        </div>
        
        {/* Bill Summary */}
        <div className="mt-3 bg-gray-100 p-3 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">Bill Total:</span>
              <span className="font-bold text-gray-900">{formatCurrency(selectedBillForHistory.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">Paid at Bill Creation:</span>
              <span className="font-semibold text-green-700">{formatCurrency(selectedBillForHistory.originalPaidAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">Due at Bill Creation:</span>
              <span className={`font-semibold ${(selectedBillForHistory.originalDueAmount || 0) > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                {formatCurrency(selectedBillForHistory.originalDueAmount || 0)}
              </span>
            </div>
            {selectedBillForHistory.totalFromHistory > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                <span className="text-gray-700 font-medium">Additional Payments Made:</span>
                <span className="font-semibold text-green-700">{formatCurrency(selectedBillForHistory.totalFromHistory)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-400 mt-1">
              <span className="font-semibold text-gray-800">Total Paid:</span>
              <span className="font-bold text-green-700 text-base">{formatCurrency(selectedBillForHistory.totalPaid)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-800">Remaining Due:</span>
              <span className={`font-bold ${selectedBillForHistory.remainingDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {formatCurrency(selectedBillForHistory.remainingDue)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading payment history...</p>
          </div>
        ) : paymentHistory.length > 0 ? (
          <>
            <h4 className="font-semibold text-gray-800 mb-3">Additional Payment Records:</h4>
            <div className="space-y-3">
              {paymentHistory.map((payment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {payment.paymentMethod.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {new Date(payment.date).toLocaleString()}
                      </div>
                      {payment.transactionId && (
                        <div className="text-xs text-gray-600 mt-1">
                          Transaction ID: {payment.transactionId}
                        </div>
                      )}
                      {payment.notes && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          {payment.notes}
                        </div>
                      )}
                      {payment.recordedBy && payment.recordedBy !== 'system' && (
                        <div className="text-xs text-gray-600 mt-1">
                          Recorded by: {payment.recordedBy}
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💰</div>
            <p className="text-gray-600">No additional payments recorded</p>
            <p className="text-xs text-gray-500 mt-2">
              Only the original payment made at bill creation
            </p>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Original Paid:</span>
                <span className="font-semibold text-green-700">{formatCurrency(selectedBillForHistory.originalPaidAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-700 font-medium">Original Due:</span>
                <span className="font-semibold text-orange-700">{formatCurrency(selectedBillForHistory.originalDueAmount || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="sticky bottom-0 bg-white p-4 border-t rounded-b-lg flex gap-2">
        <button
          onClick={() => setShowPaymentHistoryModal(false)}
          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
        >
          Close
        </button>
        <button
          onClick={handlePrintPaymentHistory}
          className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium flex items-center justify-center gap-1"
        >
          🖨️ Print with RawBT
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Reports;

// ✅ CARD COMPONENT
const Card = ({ title, value, color }) => {
  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-500"
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow">
      <div className="text-xs text-gray-500">{title}</div>
      <div className={`text-lg font-bold ${colors[color]}`}>
        {formatCurrency(value)}
      </div>
    </div>
  );
};