import { useState, useEffect } from "react";
import axios from "axios";
import { formatCurrency } from "../utils/formatters";

const API = import.meta.env.VITE_API_URL;

const PaymentReport = () => {
    const [payments, setPayments] = useState([]);
    const [billSummary, setBillSummary] = useState([]);
    const [summary, setSummary] = useState({
        totalCash: 0,
        totalUpi: 0,
        totalPaid: 0,
        totalTransactions: 0,
        totalBills: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState("daily");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [viewMode, setViewMode] = useState("entries");
    
    // Customer filter states
    const [customerFilter, setCustomerFilter] = useState("");
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    
    const companyId = localStorage.getItem("companyId");

    // Fetch unique customers for filter
    const fetchCustomers = async () => {
        if (!companyId) {
            console.error("No company ID found");
            return;
        }
        
        setLoadingCustomers(true);
        try {
            console.log(`Fetching customers for companyId: ${companyId} from ${API}/bills/customers`);
      
            const response = await axios.get(`${API}/bills/customers?companyId=${companyId}`, {
                timeout: 10000
            });
            if (response.data.success) {
                // The backend returns an array of strings (customer names)
                const customerNames = response.data.customers || [];
                setCustomers(customerNames);
                console.log("Loaded customers:", customerNames);
            }
        } catch (err) {
            console.error("Error fetching customers:", err);
        } finally {
            setLoadingCustomers(false);
        }
    };

    // Load customers on component mount
    useEffect(() => {
        if (companyId) {
            fetchCustomers();
        }
    }, [companyId]);

    // Set default dates when switching to custom
    useEffect(() => {
        if (period === "custom") {
            const today = new Date().toISOString().split("T")[0];
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            setFrom(lastWeek.toISOString().split("T")[0]);
            setTo(today);
        }
    }, [period]);

    useEffect(() => {
        if (companyId) {
            fetchPaymentReport();
        }
    }, [companyId, period, from, to, customerFilter]);

// In PaymentReport.jsx, update the fetchPaymentReport function:

const fetchPaymentReport = async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
        let url = `${API}/payment-reports/payment-report?companyId=${companyId}&period=${period}`;
        
        // Add date parameters based on period
        if (period === "daily") {
            // No need to add date params, backend will handle today's date
        } else if (period === "weekly") {
            // No need to add date params, backend will handle last 7 days
        } else if (period === "monthly") {
            // No need to add date params, backend will handle current month
        } else if (period === "custom") {
            if (from && to) {
                url += `&startDate=${from}&endDate=${to}`;
            }
        }
        
        // Add customer filter if selected
        if (customerFilter) {
            url += `&customer=${encodeURIComponent(customerFilter)}`;
        }
        
        const res = await axios.get(url, { timeout: 15000 });
        
        if (res.data.success) {
            setPayments(res.data.paymentEntries || []);
            setBillSummary(res.data.billSummary || []);
            setSummary(res.data.summary || {
                totalCash: 0,
                totalUpi: 0,
                totalPaid: 0,
                totalTransactions: 0,
                totalBills: 0
            });
        }
    } catch (err) {
        console.error("Error fetching payment report:", err);
        setError(err.response?.data?.error || "Failed to load payment report");
    } finally {
        setLoading(false);
    }
};

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const handleReset = () => {
        setPeriod("daily");
        setFrom("");
        setTo("");
        setCustomerFilter("");
    };

    const clearCustomerFilter = () => {
        setCustomerFilter("");
    };

    if (!companyId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">🏢</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">No Company Associated</h2>
                    <p className="text-gray-600 mb-4">Please login again to access payment report.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        💳 Payment Report
                    </h1>
                    <p className="text-gray-600 mt-1">Track all cash and UPI payments from bills and payment history</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        
                        {period === "custom" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                    <input
                                        type="date"
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                    <input
                                        type="date"
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                    />
                                </div>
                            </>
                        )}
                        
                        {/* Customer Filter - Fixed for string array */}
                        <div className="min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                            <select
                                value={customerFilter}
                                onChange={(e) => setCustomerFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                disabled={loadingCustomers}
                            >
                                <option value="">All Customers</option>
                                {customers.map((customerName, index) => (
                                    <option key={index} value={customerName}>
                                        {customerName === "Walk-in" ? "🚶 Walk-in Customer" : `👤 ${customerName}`}
                                    </option>
                                ))}
                            </select>
                            {loadingCustomers && (
                                <div className="text-xs text-gray-500 mt-1">Loading customers...</div>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={fetchPaymentReport}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply Filter
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                    
                    {/* Active Filter Indicator */}
                    {customerFilter && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-gray-600">Active Filter:</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                Customer: {customerFilter === "Walk-in" ? "Walk-in Customer" : customerFilter}
                                <button onClick={clearCustomerFilter} className="ml-2 hover:text-blue-900">×</button>
                            </span>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                        <p className="text-green-100 text-sm">Total Cash</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalCash)}</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                        <p className="text-blue-100 text-sm">Total UPI</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalUpi)}</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                        <p className="text-purple-100 text-sm">Total Collected</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                        <p className="text-orange-100 text-sm">Transactions / Bills</p>
                        <p className="text-2xl font-bold">
                            <span className="text-white">{summary.totalTransactions}</span>
                            <span className="text-orange-200"> / </span>
                            <span className="text-white">{summary.totalBills}</span>
                        </p>
                    </div>
                </div>

                {/* View Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setViewMode("entries")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === "entries"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        📋 Payment Entries
                    </button>
                    <button
                        onClick={() => setViewMode("bills")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === "bills"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        🧾 Bill Summary
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                        <p>{error}</p>
                        <button onClick={fetchPaymentReport} className="mt-2 text-sm font-medium underline">
                            Try Again
                        </button>
                    </div>
                )}

                {/* Payment Entries View */}
                {!loading && !error && viewMode === "entries" && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Bill No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Transaction Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Bill Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Payment Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Source</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Transaction ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                                                No payment entries found
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((payment, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">#{payment.billNumber}</td>
                                                <td className="px-4 py-3 text-gray-600">{formatDate(payment.billDate)}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                    {formatCurrency(payment.billTotal || payment.total || 0)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{payment.customerName}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                                        payment.paymentType === 'Cash' 
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {payment.paymentType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-medium ${
                                                        payment.source === 'Main Bill' 
                                                            ? 'text-purple-600'
                                                            : 'text-orange-600'
                                                    }`}>
                                                        {payment.source}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {payment.transactionId || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {payments.length > 0 && (
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan="6" className="px-4 py-3 text-right font-bold text-gray-900">Total:</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                                            </td>
                                            <td>\n                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}

                {/* Bill Summary View */}
                {!loading && !error && viewMode === "bills" && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Bill No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Bill Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Bill Total</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Cash Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">UPI Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Due Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Payments</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {billSummary.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                                                No bills found
                                            </td>
                                        </tr>
                                    ) : (
                                        billSummary.map((bill, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">#{bill.billNumber}</td>
                                                <td className="px-4 py-3 text-gray-600">{formatDate(bill.billDate)}</td>
                                                <td className="px-4 py-3 text-gray-700">{bill.customerName}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                    {formatCurrency(bill.billTotal || 0)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                    {formatCurrency(bill.totalCash)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                                    {formatCurrency(bill.totalUpi)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                    {formatCurrency(bill.totalPaid)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-red-600">
                                                    {formatCurrency((bill.billTotal || 0) - bill.totalPaid)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                        {bill.paymentCount} {bill.paymentCount === 1 ? 'payment' : 'payments'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {billSummary.length > 0 && (
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">Total:</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {formatCurrency(billSummary.reduce((sum, b) => sum + (b.billTotal || 0), 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600">
                                                {formatCurrency(billSummary.reduce((sum, b) => sum + b.totalCash, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-600">
                                                {formatCurrency(billSummary.reduce((sum, b) => sum + b.totalUpi, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {formatCurrency(billSummary.reduce((sum, b) => sum + b.totalPaid, 0))}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-red-600">
                                                {formatCurrency(billSummary.reduce((sum, b) => sum + ((b.billTotal || 0) - b.totalPaid), 0))}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-900">
                                                {billSummary.reduce((sum, b) => sum + b.paymentCount, 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentReport;