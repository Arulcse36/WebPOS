import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Dynamic API URL - works on both mobile and desktop
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

  // ✅ Set default dates when switching to custom
  useEffect(() => {
    if (type === "custom") {
      const today = new Date().toISOString().split("T")[0];
      setFrom(today);
      setTo(today);
    }
  }, [type]);

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

      console.log("Fetching from URL:", url); // Debug log
      
      const res = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log("Response received:", res.data); // Debug log
      
      // Ensure each bill has an ID
      const billsWithIds = (res.data.bills || []).map(bill => {
        return {
          ...bill,
          _id: bill._id || bill.id || bill.billId,
          originalId: bill._id || bill.id
        };
      });
      
      setBills(billsWithIds);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error("Fetch error:", err);
      
      // Better error messages for mobile
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
  }, [type, from, to]);

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
      Total: ₹${bill.total}
      Paid: ₹${bill.paid}
      Due: ₹${bill.due}
      Payment: ${bill.paymentMethod}
      ${bill.items ? `Items: ${bill.items.length}` : ''}
    `;
    alert(message);
  };

  // ✅ Handle print bill
  const handlePrintBill = (bill) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill #${bill.billNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .bill-details { margin-bottom: 20px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { background-color: #f2f2f2; }
            .total { font-size: 18px; font-weight: bold; text-align: right; }
            @media print {
              body { margin: 0; padding: 10px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>INVOICE</h2>
            <p>Bill #${bill.billNumber}</p>
            <p>Date: ${formatDate(bill.date)}</p>
          </div>
          <div class="bill-details">
            <p><strong>Customer:</strong> ${bill.customer || "Walk-in"}</p>
            <p><strong>Payment Method:</strong> ${bill.paymentMethod}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items?.map(item => `
                <tr>
                  <td>${item.name || item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                  <td>₹${item.price * item.quantity}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No items available</td></tr>'}
            </tbody>
          </table>
          <div class="total">
            <p>Subtotal: ₹${bill.subtotal || bill.total}</p>
            ${bill.discount ? `<p>Discount: ${bill.discount}%</p>` : ''}
            <p><strong>Total: ₹${bill.total}</strong></p>
            <p>Paid: ₹${bill.paid}</p>
            <p>Due: ₹${bill.due}</p>
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <p>Thank you for your business!</p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; margin: 10px;">Print</button>
            <button onclick="window.close()" style="padding: 10px 20px; margin: 10px;">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
      <div className="flex flex-wrap gap-3 mb-4 items-center">
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
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2 text-right">Paid</th>
                  <th className="p-2 text-right">Due</th>
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
                        ₹{bill.total}
                      </td>
                      <td className="p-2 text-right text-green-600">
                        ₹{bill.paid}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        ₹{bill.due}
                      </td>
                      <td className="p-2 text-center capitalize">
                        {bill.paymentMethod}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <button
                            onClick={() => handleViewBill(bill)}
                            className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditBill(bill)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                            title="Edit Bill"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handlePrintBill(bill)}
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
                      bill.total,
                      bill.paid,
                      bill.due,
                      bill.paymentMethod
                    ])
                  ].map(row => row.join(',')).join('\n');
                  
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sales_report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
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
        ₹{value || 0}
      </div>
    </div>
  );
};   