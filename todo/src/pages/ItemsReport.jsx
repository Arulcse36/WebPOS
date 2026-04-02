import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { handlePrintBill } from '../utils/printBill';
import { formatCurrency } from '../utils/formatters';

const API = import.meta.env.VITE_API_URL;

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  });
};

// ── Sub-components ─────────────────────────────────────────────────────────
const SummaryCard = ({ title, value, sub, color }) => {
  const colors = {
    blue:   "border-blue-500 text-blue-600",
    green:  "border-green-500 text-green-600",
    orange: "border-orange-500 text-orange-500",
    purple: "border-purple-500 text-purple-600",
  };
  return (
    <div className={`bg-white rounded-lg shadow p-3 border-l-4 ${colors[color]}`}>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{title}</div>
      <div className={`text-lg font-bold ${colors[color].split(" ")[1]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
};

// ── Bills Modal ────────────────────────────────────────────────────────────
const BillsModal = ({ product, bills, onClose, onPrint }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-4 border-b flex justify-between items-start">
        <div>
          <h3 className="font-bold text-base text-gray-900">Bills for Product</h3>
          <p className="text-sm text-gray-500 mt-0.5">{product}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {bills.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No bills found</div>
        ) : (
          bills.map((bill, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm text-gray-900">#{bill.billNumber}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{formatDate(bill.date)}</div>
                  <div className="text-xs text-gray-500">{bill.customer || "Walk-in"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Qty: <span className="font-bold text-gray-900">{bill.quantity}</span></div>
                  <div className="text-xs text-gray-600">Price: <span className="font-bold text-blue-600">{formatCurrency(bill.price)}</span></div>
                  <div className="text-xs text-gray-600">Total: <span className="font-bold text-green-600">{formatCurrency(bill.total)}</span></div>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => onPrint(bill.fullBill)}
                  className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded font-medium"
                >
                  🖨️ Print Bill
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const ItemsReport = () => {
  const [type, setType] = useState("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Sorting
  const [sortBy, setSortBy] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");

  // Modal
  const [modalProduct, setModalProduct] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("summary");

  // ── Set default custom dates ─────────────────────────────────────────────
  useEffect(() => {
    if (type === "custom") {
      const today = new Date().toISOString().split("T")[0];
      setFrom(today);
      setTo(today);
    }
  }, [type]);

  // ── Fetch customers ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${API}/bills/customers`);
        if (res.data.success) setCustomers(res.data.customers);
      } catch (e) {
        console.error("Customers fetch error:", e);
      }
    };
    fetchCustomers();
  }, []);

  // ── Fetch products (for category lookup) ─────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API}/products`);
        setProducts(res.data);
      } catch (e) {
        console.error("Products fetch error:", e);
      }
    };
    fetchProducts();
  }, []);

  // ── Fetch bills ──────────────────────────────────────────────────────────
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API}/reports/bills?type=${type}`;
      if (type === "custom") {
        if (!from || !to) { alert("Please select date range"); setLoading(false); return; }
        url += `&from=${from}&to=${to}`;
      }
      if (customerFilter) url += `&customer=${encodeURIComponent(customerFilter)}`;
      const res = await axios.get(url, { timeout: 10000 });
      setBills(res.data.bills || []);
    } catch (err) {
      const msg = err.message === "Network Error"
        ? "Network error. Please check your connection."
        : `Failed to load report: ${err.message}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [type, from, to, customerFilter]);

  // ── Build name → category lookup from products list ───────────────────────
  const productCategoryMap = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const catVal = p.category;
      let catName = "";
      if (!catVal) catName = "";
      else if (typeof catVal === "string") catName = catVal;
      else if (typeof catVal === "object") catName = catVal.name || "";
      map[p.name] = catName;
    });
    return map;
  }, [products]);

  // ── Derive product summary from bills ─────────────────────────────────────
  const { productMap, allCategories, totalRevenue, totalQty, topProduct } = useMemo(() => {
    const map = {};

    bills.forEach(bill => {
      (bill.items || []).forEach(item => {
        const name = item.name || item.productName || "Unknown";
        // Look up category from products list since bill items don't carry it
        const category = productCategoryMap[name] || item.category || item.productCategory || "";
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const total = qty * price;

        if (!map[name]) {
          map[name] = { name, category, qty: 0, revenue: 0, bills: [] };
        }
        map[name].qty += qty;
        map[name].revenue += total;
        map[name].bills.push({
          billNumber: bill.billNumber,
          date: bill.date || bill.billDate,
          customer: bill.customer || bill.customerName || "Walk-in",
          quantity: qty,
          price,
          total,
          fullBill: bill,
        });
      });
    });

    const cats = [...new Set(Object.values(map).map(p => p.category).filter(Boolean))].sort();
    const totalRev = Object.values(map).reduce((s, p) => s + p.revenue, 0);
    const totalQ = Object.values(map).reduce((s, p) => s + p.qty, 0);
    const top = Object.values(map).sort((a, b) => b.revenue - a.revenue)[0] || null;

    return { productMap: map, allCategories: cats, totalRevenue: totalRev, totalQty: totalQ, topProduct: top };
  }, [bills, productCategoryMap]);

  // ── Filtered + sorted product list ────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = Object.values(productMap);
    if (categoryFilter) list = list.filter(p => p.category === categoryFilter);
    if (searchFilter)   list = list.filter(p => p.name.toLowerCase().includes(searchFilter.toLowerCase()));
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "revenue")     cmp = a.revenue - b.revenue;
      else if (sortBy === "qty")    cmp = a.qty - b.qty;
      else if (sortBy === "name")   cmp = a.name.localeCompare(b.name);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [productMap, categoryFilter, searchFilter, sortBy, sortDir]);

  // ── Top 10 products ────────────────────────────────────────────────────────
  const top10 = useMemo(() =>
    [...filteredProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    [filteredProducts]
  );

  // ── Item-level breakdown ───────────────────────────────────────────────────
  const breakdown = useMemo(() => {
    const rows = [];
    bills.forEach(bill => {
      (bill.items || []).forEach(item => {
        const name = item.name || item.productName || "Unknown";
        const category = productCategoryMap[name] || item.category || "";
        if (searchFilter && !name.toLowerCase().includes(searchFilter.toLowerCase())) return;
        if (categoryFilter && category !== categoryFilter) return;
        rows.push({
          billNumber: bill.billNumber,
          date: bill.date || bill.billDate,
          customer: bill.customer || bill.customerName || "Walk-in",
          product: name,
          category,
          qty: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
          fullBill: bill,
        });
      });
    });
    return rows;
  }, [bills, searchFilter, categoryFilter, productCategoryMap]);

  // ── Sort toggle ────────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const exportSummaryCSV = () => {
    const rows = [
      ["Product", "Category", "Qty Sold", "Revenue"],
      ...filteredProducts.map(p => [p.name, p.category, p.qty, p.revenue.toFixed(2)])
    ];
    downloadCSV(rows, `items_summary_${type}_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const exportBreakdownCSV = () => {
    const rows = [
      ["Bill No", "Date", "Customer", "Product", "Category", "Qty", "Price", "Total"],
      ...breakdown.map(r => [r.billNumber, formatDate(r.date), r.customer, r.product, r.category, r.qty, r.price, r.total.toFixed(2)])
    ];
    downloadCSV(rows, `items_breakdown_${type}_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const downloadCSV = (rows, filename) => {
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Print item summary receipt ─────────────────────────────────────────────
  const printItemsSummary = () => {
    const ESC = "\x1B", GS = "\x1D";
    const BOLD_ON = ESC + "E\x01", BOLD_OFF = ESC + "E\x00";
    const ALIGN_CENTER = ESC + "a\x01", ALIGN_LEFT = ESC + "a\x00";
    const FONT_NORMAL = GS + "!\x00";
    const CUT = GS + "V\x41\x00";
    const LINE = "-".repeat(48);

    const pad = (l, r, width = 48) => {
      const spaces = Math.max(1, width - String(l).length - String(r).length);
      return String(l) + " ".repeat(spaces) + String(r);
    };

    let p = FONT_NORMAL + ALIGN_CENTER;
    p += "YOUR SHOP NAME\n";
    p += `Items Report - ${type.toUpperCase()}\n`;
    p += `${new Date().toLocaleDateString("en-GB")}\n`;
    p += LINE + "\n";
    p += ALIGN_LEFT;
    p += BOLD_ON + pad("Product", "Qty / Revenue") + BOLD_OFF + "\n";
    p += LINE + "\n";

    filteredProducts.forEach(prod => {
      const right = `${prod.qty} / ₹${prod.revenue.toFixed(0)}`;
      const name = prod.name.substring(0, 48 - right.length - 1);
      p += pad(name, right) + "\n";
    });

    p += LINE + "\n";
    p += pad("TOTAL REVENUE:", `₹${totalRevenue.toFixed(2)}`) + "\n";
    p += LINE + "\n";
    p += ALIGN_CENTER + "Powered by POS System\n" + ALIGN_LEFT;
    p += CUT;

    try {
      window.location.href = `intent:${encodeURIComponent(p)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    } catch (e) {
      alert("Failed to print. Make sure RawBT is installed.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">📦 Items Sales Report</h1>
        <div className="flex gap-2">
          <button
            onClick={printItemsSummary}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700"
          >
            🖨️ Print
          </button>
          <button
            onClick={activeTab === "breakdown" ? exportBreakdownCSV : exportSummaryCSV}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700"
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
          <button onClick={fetchReport} className="ml-2 underline font-bold">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 mb-4 space-y-3">
        {/* Date type */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="p-2 border rounded-lg text-sm bg-white text-gray-800 outline-none"
            disabled={loading}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>

          {type === "custom" && (
            <>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="p-2 border rounded-lg bg-white text-gray-800 text-sm" disabled={loading} />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="p-2 border rounded-lg bg-white text-gray-800 text-sm" disabled={loading} />
              <button onClick={fetchReport} disabled={loading}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400">
                Apply
              </button>
            </>
          )}
        </div>

        {/* Category + Customer + Search */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="🔍 Search product..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="flex-1 min-w-[150px] p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 text-gray-900 bg-white"
          />

          {allCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white text-gray-800 outline-none"
            >
              <option value="">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            className="p-2 border rounded-lg text-sm bg-white text-gray-800 outline-none"
          >
            <option value="">All Customers</option>
            {customers.map((c, i) => (
              <option key={i} value={c}>{c === "Walk-in" ? "🚶 Walk-in" : `👤 ${c}`}</option>
            ))}
          </select>

          {(categoryFilter || customerFilter || searchFilter) && (
            <button
              onClick={() => { setCategoryFilter(""); setCustomerFilter(""); setSearchFilter(""); }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium text-gray-700"
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading report...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <SummaryCard title="Total Revenue"    value={formatCurrency(totalRevenue)} color="blue"   />
            <SummaryCard title="Total Bills"      value={bills.length}                 color="green"  />
            <SummaryCard title="Unique Products"  value={filteredProducts.length}      color="purple" />
            <SummaryCard
              title="Top Product"
              value={topProduct?.name?.substring(0, 16) || "—"}
              sub={topProduct ? formatCurrency(topProduct.revenue) : ""}
              color="orange"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-white rounded-lg shadow p-1 w-fit">
            {[
              { id: "summary",   label: "📊 Summary"  },
              { id: "breakdown", label: "📋 Breakdown" },
              { id: "top",       label: "🏆 Top 10"    },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: SUMMARY ──────────────────────────────────────────────── */}
          {activeTab === "summary" && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left w-6">#</th>
                    <th className="p-3 text-left cursor-pointer select-none" onClick={() => toggleSort("name")}>
                      Product <SortIcon field="name" />
                    </th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right cursor-pointer select-none" onClick={() => toggleSort("qty")}>
                      Qty Sold <SortIcon field="qty" />
                    </th>
                    <th className="p-3 text-right cursor-pointer select-none" onClick={() => toggleSort("revenue")}>
                      Revenue <SortIcon field="revenue" />
                    </th>
                    <th className="p-3 text-right">Avg Price</th>
                    <th className="p-3 text-center">Bills</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan="8" className="text-center p-8 text-gray-400">No products found</td></tr>
                  ) : (
                    filteredProducts.map((prod, i) => (
                      <tr key={prod.name} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="p-3 font-semibold text-gray-900">{prod.name}</td>
                        <td className="p-3 text-gray-500 text-xs">
                          {prod.category
                            ? <span className="bg-gray-100 px-2 py-0.5 rounded-full">{prod.category}</span>
                            : "—"}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">{prod.qty}</td>
                        <td className="p-3 text-right font-bold text-blue-600">{formatCurrency(prod.revenue)}</td>
                        <td className="p-3 text-right text-gray-600 text-xs">
                          {formatCurrency(prod.revenue / (prod.qty || 1))}
                        </td>
                        <td className="p-3 text-center text-sm font-bold text-gray-700">
                          {prod.bills.length}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setModalProduct(prod)}
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded text-xs font-medium"
                          >
                            📋 View Bills
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredProducts.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <tr>
                      <td colSpan="3" className="p-3 text-gray-700">TOTAL</td>
                      <td className="p-3 text-right text-gray-900">{totalQty}</td>
                      <td className="p-3 text-right text-blue-700">{formatCurrency(totalRevenue)}</td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* ── TAB: BREAKDOWN ────────────────────────────────────────────── */}
          {activeTab === "breakdown" && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left">Bill No</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Print</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.length === 0 ? (
                    <tr><td colSpan="9" className="text-center p-8 text-gray-400">No data found</td></tr>
                  ) : (
                    breakdown.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900 text-xs">#{row.billNumber}</td>
                        <td className="p-3 text-gray-600 text-xs">{formatDate(row.date)}</td>
                        <td className="p-3 text-gray-600 text-xs">{row.customer}</td>
                        <td className="p-3 font-medium text-gray-900">{row.product}</td>
                        <td className="p-3 text-xs text-gray-500">
                          {row.category
                            ? <span className="bg-gray-100 px-2 py-0.5 rounded-full">{row.category}</span>
                            : "—"}
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">{row.qty}</td>
                        <td className="p-3 text-right text-gray-600">{formatCurrency(row.price)}</td>
                        <td className="p-3 text-right font-bold text-blue-600">{formatCurrency(row.total)}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handlePrintBill(row.fullBill)}
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded text-xs"
                          >
                            🖨️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TAB: TOP 10 ───────────────────────────────────────────────── */}
          {activeTab === "top" && (
            <div className="space-y-2">
              {top10.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No data found</div>
              ) : (
                top10.map((prod, i) => {
                  const pct = totalRevenue > 0 ? (prod.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={prod.name} className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-center gap-3">
                        {/* Rank badge */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                          i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-600" : "bg-blue-500"
                        }`}>
                          {i + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-gray-900 text-sm truncate pr-2">{prod.name}</div>
                            <div className="font-bold text-blue-600 text-sm flex-shrink-0">{formatCurrency(prod.revenue)}</div>
                          </div>
                          {prod.category && (
                            <div className="text-xs text-gray-400 mt-0.5">{prod.category}</div>
                          )}
                          {/* Progress bar */}
                          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-gray-500">
                            <span>Qty: <strong className="text-gray-700">{prod.qty}</strong></span>
                            <span>{pct.toFixed(1)}% of revenue</span>
                            <button
                              onClick={() => setModalProduct(prod)}
                              className="text-indigo-600 hover:underline font-medium"
                            >
                              {prod.bills.length} bills
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Bills Modal */}
      {modalProduct && (
        <BillsModal
          product={modalProduct.name}
          bills={modalProduct.bills}
          onClose={() => setModalProduct(null)}
          onPrint={handlePrintBill}
        />
      )}
    </div>
  );
};

export default ItemsReport;