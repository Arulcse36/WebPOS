import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { formatDateTime, formatForInput, formatCurrency, formatQuantityDisplay } from '../utils/formatters';
import { roundToTwoDecimals } from '../utils/mathHelpers';
import { handlePrintBill } from '../utils/printBill';

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
  
  // Get companyId and user role from localStorage
  const companyId = localStorage.getItem("companyId");
  const userRole = localStorage.getItem("userType");
  const isSuperAdmin = localStorage.getItem("isSuperAdmin") === "true";
  
  // Determine if user can delete (Super Admin or Company Admin)
  const canDelete = isSuperAdmin || userRole === 'admin';
  
  // Customer filter states
  const [customerFilter, setCustomerFilter] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Due status filter states
  const [dueStatusFilter, setDueStatusFilter] = useState("all"); // "all", "due", "no_due"
  
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
  const [deletingPayment, setDeletingPayment] = useState(false);
  
  // Filter panel collapsed state
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // ✅ Set default dates when switching to custom
  useEffect(() => {
    if (type === "custom") {
      const today = new Date().toISOString().split("T")[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      setFrom(lastWeek.toISOString().split("T")[0]);
      setTo(today);
    }
  }, [type]);

  // ✅ Fetch unique customers for filter (with company filter)
  const fetchCustomers = async () => {
    if (!companyId) {
      console.error("No company ID found");
      return;
    }
    
    setLoadingCustomers(true);
    try {
      const response = await axios.get(`${API}/bills/customers?companyId=${companyId}`, {
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

  // Load customers on component mount (only if company exists)
  useEffect(() => {
    if (companyId) {
      fetchCustomers();
    }
  }, [companyId]);

  const fetchReport = async () => {
    if (!companyId) {
      setError("No company associated. Please login again.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API}/reports/bills?type=${type}&companyId=${companyId}`;

      // Handle different period types
      if (type === "all") {
        // For "All" - fetch from year 2000 to current date
        const startDate = new Date("2000-01-01");
        const endDate = new Date();
        url += `&from=${startDate.toISOString().split('T')[0]}&to=${endDate.toISOString().split('T')[0]}`;
      } else if (type === "custom") {
        if (!from || !to) {
          alert("Please select date range");
          setLoading(false);
          return;
        }
        url += `&from=${from}&to=${to}`;
      }
      // For daily, weekly, monthly - no additional date params needed as backend handles them

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
      let filteredBills = (res.data.bills || []).map(bill => {
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
      
      // ✅ Apply due status filter
      if (dueStatusFilter === "due") {
        filteredBills = filteredBills.filter(bill => bill.due > 0);
      } else if (dueStatusFilter === "no_due") {
        filteredBills = filteredBills.filter(bill => bill.due <= 0);
      }
      
      // Calculate summary based on filtered bills
      const filteredSummary = {
        grandTotal: roundToTwoDecimals(filteredBills.reduce((sum, bill) => sum + bill.total, 0)),
        totalPaid: roundToTwoDecimals(filteredBills.reduce((sum, bill) => sum + bill.paid, 0)),
        totalDue: roundToTwoDecimals(filteredBills.reduce((sum, bill) => sum + bill.due, 0))
      };
      
      setBills(filteredBills);
      setSummary(filteredSummary);
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
    if (companyId) {
      fetchReport();
    }
  }, [type, from, to, customerFilter, dueStatusFilter, companyId]);

  // ✅ Redirect if no company
  useEffect(() => {
    if (!companyId) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [companyId, navigate]);

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


  // ✅ Handle edit bill for Retail POS (NEW)
const handleEditBillRetail = (bill) => {
  const billId = bill._id || bill.id || bill.billId;
  
  if (!billId) {
    alert("Cannot edit this bill: No ID found. Please check the bill data.");
    return;
  }
  
  navigate(`/RetailPos/edit/${billId}`);
};

  // ✅ Handle delete bill (only for admins)
  const handleDeleteBill = async (bill) => {
    if (!canDelete) {
      alert("You don't have permission to delete bills");
      return;
    }
    
    const billId = bill._id || bill.id || bill.billId;
    
    if (!billId) {
      alert("Invalid bill ID");
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete bill #${bill.billNumber}?`)) {
      try {
        const response = await axios.delete(`${API}/bills/${billId}?companyId=${companyId}`, {
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
  // Get the bill ID - this is the MongoDB _id
  const billId = bill._id || bill.id || bill.billId;
  
  if (!billId) {
    alert("Cannot print this bill: No ID found. Please check the bill data.");
    console.error("No bill ID found for bill:", bill);
    return;
  }
  
  console.log("Printing bill with ID:", billId);
  
  // Call handlePrintBill with just the billId
  // The onClose callback is optional
  handlePrintBill(billId);
};
  // ✅ Handle delete payment record (only for admins)
  const handleDeletePayment = async (paymentIndex) => {
    if (!canDelete) {
      alert("You don't have permission to delete payment records");
      return;
    }
    
    if (!selectedBillForHistory) return;
    
    const payment = paymentHistory[paymentIndex];
    if (!window.confirm(`Are you sure you want to delete this payment of ${formatCurrency(payment.amount)}?`)) return;
    
    setDeletingPayment(true);
    try {
      const billId = selectedBillForHistory._id || selectedBillForHistory.id;
      const response = await axios.delete(
        `${API}/bills/${billId}/payment/${paymentIndex}?companyId=${companyId}`,
        { timeout: 10000 }
      );
      
      if (response.data.success) {
        alert("Payment record deleted successfully!");
        // Refresh payment history
        await fetchPaymentHistory(selectedBillForHistory);
        // Refresh report to update totals
        fetchReport();
      } else {
        alert("Failed to delete payment record");
      }
    } catch (err) {
      console.error("Error deleting payment:", err);
      alert("Error deleting payment record: " + (err.response?.data?.message || err.message));
    } finally {
      setDeletingPayment(false);
    }
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
      const response = await axios.get(`${API}/bills/${billId}/payment-history?companyId=${companyId}`);
      console.log("Payment history response:", response.data);
      
      if (response.data.success) {
        // Format payment history amounts
        const formattedHistory = (response.data.paymentHistory || []).map(payment => ({
          ...payment,
          amount: roundToTwoDecimals(payment.amount || 0),
          index: payment.index
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
        `${API}/bills/${billId}/payment?companyId=${companyId}`,
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

  // ✅ Clear all filters
  const clearAllFilters = () => {
    setCustomerFilter("");
    setDueStatusFilter("all");
    setType("daily");
    setFrom("");
    setTo("");
  };

  // ✅ Retry fetch
  const handleRetry = () => {
    fetchReport();
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (customerFilter) count++;
    if (dueStatusFilter !== "all") count++;
    if (type === "custom" && (from || to)) count++;
    return count;
  };

  // Show loading or redirect if no company
  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Company Associated</h2>
          <p className="text-gray-600 mb-4">Please login again to access reports.</p>
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 mt-3">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📊 Sales Report
        </h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all your sales transactions</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="text-sm">{error}</p>
          <button 
            onClick={handleRetry}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* FILTERS SECTION - Improved Design */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        {/* Filter Header */}
        <div 
          className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <span className="font-semibold text-gray-800">Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {getActiveFiltersCount()} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
              >
                Clear All
              </button>
            )}
            <span className="text-gray-400 text-xl">
              {filtersExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>

        {/* Filter Content */}
        {filtersExpanded && (
          <div className="p-4 space-y-4">
            {/* Row 1: Date Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                📅 Date Range
              </label>
              <div className="flex flex-wrap gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="flex-1 min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="daily">📅 Today</option>
                  <option value="weekly">📆 Last 7 Days</option>
                  <option value="monthly">📊 This Month</option>
                  <option value="all">🗓️ All Time (From 2000)</option>
                  <option value="custom">⚙️ Custom Range</option>
                </select>

                {type === "custom" && (
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800"
                      disabled={loading}
                    />
                    <span className="text-gray-400 self-center">→</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800"
                      disabled={loading}
                    />
                    <button
                      onClick={fetchReport}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Customer Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                👤 Customer
              </label>
              <div className="flex gap-2">
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || loadingCustomers}
                >
                  <option value="">👥 All Customers</option>
                  {customers.map((customer, index) => (
                    <option key={index} value={customer}>
                      {customer === "Walk-in" ? "🚶 Walk-in Customer" : `👤 ${customer}`}
                    </option>
                  ))}
                </select>
                {customerFilter && (
                  <button
                    onClick={() => setCustomerFilter("")}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm transition"
                    title="Clear customer filter"
                  >
                    ✕
                  </button>
                )}
              </div>
              {loadingCustomers && (
                <p className="text-xs text-gray-400 mt-1">Loading customers...</p>
              )}
            </div>

            {/* Row 3: Payment Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                💰 Payment Status
              </label>
              <div className="flex gap-2">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDueStatusFilter("all")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      dueStatusFilter === "all"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    📋 All
                  </button>
                  <button
                    onClick={() => setDueStatusFilter("due")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      dueStatusFilter === "due"
                        ? "bg-red-500 text-white"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    ⚠️ Due
                  </button>
                  <button
                    onClick={() => setDueStatusFilter("no_due")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      dueStatusFilter === "no_due"
                        ? "bg-green-500 text-white"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    ✅ Paid
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Tags */}
            {(customerFilter || dueStatusFilter !== "all" || type === "all") && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {type === "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      <span>🗓️</span> All Records
                    </span>
                  )}
                  {customerFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      <span>👤</span> {customerFilter === "Walk-in" ? "Walk-in" : customerFilter}
                      <button
                        onClick={() => setCustomerFilter("")}
                        className="ml-1 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {dueStatusFilter === "due" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                      <span>⚠️</span> Due Only
                    </span>
                  )}
                  {dueStatusFilter === "no_due" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <span>✅</span> Paid Only
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-3 text-gray-500 text-sm">Loading report...</p>
        </div>
      )}

      {/* SUMMARY CARDS - Improved Design */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs uppercase tracking-wide">Total Sales</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(summary.grandTotal)}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs uppercase tracking-wide">Total Received</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalPaid)}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💳</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs uppercase tracking-wide">Pending Amount</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalDue)}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
            </div>
          </div>

          {/* BILLS COUNT BAR */}
          <div className="bg-white rounded-xl shadow-sm p-3 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">📋 Total Bills:</span>
              <span className="font-bold text-gray-800 text-lg">{bills.length}</span>
            </div>
            {bills.length > 0 && (
              <div className="text-xs text-gray-400">
                Showing {bills.length} record{bills.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* TABLE - Improved Design */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Bill No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Due</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.length > 0 ? (
                    bills.map((bill, index) => (
                      <tr key={bill._id || bill.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          #{bill.billNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(bill.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {bill.customer || "Walk-in"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                          {formatCurrency(bill.total)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          {formatCurrency(bill.paid)}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${bill.due > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {formatCurrency(bill.due)}
                        </td>
<td className="px-4 py-3 text-center">
  <div className="flex flex-wrap gap-1 justify-center">
    {/* Edit Button - Regular POS */}
    <button
      onClick={() => handleEditBill(bill)}
      className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
      title="Edit in POS"
    >
      ✏️ POS
    </button>
    
    {/* Edit Button - Retail POS (NEW) */}
    <button
      onClick={() => handleEditBillRetail(bill)}
      className="p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition"
      title="Edit in Retail POS"
    >
      🛍️ Retail
    </button>
    
    <button
      onClick={() => fetchPaymentHistory(bill)}
      className="p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition"
      title="Payment History"
    >
      📜
    </button>
    {bill.due > 0 && (
      <button
        onClick={() => handlePayDue(bill)}
        className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
        title="Pay Due"
      >
        💰
      </button>
    )}
    <button
      onClick={() => handlePrintBillWeb(bill)}
      className="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition"
      title="Print Bill"
    >
      🖨️
    </button>
    {canDelete && (
      <button
        onClick={() => handleDeleteBill(bill)}
        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
        title="Delete Bill"
      >
        🗑️
      </button>
    )}
  </div>
</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-400">
                        <div className="text-4xl mb-2">📭</div>
                        <p>No data found</p>
                        <p className="text-xs mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Button */}
          {bills.length > 0 && (
            <div className="mt-4 flex justify-end">
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
                  a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition flex items-center gap-2 shadow-sm"
              >
                📥 Export CSV
              </button>
            </div>
          )}
        </>
      )}

      {/* PAYMENT MODAL - Fixed Text Colors */}
      {showPaymentModal && selectedBill && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closePaymentModal}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Pay Due Amount</h3>
              <p className="text-sm text-gray-600 mt-1">
                Bill #{selectedBill.billNumber} - {selectedBill.customer || "Walk-in"}
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-700">Bill Total:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(selectedBill.total)}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-700">Already Paid:</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(selectedBill.paid)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 pt-2 border-t mt-1">
                  <span className="font-bold text-gray-900">Remaining Due:</span>
                  <span className="text-red-600 font-bold text-lg">{formatCurrency(selectedBill.due)}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-gray-900 bg-white"
                  placeholder="Enter amount"
                  min="1"
                  max={selectedBill.due}
                  step="0.01"
                  disabled={processingPayment}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setPaymentMethod("cash");
                      setTransactionId("");
                    }}
                    className={`p-3 border-2 rounded-lg font-medium transition ${
                      paymentMethod === "cash"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-yellow-300"
                    }`}
                  >
                    💵 Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-3 border-2 rounded-lg font-medium transition ${
                      paymentMethod === "upi"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-yellow-300"
                    }`}
                  >
                    📱 UPI
                  </button>
                </div>
              </div>

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
                  />
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white p-4 border-t rounded-b-xl flex gap-3">
              <button
                onClick={closePaymentModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium disabled:bg-gray-400"
                disabled={processingPayment}
              >
                {processingPayment ? "Processing..." : `Pay ${formatCurrency(parseFloat(paymentAmount) || 0)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT HISTORY MODAL - Fixed Text Colors */}
      {showPaymentHistoryModal && selectedBillForHistory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentHistoryModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Bill #{selectedBillForHistory.billNumber} - {selectedBillForHistory.customer || "Walk-in"}
                  </p>
                </div>
                <button
                  onClick={handlePrintPaymentHistory}
                  className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition"
                >
                  🖨️ Print
                </button>
              </div>
              
              <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Bill Total:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedBillForHistory.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Total Paid:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(selectedBillForHistory.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Remaining Due:</span>
                    <span className={`font-semibold ${selectedBillForHistory.remainingDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
                </div>
              ) : paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {paymentHistory.map((payment, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {payment.paymentMethod.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {new Date(payment.date).toLocaleString()}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-600 mt-1">
                              TXN: {payment.transactionId}
                            </div>
                          )}
                          {payment.notes && (
                            <div className="text-xs text-gray-600 mt-1 italic">
                              {payment.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </div>
                          {canDelete && (
                            <button
                              onClick={() => handleDeletePayment(index)}
                              disabled={deletingPayment}
                              className="text-red-500 hover:text-red-700 text-lg font-bold ml-2 disabled:opacity-50"
                              title="Delete Payment"
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💰</div>
                  <p className="text-gray-600">No additional payments recorded</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Only the original payment made at bill creation
                  </p>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white p-4 border-t rounded-b-xl">
              <button
                onClick={() => setShowPaymentHistoryModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Close
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