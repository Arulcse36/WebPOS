import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  Percent, 
  Package, 
  Users, 
  Receipt, 
  PlusCircle,
  BarChart3,
  Calendar
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("daily");
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
  const [stats, setStats] = useState({
    totalBills: 0,
    averageBillValue: 0,
    collectionRate: 0,
    topCustomers: [],
    allTopProducts: [],
    paymentMethodBreakdown: [],
    dailyTrends: []
  });

  useEffect(() => {
    if (period === "custom") {
      const today = new Date().toISOString().split("T")[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      setFrom(lastWeek.toISOString().split("T")[0]);
      setTo(today);
    }
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API}/reports/bills?type=${period}`;

      if (period === "custom") {
        if (!from || !to) {
          alert("Please select date range");
          setLoading(false);
          return;
        }
        url += `&from=${from}&to=${to}`;
      }
      
      const res = await axios.get(url, { timeout: 10000 });
      
      const billsData = (res.data.bills || []).map(bill => ({
        ...bill,
        items: (bill.items || []).map(item => ({
          ...item,
          name: item.name || item.productName || "Unknown"
        }))
      }));
      
      setBills(billsData);
      setSummary(res.data.summary || {});
      calculateStatistics(billsData, res.data.summary || {});
      
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (billsData, summaryData) => {
    const totalBills = billsData.length;
    const averageBillValue = totalBills > 0 ? summaryData.grandTotal / totalBills : 0;
    
    const collectionRate = summaryData.grandTotal > 0
      ? (summaryData.totalPaid / summaryData.grandTotal) * 100
      : 0;
    
    const productSales = {};
    const productQuantity = {};
    
    billsData.forEach(bill => {
      if (bill.items) {
        bill.items.forEach(item => {
          const name = item.name;
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          const total = price * quantity;
          
          productSales[name] = (productSales[name] || 0) + total;
          productQuantity[name] = (productQuantity[name] || 0) + quantity;
        });
      }
    });
    
    const allTopProducts = Object.entries(productSales)
      .map(([name, revenue]) => ({
        name,
        revenue,
        quantity: productQuantity[name],
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    const customerSpending = {};
    billsData.forEach(bill => {
      const customer = bill.customer || "Walk-in";
      customerSpending[customer] = (customerSpending[customer] || 0) + (bill.total || 0);
    });
    
    const topCustomers = Object.entries(customerSpending)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    const paymentMethods = {};
    billsData.forEach(bill => {
      const method = bill.paymentMethod || "Other";
      paymentMethods[method] = (paymentMethods[method] || 0) + (bill.paid || 0);
    });
    
    const paymentMethodBreakdown = Object.entries(paymentMethods).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
    
    const trends = {};
    billsData.forEach(bill => {
      const date = new Date(bill.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      trends[date] = (trends[date] || 0) + (bill.total || 0);
    });
    
    const dailyTrends = Object.entries(trends)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setStats({
      totalBills,
      averageBillValue,
      collectionRate,
      topCustomers,
      allTopProducts,
      paymentMethodBreakdown,
      dailyTrends
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, from, to]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              <h1 className="text-xl font-bold">Business Analytics</h1>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-all"
            >
              Full Reports →
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none"
              disabled={loading}
            >
              <option value="daily" className="text-gray-900">Daily</option>
              <option value="weekly" className="text-gray-900">Weekly</option>
              <option value="monthly" className="text-gray-900">Monthly</option>
              <option value="custom" className="text-gray-900">Custom</option>
            </select>

            {period === "custom" && (
              <>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <button
                  onClick={fetchDashboardData}
                  className="px-4 py-1.5 text-sm bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-all"
                >
                  Apply
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <p className="text-sm">{error}</p>
            <button onClick={fetchDashboardData} className="mt-2 text-sm font-medium underline">Try Again</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-3 text-gray-500">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards with Icons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">₹{summary.grandTotal.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">Sales Revenue</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-400">Received</span>
                </div>
                <div className="text-2xl font-bold text-green-600">₹{summary.totalPaid.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">Total Paid</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-xs text-gray-400">Pending</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">₹{summary.totalDue.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">Total Due</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Percent className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-400">Efficiency</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{stats.collectionRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500 mt-1">Collection Rate</div>
              </div>
            </div>

            {/* Secondary KPI Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-blue-600 font-medium mb-1">Total Bills</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalBills}</div>
                  </div>
                  <Receipt className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-600 font-medium mb-1">Average Bill</div>
                    <div className="text-2xl font-bold text-gray-900">₹{stats.averageBillValue.toFixed(2)}</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>

            {/* All Products Section with Gradient Header */}
            {stats.allTopProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">All Products</h3>
                    <span className="text-xs text-gray-500 ml-auto">{stats.allTopProducts.length} items</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product Name</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.allTopProducts.slice(0, 8).map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{product.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">₹{product.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Sales Trend */}
              {stats.dailyTrends.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Sales Trend</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={stats.dailyTrends}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '8px 12px'
                        }} 
                      />
                      <Area type="monotone" dataKey="total" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Payment Methods */}
              {stats.paymentMethodBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Payment Methods</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.paymentMethodBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {stats.paymentMethodBreakdown.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {stats.paymentMethodBreakdown.map((method, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                        <span className="text-xs text-gray-600">{method.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top Customers */}
            {stats.topCustomers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Top Customers</h3>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {stats.topCustomers.map((customer, idx) => (
                    <div key={idx} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-sm text-gray-700">{customer.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">₹{customer.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Bills */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
                  <Calendar className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bill No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bills.slice(0, 5).map((bill, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">#{bill.billNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(bill.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{bill.customer || "Walk-in"}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">₹{bill.total}</td>
                        <td className="px-4 py-3 text-center">
                          {bill.due === 0 ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Paid</span>
                          ) : bill.paid === 0 ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Unpaid</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Partial</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bills.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions with Gradient Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/pos')}
                className="group relative py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  New Sale
                </span>
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                View Detailed Reports
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;