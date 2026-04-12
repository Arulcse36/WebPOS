import { useState, useEffect } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/customers`;

const Customer = () => {
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        address: ""
    });

    const [list, setList] = useState([]);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    
    // Get companyId from localStorage (set during login)
    const companyId = localStorage.getItem("companyId");

    useEffect(() => {
        if (companyId) {
            loadData();
        }
    }, [companyId, search]);

    // 🔹 Load Customers (filtered by company)
    const loadData = async () => {
        if (!companyId) {
            console.error("No company ID found");
            return;
        }
        
        setLoading(true);
        try {
            const res = await axios.get(`${API}?companyId=${companyId}&search=${search}`);
            setList(res.data);
        } catch (err) {
            console.error(err);
            alert("Error loading customers");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Save (Add / Update)
    const saveCustomer = async () => {
        if (!form.name || !form.phone) {
            alert("Name & Phone required");
            return;
        }

        if (!companyId) {
            alert("No company associated. Please login again.");
            return;
        }

        setLoading(true);
        try {
            if (editId) {
                const res = await axios.put(`${API}/${editId}?companyId=${companyId}`, {
                    name: form.name,
                    phone: form.phone,
                    email: form.email,
                    address: form.address
                });

                setList(list.map(x => x._id === editId ? res.data : x));
                setEditId(null);
                alert("Customer updated successfully!");
            } else {
                const res = await axios.post(API, {
                    companyId: companyId,
                    name: form.name,
                    phone: form.phone,
                    email: form.email,
                    address: form.address
                });
                setList([res.data, ...list]);
                alert("Customer added successfully!");
            }

            // Reset form
            setForm({
                name: "",
                phone: "",
                email: "",
                address: ""
            });
        } catch (err) {
            alert(err.response?.data?.error || "Error saving customer");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Edit
    const editItem = (item) => {
        setForm({
            name: item.name,
            phone: item.phone,
            email: item.email || "",
            address: item.address || ""
        });
        setEditId(item._id);
    };

    // 🔹 Delete
    const deleteItem = async (id) => {
        if (!window.confirm("Delete this customer?")) return;

        setLoading(true);
        try {
            await axios.delete(`${API}/${id}?companyId=${companyId}`);
            setList(list.filter(x => x._id !== id));
            alert("Customer deleted successfully!");
        } catch (err) {
            console.error(err);
            alert("Error deleting customer");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Cancel Edit
    const cancelEdit = () => {
        setEditId(null);
        setForm({
            name: "",
            phone: "",
            email: "",
            address: ""
        });
    };

    // Show loading or redirect if no company
    if (!companyId) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-2xl p-10 rounded-2xl shadow-xl text-center">
                    <div className="text-7xl mb-5">🏢</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">No Company Associated</h2>
                    <p className="text-gray-600 mb-6">Please login again to access customers.</p>
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
                        👤 Customer Management
                    </h1>
                    <p className="text-gray-600 mt-2">Manage your customer database</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 Search by name, phone or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white border-gray-300 pl-10"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white">
                            {editId ? "✏️ Edit Customer" : "➕ Add New Customer"}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {editId ? "Update customer details" : "Fill in the customer information below"}
                        </p>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-900">
                                        Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Enter customer full name"
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-900">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="phone"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-900">
                                        Email
                                    </label>
                                    <input
                                        name="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="Enter email address"
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-900">
                                        Address
                                    </label>
                                    <input
                                        name="address"
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        placeholder="Enter customer address"
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-start gap-4 mt-8 pt-4 border-t border-gray-200">
                            <button
                                onClick={saveCustomer}
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving..." : (editId ? "Update Customer" : "Add Customer")}
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

                {/* Customer List Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    📋 Customer List
                                </h2>
                                <p className="text-gray-300 text-sm mt-1">
                                    Manage your customers
                                </p>
                            </div>
                            <div className="text-sm text-gray-300 bg-gray-700/50 px-4 py-2 rounded-xl">
                                Total: {list.length} customers
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-4 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing {list.length} customers
                                {search && <span className="ml-2 text-blue-600">(filtered by "{search}")</span>}
                            </div>
                        </div>

                        {loading && list.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                                <p className="text-gray-600 mt-4">Loading customers...</p>
                            </div>
                        ) : list.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <div className="text-5xl mb-3">👥</div>
                                <p className="text-gray-600">
                                    {search ? "No customers found matching your search." : "No customers found. Add your first customer!"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {list.map(item => (
                                    <div
                                        key={item._id}
                                        className="p-4 rounded-xl transition-all duration-200 hover:shadow-md bg-gray-50 border border-gray-200 hover:border-blue-200"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <div className="font-semibold text-gray-900 text-lg">
                                                        {item.name}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-2 flex flex-wrap gap-3">
                                                    {item.phone && (
                                                        <span className="bg-blue-50 text-gray-700 px-2 py-1 rounded">📞 {item.phone}</span>
                                                    )}
                                                    {item.email && (
                                                        <span className="bg-purple-50 text-gray-700 px-2 py-1 rounded">✉️ {item.email}</span>
                                                    )}
                                                    {item.address && (
                                                        <span className="bg-green-50 text-gray-700 px-2 py-1 rounded">📍 {item.address}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-2">
                                                    <span className="font-medium">Customer ID:</span> {item._id}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => editItem(item)}
                                                    className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-all font-medium text-sm"
                                                    title="Edit"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteItem(item._id)}
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

export default Customer;