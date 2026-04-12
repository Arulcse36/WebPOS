import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
  ComposedChart, Legend
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
  Calendar,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  Banknote,
  Smartphone
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

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
  const [todayCollection, setTodayCollection] = useState({
    cash: 0,
    upi: 0,
    total: 0,
    billCount: 0
  });
  const [stats, setStats] = useState({
    totalBills: 0,
    averageBillValue: 0,
    collectionRate: 0,
    topCustomers: [],
    allTopProducts: [],
    paymentMethodBreakdown: [],
    dailyTrends: [],
    hourlyTrends: [],
    weeklyTrends: [],
    monthlyTrends: [],
    categoryBreakdown: [],
    brandBreakdown: [],
    customerRetention: [],
    peakHours: []
  });

  // Get user type and companyId from localStorage
  const userType = localStorage.getItem("userType");
  const isSuperAdmin = localStorage.getItem("isSuperAdmin") === "true";
  const companyId = localStorage.getItem("companyId");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (period === "custom") {
      const today = new Date().toISOString().split("T")[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      setFrom(lastWeek.toISOString().split("T")[0]);
      setTo(today);
    }
  }, [period]);

  // ✅ Fetch today's Cash and UPI Collection
  const fetchTodayCollection = async () => {
    if (!companyId && !isSuperAdmin) return;
    
    try {
      let url = `${API}/reports/today-collection`;
      
      if (!isSuperAdmin && companyId) {
        url += `?companyId=${companyId}`;
      } else if (isSuperAdmin) {
        // For super admin, you might want to show all companies or a specific one
        url += `?companyId=${companyId || ''}`;
      }
      
      const res = await axios.get(url, { timeout: 10000 });
      
      if (res.data.success) {
        setTodayCollection({
          cash: res.data.data.cash || 0,
          upi: res.data.data.upi || 0,
          total: res.data.data.cash+ res.data.data.upi|| 0,
          billCount: res.data.data.billCount || 0
        });
      }
    } catch (err) {
      console.error("Error fetching today's collection:", err);
      // Don't set error for this, just log it
    }
  };

  // ✅ NEW: Fetch dashboard analytics with category and brand data
  const fetchDashboardAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API}/reports/dashboard-analytics?period=${period}`;

      if (!isSuperAdmin && companyId) {
        url += `&companyId=${companyId}`;
      }

      if (period === "custom") {
        if (!from || !to) {
          alert("Please select date range");
          setLoading(false);
          return;
        }
        url += `&from=${from}&to=${to}`;
      }
      
      const res = await axios.get(url, { timeout: 10000 });
      
      if (res.data.success) {
        // Update stats with category and brand data from the new API
        setStats(prev => ({
          ...prev,
          categoryBreakdown: res.data.categories || [],
          brandBreakdown: res.data.brands || [],
          allTopProducts: res.data.topProducts || [],
          dailyTrends: res.data.dailyTrends || []
        }));
        
        // Also update bills data for recent transactions
        if (res.data.recentBills) {
          setBills(res.data.recentBills);
        }
        
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
      
    } catch (err) {
      console.error("Error fetching dashboard analytics:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch additional statistics (customers, payment methods, etc.)
  const fetchAdditionalStats = async () => {
    try {
      let url = `${API}/reports/bills?type=${period}`;

      if (!isSuperAdmin && companyId) {
        url += `&companyId=${companyId}`;
      }

      if (period === "custom") {
        if (!from || !to) return;
        url += `&from=${from}&to=${to}`;
      }
      
      const res = await axios.get(url, { timeout: 10000 });
      
      const billsData = (res.data.bills || []);
      
      // Calculate additional statistics
      const totalBills = billsData.length;
      const averageBillValue = totalBills > 0 ? (res.data.summary?.grandTotal || 0) / totalBills : 0;
      
      const collectionRate = (res.data.summary?.grandTotal || 0) > 0
        ? ((res.data.summary?.totalPaid || 0) / (res.data.summary?.grandTotal || 0)) * 100
        : 0;
      
      // Customer Spending
      const customerSpending = {};
      billsData.forEach(bill => {
        const customer = bill.customer || "Walk-in";
        customerSpending[customer] = (customerSpending[customer] || 0) + (bill.total || 0);
      });
      
      const topCustomers = Object.entries(customerSpending)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      
      // Payment Methods
      const paymentMethods = {};
      billsData.forEach(bill => {
        const method = bill.paymentMethod || "Other";
        paymentMethods[method] = (paymentMethods[method] || 0) + (bill.paid || 0);
      });
      
      const paymentMethodBreakdown = Object.entries(paymentMethods).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
      
      // Hourly Trends
      const hourTrends = {};
      billsData.forEach(bill => {
        const hour = new Date(bill.date).getHours();
        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
        hourTrends[hourLabel] = (hourTrends[hourLabel] || 0) + (bill.total || 0);
      });
      
      const hourlyTrends = Object.entries(hourTrends)
        .map(([hour, total]) => ({ hour, total }))
        .sort((a, b) => a.hour.localeCompare(b.hour));
      
      const peakHours = hourlyTrends
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      
      // Weekly Trends
      const weekTrends = {};
      billsData.forEach(bill => {
        const date = new Date(bill.date);
        const weekNum = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        const weekLabel = `Week ${weekNum}`;
        weekTrends[weekLabel] = (weekTrends[weekLabel] || 0) + (bill.total || 0);
      });
      
      const weeklyTrends = Object.entries(weekTrends)
        .map(([week, total]) => ({ week, total }));
      
      // Monthly Trends
      const monthTrends = {};
      billsData.forEach(bill => {
        const month = new Date(bill.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        monthTrends[month] = (monthTrends[month] || 0) + (bill.total || 0);
      });
      
      const monthlyTrends = Object.entries(monthTrends)
        .map(([month, total]) => ({ month, total }));
      
      // Customer Retention
      const customerFrequency = {};
      billsData.forEach(bill => {
        const customer = bill.customer || "Walk-in";
        customerFrequency[customer] = (customerFrequency[customer] || 0) + 1;
      });
      
      const customerRetention = Object.entries(customerFrequency)
        .map(([name, frequency]) => ({ name, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);
      
      setStats(prev => ({
        ...prev,
        totalBills,
        averageBillValue,
        collectionRate,
        topCustomers,
        paymentMethodBreakdown,
        hourlyTrends,
        weeklyTrends,
        monthlyTrends,
        peakHours,
        customerRetention
      }));
      
      setSummary({
        grandTotal: res.data.summary?.grandTotal || 0,
        totalPaid: res.data.summary?.totalPaid || 0,
        totalDue: res.data.summary?.totalDue || 0
      });
      
      setBills(billsData.slice(0, 5));
      
    } catch (err) {
      console.error("Error fetching additional stats:", err);
    }
  };

  useEffect(() => {
    if (companyId || isSuperAdmin) {
      fetchTodayCollection();
      fetchDashboardAnalytics();
      fetchAdditionalStats();
    }
  }, [period, from, to, companyId]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatCurrency = (value) => {
    return `₹${value.toFixed(2)}`;
  };

  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];

  // Calculate period-over-period growth
  const previousPeriodTotal = stats.dailyTrends.length > 1 
    ? stats.dailyTrends.slice(0, -1).reduce((sum, d) => sum + d.total, 0)
    : 0;
  const currentPeriodTotal = stats.dailyTrends.length > 0
    ? stats.dailyTrends.reduce((sum, d) => sum + d.total, 0)
    : 0;
  const growth = calculateGrowth(currentPeriodTotal, previousPeriodTotal);

  // If not logged in, redirect to login
  if (!userType && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-4">Please login to access the dashboard.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              <h1 className="text-xl font-bold">
                {isSuperAdmin ? "Super Admin Dashboard" : "Business Analytics"}
              </h1>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-all"
            >
              Full Reports →
            </button>
          </div>
          
          {/* Super Admin Info Banner */}
          {isSuperAdmin && (
            <div className="mb-3 p-2 bg-purple-500/30 rounded-lg text-center text-sm">
              👑 You are logged in as Super Admin - Viewing all companies data
            </div>
          )}
          
          {/* Company Info for Regular Admin */}
          {!isSuperAdmin && user?.companyName && (
            <div className="mb-3 p-2 bg-blue-500/30 rounded-lg text-center text-sm">
              🏢 Company: {user.companyName}
            </div>
          )}
          
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
                  onClick={fetchDashboardAnalytics}
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
            <button onClick={fetchDashboardAnalytics} className="mt-2 text-sm font-medium underline">Try Again</button>
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
            {/* Today's Collection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Today's Cash Collection</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(todayCollection.cash)}</p>
                  </div>
                  <Banknote className="w-10 h-10 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Today's UPI Collection</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(todayCollection.upi)}</p>
                  </div>
                  <Smartphone className="w-10 h-10 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Today's Total Collection</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(todayCollection.total)}</p>
                   
                  </div>
                  <Wallet className="w-10 h-10 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Growth Indicator Card */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Period-over-Period Growth</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(currentPeriodTotal)}</span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {growth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {Math.abs(growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            {/* KPI Cards with Icons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.grandTotal)}</div>
                <div className="text-xs text-gray-500 mt-1">Sales Revenue</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-400">Received</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</div>
                <div className="text-xs text-gray-500 mt-1">Total Paid</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-xs text-gray-400">Pending</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalDue)}</div>
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
            <div className="grid grid-cols-3 gap-4 mb-6">
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
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageBillValue)}</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-orange-600 font-medium mb-1">Peak Hour Sales</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.peakHours[0]?.hour || "N/A"}
                    </div>
                  </div>
                  <Clock className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </div>

            {/* Rest of your dashboard content remains the same */}
            {/* Enhanced Sales Trend Chart with Area and Line */}
            {stats.dailyTrends.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Sales Trend Analysis</h3>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={stats.dailyTrends}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="total" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                    <Line type="monotone" dataKey="total" stroke="#10B981" strokeDasharray="5 5" dot={false} name="Trend Line" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Hourly Sales Heat Map */}
            {stats.hourlyTrends.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Hourly Sales Distribution</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.hourlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="#F59E0B" radius={[4, 4, 0, 0]}>
                      {stats.hourlyTrends.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#F59E0B' : '#E5E7EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 text-center text-xs text-gray-500">
                  Peak Hours: {stats.peakHours.map(h => h.hour).join(', ')}
                </div>
              </div>
            )}

            {/* Multi-Period Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {stats.weeklyTrends.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Weekly Performance</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {stats.monthlyTrends.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Monthly Performance</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={stats.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category and Brand Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {stats.categoryBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Sales by Category</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                        stroke="none"
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {stats.brandBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Sales by Brand</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.brandBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                        stroke="none"
                      >
                        {stats.brandBreakdown.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* All Products Table */}
            {stats.allTopProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Top Selling Products</h3>
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
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.allTopProducts.slice(0, 10).map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{product.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{formatCurrency(product.revenue)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">
                            {((product.revenue / summary.grandTotal) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Methods and Customer Retention */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                      <Tooltip formatter={(value) => formatCurrency(value)} />
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

              {stats.customerRetention.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Customer Retention</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.customerRetention.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={100} />
                      <Tooltip />
                      <Bar dataKey="frequency" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(customer.total)}</span>
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
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(bill.total)}</td>
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

            {/* Quick Actions */}
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