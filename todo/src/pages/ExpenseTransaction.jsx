import { useState, useEffect } from "react";
import axios from "axios";

const API_EXPENSE_MASTER = `${import.meta.env.VITE_API_URL}/expense-master`;
const API_EXPENSE_TRANSACTION = `${import.meta.env.VITE_API_URL}/expense-transactions`;

const ExpenseTransaction = () => {
    const [form, setForm] = useState({
        expenseId: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
    });
    
    const [expenses, setExpenses] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedWeek, setSelectedWeek] = useState(getWeekRange(new Date()));
    const [customDateRange, setCustomDateRange] = useState({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });
    const [selectedExpenseFilter, setSelectedExpenseFilter] = useState("all"); // 'all' or specific expenseId
    
    const companyId = localStorage.getItem("companyId");

    function getWeekRange(date) {
        const curr = new Date(date);
        const first = curr.getDate() - curr.getDay();
        const last = first + 6;
        
        const firstDay = new Date(curr.setDate(first));
        const lastDay = new Date(curr.setDate(last));
        
        return {
            start: firstDay.toISOString().split('T')[0],
            end: lastDay.toISOString().split('T')[0]
        };
    }

    useEffect(() => {
        if (companyId) {
            loadExpenses();
            loadTransactions();
        }
    }, [companyId]);

    useEffect(() => {
        filterTransactions();
    }, [transactions, filterType, selectedDate, selectedMonth, selectedWeek, customDateRange, selectedExpenseFilter]);

    const loadExpenses = async () => {
        if (!companyId) return;
        
        try {
            const res = await axios.get(`${API_EXPENSE_MASTER}?companyId=${companyId}`);
            const activeExpenses = res.data.filter(exp => exp.isActive !== false);
            setExpenses(activeExpenses);
        } catch (error) {
            console.error("Error loading expenses:", error);
            alert("Failed to load expense categories");
        }
    };

    const loadTransactions = async () => {
        if (!companyId) return;
        
        setLoading(true);
        try {
            const res = await axios.get(`${API_EXPENSE_TRANSACTION}?companyId=${companyId}`);
            setTransactions(res.data);
        } catch (error) {
            console.error("Error loading transactions:", error);
            alert("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    const filterTransactions = () => {
        let filtered = [...transactions];
        
        // First filter by expense category
        if (selectedExpenseFilter !== "all") {
            filtered = filtered.filter(t => {
                const expenseId = t.expenseId._id || t.expenseId;
                return expenseId === selectedExpenseFilter;
            });
        }
        
        // Then filter by date range based on filter type
        switch (filterType) {
            case 'daily':
                const selectedDateObj = new Date(selectedDate);
                selectedDateObj.setHours(0, 0, 0, 0);
                filtered = filtered.filter(t => {
                    const transDate = new Date(t.date);
                    transDate.setHours(0, 0, 0, 0);
                    return transDate.getTime() === selectedDateObj.getTime();
                });
                break;
                
            case 'weekly':
                const weekStart = new Date(selectedWeek.start);
                const weekEnd = new Date(selectedWeek.end);
                weekStart.setHours(0, 0, 0, 0);
                weekEnd.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(t => {
                    const transDate = new Date(t.date);
                    return transDate >= weekStart && transDate <= weekEnd;
                });
                break;
                
            case 'monthly':
                const [year, month] = selectedMonth.split('-');
                filtered = filtered.filter(t => {
                    const transDate = new Date(t.date);
                    return transDate.getFullYear() === parseInt(year) && 
                           transDate.getMonth() === parseInt(month) - 1;
                });
                break;
                
            case 'custom':
                const fromDate = new Date(customDateRange.fromDate);
                const toDate = new Date(customDateRange.toDate);
                fromDate.setHours(0, 0, 0, 0);
                toDate.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(t => {
                    const transDate = new Date(t.date);
                    return transDate >= fromDate && transDate <= toDate;
                });
                break;
                
            default:
                break;
        }
        
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        setFilteredTransactions(filtered);
    };

    const saveTransaction = async () => {
        if (!form.expenseId) {
            alert("Please select an expense category");
            return;
        }
        
        if (!form.amount || parseFloat(form.amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        
        if (!form.date) {
            alert("Please select a date");
            return;
        }
        
        if (!companyId) {
            alert("No company associated. Please login again.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                expenseId: form.expenseId,
                amount: parseFloat(form.amount),
                date: form.date,
                notes: form.notes.trim(),
                companyId
            };

            if (editId) {
                const res = await axios.put(`${API_EXPENSE_TRANSACTION}/${editId}?companyId=${companyId}`, payload);
                setTransactions(transactions.map(x => x._id === editId ? res.data : x));
                setEditId(null);
                alert("Transaction updated successfully!");
            } else {
                const res = await axios.post(API_EXPENSE_TRANSACTION, payload);
                setTransactions([res.data, ...transactions]);
                alert("Transaction added successfully!");
            }
            
            setForm({
                expenseId: "",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                notes: ""
            });
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert(error.response?.data?.message || "Error saving transaction");
        } finally {
            setLoading(false);
        }
    };

    const editTransaction = (transaction) => {
        setForm({
            expenseId: transaction.expenseId._id || transaction.expenseId,
            amount: transaction.amount,
            date: transaction.date.split('T')[0],
            notes: transaction.notes || ""
        });
        setEditId(transaction._id);
    };

    const deleteTransaction = async (id) => {
        if (!window.confirm("Delete this transaction?")) return;
        
        if (!companyId) return;
        
        setLoading(true);
        try {
            await axios.delete(`${API_EXPENSE_TRANSACTION}/${id}?companyId=${companyId}`);
            setTransactions(transactions.filter(x => x._id !== id));
            alert("Transaction deleted successfully!");
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert("Failed to delete transaction");
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        setForm({
            expenseId: "",
            amount: "",
            date: new Date().toISOString().split('T')[0],
            notes: ""
        });
        setEditId(null);
    };

    const changeWeek = (direction) => {
        const currentStart = new Date(selectedWeek.start);
        currentStart.setDate(currentStart.getDate() + (direction * 7));
        setSelectedWeek(getWeekRange(currentStart));
    };

    const getExpenseName = (expenseId) => {
        const expense = expenses.find(e => e._id === (expenseId._id || expenseId));
        return expense ? expense.expenseName : 'Unknown';
    };

    const filteredTotal = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    const getFilterDescription = () => {
        let description = '';
        
        switch (filterType) {
            case 'daily':
                description = new Date(selectedDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                break;
            case 'weekly':
                const start = new Date(selectedWeek.start);
                const end = new Date(selectedWeek.end);
                description = `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                break;
            case 'monthly':
                const [year, month] = selectedMonth.split('-');
                description = new Date(year, month - 1).toLocaleDateString('en-IN', {
                    month: 'long',
                    year: 'numeric'
                });
                break;
            case 'custom':
                const from = new Date(customDateRange.fromDate);
                const to = new Date(customDateRange.toDate);
                description = `${from.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${to.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                break;
            default:
                description = '';
        }
        
        if (selectedExpenseFilter !== "all") {
            const expenseName = getExpenseName(selectedExpenseFilter);
            description += ` • ${expenseName}`;
        }
        
        return description;
    };

    if (!companyId) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-2xl p-10 rounded-2xl shadow-xl text-center">
                    <div className="text-7xl mb-5">🏢</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">No Company Associated</h2>
                    <p className="text-gray-600 mb-6">Please login again to access expense transactions.</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        💸 Expense Transaction
                    </h1>
                    <p className="text-gray-600 mt-2">Record and manage your daily expenses</p>
                </div>

                {/* Summary Card with Filters */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <p className="text-purple-100 text-sm">Total Expenses</p>
                            <p className="text-4xl font-bold mt-2">₹ {filteredTotal.toLocaleString()}</p>
                            <p className="text-purple-100 text-sm mt-2">{getFilterDescription()}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex flex-wrap bg-white/10 rounded-xl p-1">
                                <button
                                    onClick={() => setFilterType('daily')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        filterType === 'daily' 
                                            ? 'bg-white text-purple-600 shadow-md' 
                                            : 'text-white hover:bg-white/10'
                                    }`}
                                >
                                    📅 Daily
                                </button>
                                <button
                                    onClick={() => setFilterType('weekly')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        filterType === 'weekly' 
                                            ? 'bg-white text-purple-600 shadow-md' 
                                            : 'text-white hover:bg-white/10'
                                    }`}
                                >
                                    📆 Weekly
                                </button>
                                <button
                                    onClick={() => setFilterType('monthly')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        filterType === 'monthly' 
                                            ? 'bg-white text-purple-600 shadow-md' 
                                            : 'text-white hover:bg-white/10'
                                    }`}
                                >
                                    📊 Monthly
                                </button>
                                <button
                                    onClick={() => setFilterType('custom')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        filterType === 'custom' 
                                            ? 'bg-white text-purple-600 shadow-md' 
                                            : 'text-white hover:bg-white/10'
                                    }`}
                                >
                                    📁 Custom
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-purple-200">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <span className="text-purple-700 text-xl">🔍</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Filter by:</h3>
                            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium uppercase">
                                {filterType}
                            </span>
                        </div>
                        
                        <div className="pl-12 space-y-4">
                            {/* Expense Filter Dropdown */}
                            <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-gray-200">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Filter by Expense
                                    </label>
                                    <select
                                        value={selectedExpenseFilter}
                                        onChange={(e) => setSelectedExpenseFilter(e.target.value)}
                                        className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900 bg-white"
                                    >
                                        <option value="all">All Expenses</option>
                                        {expenses.map(expense => (
                                            <option key={expense._id} value={expense._id}>
                                                {expense.expenseName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Date Filter Controls */}
                            {filterType === 'daily' && (
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                                        />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <button
                                            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                            className="bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                                        >
                                            📅 Today
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {filterType === 'weekly' && (
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Week
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => changeWeek(-1)}
                                                className="bg-purple-100 text-purple-700 p-3 rounded-lg hover:bg-purple-200 transition-colors"
                                            >
                                                ◀
                                            </button>
                                            <input
                                                type="date"
                                                value={selectedWeek.start}
                                                onChange={(e) => setSelectedWeek(getWeekRange(e.target.value))}
                                                className="flex-1 border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                                            />
                                            <button
                                                onClick={() => changeWeek(1)}
                                                className="bg-purple-100 text-purple-700 p-3 rounded-lg hover:bg-purple-200 transition-colors"
                                            >
                                                ▶
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-gray-100 px-4 py-3 rounded-lg">
                                            <span className="text-gray-600">to</span>
                                            <span className="ml-2 font-medium text-gray-900">
                                                {new Date(selectedWeek.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedWeek(getWeekRange(new Date()))}
                                            className="bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                                        >
                                            📆 This Week
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {filterType === 'monthly' && (
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Month
                                        </label>
                                        <input
                                            type="month"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                                        />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <button
                                            onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
                                            className="bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                                        >
                                            📊 This Month
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {filterType === 'custom' && (
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={customDateRange.fromDate}
                                            onChange={(e) => setCustomDateRange({ ...customDateRange, fromDate: e.target.value })}
                                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={customDateRange.toDate}
                                            onChange={(e) => setCustomDateRange({ ...customDateRange, toDate: e.target.value })}
                                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                                        />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <button
                                            onClick={() => setCustomDateRange({
                                                fromDate: new Date().toISOString().split('T')[0],
                                                toDate: new Date().toISOString().split('T')[0]
                                            })}
                                            className="bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                                        >
                                            📅 Today
                                        </button>
                                        <button
                                            onClick={() => {
                                                const today = new Date();
                                                const lastWeek = new Date(today);
                                                lastWeek.setDate(today.getDate() - 7);
                                                setCustomDateRange({
                                                    fromDate: lastWeek.toISOString().split('T')[0],
                                                    toDate: today.toISOString().split('T')[0]
                                                });
                                            }}
                                            className="bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                                        >
                                            📆 Last 7 Days
                                        </button>
                                        <button
                                            onClick={() => {
                                                const today = new Date();
                                                const lastMonth = new Date(today);
                                                lastMonth.setMonth(today.getMonth() - 1);
                                                setCustomDateRange({
                                                    fromDate: lastMonth.toISOString().split('T')[0],
                                                    toDate: today.toISOString().split('T')[0]
                                                });
                                            }}
                                            className="bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                                        >
                                            📊 Last 30 Days
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-700 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white">
                            {editId ? "✏️ Edit Transaction" : "➕ New Expense Transaction"}
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">
                            {editId ? "Update transaction details" : "Record a new expense transaction"}
                        </p>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium mb-1 text-gray-900">
                                    Expense Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.expenseId}
                                    onChange={(e) => setForm({ ...form, expenseId: e.target.value })}
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                    disabled={loading}
                                >
                                    <option value="">Select Expense Category</option>
                                    {expenses.map(expense => (
                                        <option key={expense._id} value={expense._id}>
                                            {expense.expenseName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium mb-1 text-gray-900">
                                    Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                                    <input
                                        type="number"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        placeholder="Enter amount"
                                        min="0"
                                        step="0.01"
                                        className="w-full border p-3 pl-8 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium mb-1 text-gray-900">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                    disabled={loading}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium mb-1 text-gray-900">
                                    Notes
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Add any additional notes (optional)"
                                    rows="3"
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 bg-white border-gray-300 resize-none"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="flex justify-start gap-4 mt-8 pt-4 border-t border-gray-200">
                            <button
                                onClick={saveTransaction}
                                disabled={loading}
                                className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving..." : (editId ? "Update Transaction" : "Save Transaction")}
                            </button>
                            {editId && (
                                <button
                                    onClick={cancelEdit}
                                    disabled={loading}
                                    className="bg-gray-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all shadow-md disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    📋 Transaction History
                                </h2>
                                <p className="text-gray-300 text-sm mt-1">
                                    {filteredTransactions.length} transactions found
                                </p>
                            </div>
                            <div className="text-sm text-gray-300 bg-gray-700/50 px-4 py-2 rounded-xl">
                                Total: ₹ {filteredTotal.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {loading && transactions.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600"></div>
                                <p className="text-gray-600 mt-4">Loading transactions...</p>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <div className="text-5xl mb-3">💳</div>
                                <p className="text-gray-600">
                                    No transactions found for this period.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTransactions.map(transaction => (
                                    <div
                                        key={transaction._id}
                                        className="p-4 rounded-xl transition-all duration-200 hover:shadow-md bg-gray-50 border border-gray-200 hover:border-purple-200"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <div className="font-semibold text-gray-900 text-lg">
                                                        {getExpenseName(transaction.expenseId)}
                                                    </div>
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        ₹ {transaction.amount.toLocaleString()}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        📅 {new Date(transaction.date).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    {transaction.notes && (
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                            📝 {transaction.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => editTransaction(transaction)}
                                                    className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-all font-medium text-sm"
                                                    title="Edit"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteTransaction(transaction._id)}
                                                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all font-medium text-sm"
                                                    title="Delete"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseTransaction;