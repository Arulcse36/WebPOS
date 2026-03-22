import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

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

  // ✅ Set default dates when switching to custom
  useEffect(() => {
    if (type === "custom") {
      const today = new Date().toISOString().split("T")[0];
      setFrom(today);
      setTo(today);
    }
  }, [type]);

  const fetchReport = async () => {
    try {
      let url = `${API}/reports/bills?type=${type}`;

      if (type === "custom") {
        if (!from || !to) {
          alert("Please select date range");
          return;
        }
        url += `&from=${from}&to=${to}`;
      }

      const res = await axios.get(url);
      console.log("Raw API response:", res.data);
      
      // Ensure each bill has an ID
      const billsWithIds = (res.data.bills || []).map(bill => {
        // Log each bill to see what we're getting
        console.log("Bill object:", bill);
        
        return {
          ...bill,
          // Try multiple possible ID fields
          _id: bill._id || bill.id || bill.billId || bill._id,
          // Store the original ID for debugging
          originalId: bill._id || bill.id
        };
      });
      
      console.log("Processed bills with IDs:", billsWithIds);
      
      setBills(billsWithIds);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error(err);
      alert("Failed to load report");
    }
  };

  useEffect(() => {
    fetchReport();
  }, [type, from, to]);

  // ✅ Format date → 22-Mar-2026
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // ✅ Handle edit bill - Navigate to POS with edit mode
  const handleEditBill = (bill) => {
    console.log("Edit button clicked for bill:", bill);
    
    // Try to get the ID from multiple possible sources
    const billId = bill._id || bill.id || bill.billId;
    
    if (!billId) {
      console.error("Bill has no ID! Bill object:", bill);
      alert("Cannot edit this bill: No ID found. Please check the bill data.");
      return;
    }
    
    console.log("Navigating to edit bill with ID:", billId);
    
    // Navigate to edit page with the ID
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
        const response = await axios.delete(`${API}/bills/${billId}`);
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
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .bill-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-size: 18px; font-weight: bold; text-align: right; }
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
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <h1 className="text-xl font-bold mb-4 text-gray-800">
        📊 Sales Report
      </h1>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-2 border rounded-lg text-sm bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
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
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="p-2 border rounded-lg bg-white text-gray-800"
            />
            <button
              onClick={fetchReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Apply
            </button>
          </>
        )}
      </div>

      {/* SUMMARY CARDS */}
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
                    <div className="flex gap-1 justify-center">
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