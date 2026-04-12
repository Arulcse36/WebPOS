import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area, Legend
} from 'recharts';
import {
  TrendingUp, Wallet, CreditCard, Percent, Package, Users, Receipt,
  PlusCircle, BarChart3, Calendar, ShoppingBag, ArrowUp, ArrowDown,
  Activity, Clock, Banknote, Smartphone
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// ─── Format helpers ────────────────────────────────────────────────────────
const fmt = (v = 0) => `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCurrency = (v) => `₹${Number(v || 0).toFixed(2)}`;

// ─── Status badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ bill }) => {
  if (bill.due <= 0) return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">PAID</span>;
  if (bill.paid <= 0) return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">UNPAID</span>;
  return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">PARTIAL</span>;
};

// ══════════════════════════════════════════════════════════════════════════════
// TODAY'S COLLECTION SUMMARY CARD (Vibrant colors with different backgrounds)
// ══════════════════════════════════════════════════════════════════════════════
const TodayCollectionCard = ({ collection }) => {
  const cashPercentage = collection.total > 0 ? (collection.cash / collection.total) * 100 : 0;
  const upiPercentage = collection.total > 0 ? (collection.upi / collection.total) * 100 : 0;
  
  return (
    <div className="mb-6">
      {/* Three column layout with different colors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Card - Purple Gradient */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start mb-3">
            <span className="text-purple-100 text-sm font-medium">Today Total Collection</span>
            <Wallet className="w-5 h-5 text-purple-200" />
          </div>
          <p className="text-3xl font-bold mb-1">{fmt(collection.total)}</p>
          <p className="text-purple-200 text-xs">{collection.billCount} bills</p>
        </div>
        
        {/* Cash Card - Green Gradient */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start mb-3">
            <span className="text-green-100 text-sm font-medium">Today Cash Collection</span>
            <Banknote className="w-5 h-5 text-green-200" />
          </div>
          <p className="text-3xl font-bold mb-1">{fmt(collection.cash)}</p>
          <div className="flex justify-between items-center">
            <span className="text-green-200 text-xs">{cashPercentage.toFixed(1)}% of total</span>
            <div className="w-16 bg-green-400/30 rounded-full h-1.5">
              <div className="bg-white rounded-full h-1.5" style={{ width: `${cashPercentage}%` }} />
            </div>
          </div>
        </div>
        
        {/* UPI Card - Blue Gradient */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start mb-3">
            <span className="text-blue-100 text-sm font-medium">Today UPI Collection</span>
            <Smartphone className="w-5 h-5 text-blue-200" />
          </div>
          <p className="text-3xl font-bold mb-1">{fmt(collection.upi)}</p>
          <div className="flex justify-between items-center">
            <span className="text-blue-200 text-xs">{upiPercentage.toFixed(1)}% of total</span>
            <div className="w-16 bg-blue-400/30 rounded-full h-1.5">
              <div className="bg-white rounded-full h-1.5" style={{ width: `${upiPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({ grandTotal: 0, totalPaid: 0, totalDue: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [todayCollection, setTodayCollection] = useState({ cash: 0, upi: 0, total: 0, billCount: 0 });
  const [stats, setStats] = useState({
    totalBills: 0, averageBillValue: 0, collectionRate: 0,
    topCustomers: [], allTopProducts: [], paymentMethodBreakdown: [],
    dailyTrends: [], hourlyTrends: [], weeklyTrends: [], monthlyTrends: [],
    categoryBreakdown: [], brandBreakdown: [], customerRetention: [], peakHours: []
  });

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

  const fetchTodayCollection = async () => {
    if (!companyId) return;
    try {
      const res = await axios.get(
        `${API}/reports/today-collection-detailed?companyId=${companyId}`,
        { timeout: 12000 }
      );
      if (res.data.success) {
        const sm = res.data.summary;
        setTodayCollection({
          cash: sm.totalCash || 0,
          upi: sm.totalUpi || 0,
          total: sm.totalCollected || 0,
          billCount: sm.totalBills || 0,
        });
      }
    } catch (err) {
      console.error("Collection fetch failed:", err);
    }
  };

  const fetchDashboardAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API}/reports/dashboard-analytics?period=${period}`;
      if (!isSuperAdmin && companyId) url += `&companyId=${companyId}`;
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
        setStats(prev => ({
          ...prev,
          categoryBreakdown: res.data.categories || [],
          brandBreakdown: res.data.brands || [],
          allTopProducts: res.data.topProducts || [],
          dailyTrends: res.data.dailyTrends || []
        }));
        if (res.data.recentBills) setBills(res.data.recentBills);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalStats = async () => {
    try {
      let url = `${API}/reports/bills?type=${period}`;
      if (!isSuperAdmin && companyId) url += `&companyId=${companyId}`;
      if (period === "custom") {
        if (!from || !to) return;
        url += `&from=${from}&to=${to}`;
      }
      const res = await axios.get(url, { timeout: 10000 });
      const billsData = res.data.bills || [];
      const grandTotal = res.data.summary?.grandTotal || 0;
      const totalPaid = res.data.summary?.totalPaid || 0;
      const totalBills = billsData.length;

      const customerSpending = {}, paymentMethods = {}, hourTrends = {}, weekTrends = {}, monthTrends = {}, customerFrequency = {};
      billsData.forEach(bill => {
        const customer = bill.customer || "Walk-in";
        const method = bill.paymentMethod || "other";
        const hour = new Date(bill.date).getHours();
        const hLabel = `${hour.toString().padStart(2, "0")}:00`;
        const date = new Date(bill.date);
        const wk = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        const mo = date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        customerSpending[customer] = (customerSpending[customer] || 0) + (bill.total || 0);
        paymentMethods[method] = (paymentMethods[method] || 0) + (bill.paid || 0);
        hourTrends[hLabel] = (hourTrends[hLabel] || 0) + (bill.total || 0);
        weekTrends[`Week ${wk}`] = (weekTrends[`Week ${wk}`] || 0) + (bill.total || 0);
        monthTrends[mo] = (monthTrends[mo] || 0) + (bill.total || 0);
        customerFrequency[customer] = (customerFrequency[customer] || 0) + 1;
      });

      const topCustomers = Object.entries(customerSpending).map(([n, t]) => ({ name: n, total: t })).sort((a, b) => b.total - a.total).slice(0, 5);
      const paymentMethodBreakdown = Object.entries(paymentMethods).map(([n, v]) => ({ name: n.charAt(0).toUpperCase() + n.slice(1), value: v }));
      const hourlyTrends = Object.entries(hourTrends).map(([h, t]) => ({ hour: h, total: t })).sort((a, b) => a.hour.localeCompare(b.hour));
      const peakHours = [...hourlyTrends].sort((a, b) => b.total - a.total).slice(0, 5);
      const weeklyTrends = Object.entries(weekTrends).map(([w, t]) => ({ week: w, total: t }));
      const monthlyTrends = Object.entries(monthTrends).map(([m, t]) => ({ month: m, total: t }));
      const customerRetention = Object.entries(customerFrequency).map(([n, f]) => ({ name: n, frequency: f })).sort((a, b) => b.frequency - a.frequency).slice(0, 10);

      setStats(prev => ({
        ...prev,
        totalBills,
        averageBillValue: totalBills > 0 ? grandTotal / totalBills : 0,
        collectionRate: grandTotal > 0 ? (totalPaid / grandTotal) * 100 : 0,
        topCustomers,
        paymentMethodBreakdown,
        hourlyTrends,
        weeklyTrends,
        monthlyTrends,
        peakHours,
        customerRetention
      }));
      setSummary({ grandTotal, totalPaid, totalDue: res.data.summary?.totalDue || 0 });
      setBills(billsData.slice(0, 5));
    } catch (err) {
      console.error("Additional stats error:", err);
    }
  };

  useEffect(() => {
    if (companyId || isSuperAdmin) {
      fetchTodayCollection();
      fetchDashboardAnalytics();
      fetchAdditionalStats();
    }
  }, [period, from, to, companyId]);

  const formatDate = d => !d ? "N/A" : new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];

  const currentPeriodTotal = stats.dailyTrends.reduce((s, d) => s + d.total, 0);
  const previousPeriodTotal = stats.dailyTrends.slice(0, -1).reduce((s, d) => s + d.total, 0);
  const growth = previousPeriodTotal === 0 ? (currentPeriodTotal > 0 ? 100 : 0) : ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;

  if (!userType && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-4">Please login to access the dashboard.</p>
          <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2"><BarChart3 className="w-6 h-6" /><h1 className="text-xl font-bold">{isSuperAdmin ? "Super Admin Dashboard" : "Business Analytics"}</h1></div>
            <button onClick={() => navigate('/reports')} className="px-3 py-1.5 bg-white/10 rounded-lg text-sm hover:bg-white/20">Full Reports →</button>
          </div>
          {isSuperAdmin && <div className="mb-3 p-2 bg-purple-500/30 rounded-lg text-center text-sm">👑 Super Admin — all companies</div>}
          {!isSuperAdmin && user?.companyName && <div className="mb-3 p-2 bg-blue-500/30 rounded-lg text-center text-sm">🏢 {user.companyName}</div>}
          <div className="flex flex-wrap gap-2">
            <select value={period} onChange={e => setPeriod(e.target.value)} disabled={loading} className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none">
              <option value="daily" className="text-gray-900">Daily</option>
              <option value="weekly" className="text-gray-900">Weekly</option>
              <option value="monthly" className="text-gray-900">Monthly</option>
              <option value="custom" className="text-gray-900">Custom</option>
            </select>
            {period === "custom" && (
              <>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white" />
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white" />
                <button onClick={fetchDashboardAnalytics} className="px-4 py-1.5 text-sm bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100">Apply</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error} <button onClick={fetchDashboardAnalytics} className="ml-2 underline font-medium">Retry</button></div>}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-gray-500 text-sm">Loading dashboard…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Today's Collection Cards with different colors */}
            <TodayCollectionCard collection={todayCollection} />

            {/* Growth */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Period Revenue</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(currentPeriodTotal)}</span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {growth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {Math.abs(growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.grandTotal)}</div>
                <div className="text-xs text-gray-500 mt-1">Sales Revenue</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-50 rounded-lg"><Wallet className="w-5 h-5 text-green-600" /></div>
                  <span className="text-xs text-gray-400">Received</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</div>
                <div className="text-xs text-gray-500 mt-1">Total Paid</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-orange-50 rounded-lg"><CreditCard className="w-5 h-5 text-orange-600" /></div>
                  <span className="text-xs text-gray-400">Pending</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalDue)}</div>
                <div className="text-xs text-gray-500 mt-1">Total Due</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-50 rounded-lg"><Percent className="w-5 h-5 text-purple-600" /></div>
                  <span className="text-xs text-gray-400">Efficiency</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{stats.collectionRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500 mt-1">Collection Rate</div>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-600 font-medium mb-1">Total Bills</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalBills}</div>
                </div>
                <Receipt className="w-8 h-8 text-blue-300" />
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-green-600 font-medium mb-1">Average Bill</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageBillValue)}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-300" />
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-orange-600 font-medium mb-1">Peak Hour</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.peakHours[0]?.hour || "—"}</div>
                </div>
                <Clock className="w-8 h-8 text-orange-300" />
              </div>
            </div>

            {/* Charts */}
            {stats.dailyTrends.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Sales Trend</h3></div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={stats.dailyTrends}>
                    <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <Tooltip contentStyle={{ background: 'white', border: 'none', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} formatter={v => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="url(#gr)" name="Revenue" />
                    <Line type="monotone" dataKey="total" stroke="#10B981" strokeDasharray="5 5" dot={false} name="Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats.hourlyTrends.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-amber-500" /><h3 className="font-semibold text-gray-900">Hourly Distribution</h3></div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.hourlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip formatter={v => formatCurrency(v)} />
                    <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                      {stats.hourlyTrends.map((e, i) => <Cell key={i} fill={e.total > 0 ? '#F59E0B' : '#E5E7EB'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-gray-400 mt-2">Peak: {stats.peakHours.map(h => h.hour).join(", ")}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {stats.weeklyTrends.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><Calendar className="w-5 h-5 text-violet-600" /><h3 className="font-semibold text-gray-900">Weekly</h3></div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Bar dataKey="total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {stats.monthlyTrends.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><Calendar className="w-5 h-5 text-emerald-600" /><h3 className="font-semibold text-gray-900">Monthly</h3></div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {stats.categoryBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><Package className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-900">By Category</h3></div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={stats.categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="revenue" stroke="none">
                        {stats.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {stats.brandBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><ShoppingBag className="w-5 h-5 text-emerald-600" /><h3 className="font-semibold text-gray-900">By Brand</h3></div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={stats.brandBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="revenue" stroke="none">
                        {stats.brandBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {stats.allTopProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Top Products</h3>
                  <span className="ml-auto text-xs text-gray-400">{stats.allTopProducts.length} items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["#", "Product", "Qty", "Revenue", "%"].map((h, i) => (
                          <th key={i} className={`px-4 py-3 text-xs font-semibold text-gray-500 ${i > 1 ? "text-right" : "text-left"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.allTopProducts.slice(0, 10).map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-400 font-bold">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{p.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">{p.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">{formatCurrency(p.revenue)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-400">{summary.grandTotal > 0 ? ((p.revenue / summary.grandTotal) * 100).toFixed(1) : "0.0"}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {stats.paymentMethodBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><CreditCard className="w-5 h-5 text-emerald-600" /><h3 className="font-semibold text-gray-900">Payment Methods</h3></div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={stats.paymentMethodBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                        {stats.paymentMethodBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {stats.paymentMethodBreakdown.map((m, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-gray-500">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats.customerRetention.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-violet-600" /><h3 className="font-semibold text-gray-900">Customer Retention</h3></div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.customerRetention.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} width={90} />
                      <Tooltip />
                      <Bar dataKey="frequency" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {stats.topCustomers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-600" />
                  <h3 className="font-semibold text-gray-900">Top Customers</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {stats.topCustomers.map((c, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                        <span className="text-sm text-gray-700">{c.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Bill No", "Date", "Customer", "Amount", "Status"].map((h, i) => (
                        <th key={i} className={`px-4 py-3 text-xs font-semibold text-gray-500 ${i === 3 ? "text-right" : i === 4 ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bills.slice(0, 5).map((bill, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">#{bill.billNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(bill.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{bill.customer || "Walk-in"}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(bill.total)}</td>
                        <td className="px-4 py-3 text-center">
                          {bill.due === 0 ? (
                            <span className="px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">Paid</span>
                          ) : bill.paid === 0 ? (
                            <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">Unpaid</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">Partial</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bills.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/pos')} className="py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all">
                <PlusCircle className="w-5 h-5" />New Sale
              </button>
              <button onClick={() => navigate('/reports')} className="py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-300 hover:bg-blue-50 transition-all">
                Detailed Reports
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;