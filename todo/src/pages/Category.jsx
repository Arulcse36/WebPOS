import { useState, useEffect } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/categories`;

const Category = () => {
    const [name, setName] = useState("");
    const [list, setList] = useState([]);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    
    // Get companyId from localStorage
    const companyId = localStorage.getItem("companyId");

    useEffect(() => {
        if (companyId) {
            loadData();
        }
    }, [companyId]);

    const loadData = async () => {
        if (!companyId) {
            console.error("No company ID found");
            return;
        }
        
        setLoading(true);
        try {
            const res = await axios.get(`${API}?companyId=${companyId}`);
            setList(res.data);
        } catch (error) {
            console.error("Error loading categories:", error);
            alert("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const saveCategory = async () => {
        if (!name) {
            alert("Please enter category name");
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
                    name,
                    companyId 
                });
                setList(list.map(x => x._id === editId ? res.data : x));
                setEditId(null);
            } else {
                const res = await axios.post(API, { 
                    name,
                    companyId 
                });
                setList([res.data, ...list]);
            }
            setName("");
        } catch (error) {
            console.error("Error saving category:", error);
            alert(error.response?.data?.message || "Error saving category");
        } finally {
            setLoading(false);
        }
    };

    const editItem = (item) => {
        setName(item.name);
        setEditId(item._id);
    };

    const deleteItem = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        
        if (!companyId) return;
        
        setLoading(true);
        try {
            await axios.delete(`${API}/${id}?companyId=${companyId}`);
            setList(list.filter(x => x._id !== id));
            alert("Category deleted successfully!");
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Failed to delete category");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (item) => {
        if (!companyId) return;
        
        setLoading(true);
        try {
            const res = await axios.put(
                `${API}/${item._id}/status?companyId=${companyId}`,
                { isActive: !item.isActive }
            );
            setList(list.map(x => x._id === item._id ? res.data : x));
        } catch (error) {
            console.error("Error toggling status:", error);
            alert("Failed to update category status");
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        setName("");
        setEditId(null);
    };

    const filteredList = showInactive 
        ? list 
        : list.filter(item => item.isActive !== false);

    // Show loading or redirect if no company
    if (!companyId) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-2xl p-10 rounded-2xl shadow-xl text-center">
                    <div className="text-7xl mb-5">🏢</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">No Company Associated</h2>
                    <p className="text-gray-600 mb-6">Please login again to access categories.</p>
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
                        🗂️ Category Management
                    </h1>
                    <p className="text-gray-600 mt-2">Manage your product categories</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white">
                            {editId ? "✏️ Edit Category" : "➕ Add New Category"}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {editId ? "Update category details" : "Fill in the category information below"}
                        </p>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-900">
                                        Category Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter category name (e.g., Electronics, Clothing, Grocery...)"
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Categories help organize your products</p>
                                </div>
                            </div>
                            
                            {/* Active Status Toggle */}
                            <div className="col-span-1 md:col-span-2">
                                {editId && (
                                    <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={editId ? list.find(item => item._id === editId)?.isActive : true}
                                            onChange={(e) => {
                                                if (editId) {
                                                    const item = list.find(item => item._id === editId);
                                                    if (item) toggleStatus(item);
                                                }
                                            }}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            disabled={loading}
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">
                                                Category is Active
                                            </span>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Active categories are available for product selection
                                            </p>
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-start gap-4 mt-8 pt-4 border-t border-gray-200">
                            <button
                                onClick={saveCategory}
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving..." : (editId ? "Update Category" : "Add Category")}
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

                {/* Category List Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    📋 Category List
                                </h2>
                                <p className="text-gray-300 text-sm mt-1">
                                    Manage your product categories
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 bg-gray-700/50 px-4 py-2 rounded-xl">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showInactive}
                                        onChange={(e) => setShowInactive(e.target.checked)}
                                        className="w-4 h-4 text-blue-500 rounded"
                                    />
                                    <span className="text-sm text-gray-200">Show inactive categories</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-4 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing {filteredList.length} of {list.length} categories
                            </div>
                        </div>

                        {loading && list.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                                <p className="text-gray-600 mt-4">Loading categories...</p>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <div className="text-5xl mb-3">🗂️</div>
                                <p className="text-gray-600">
                                    {showInactive ? "No categories found." : "No active categories found. Toggle 'Show inactive categories' to view all."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredList.map(item => (
                                    <div
                                        key={item._id}
                                        className={`p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                                            item.isActive === false ? 'bg-gray-50 border border-gray-200 opacity-75' : 'bg-gray-50 border border-gray-200 hover:border-blue-200'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <div className="font-semibold text-gray-900 text-lg">
                                                        {item.name}
                                                    </div>
                                                    {item.isActive === false && (
                                                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                                                            Inactive
                                                        </span>
                                                    )}
                                                    {item.isActive !== false && (
                                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                            
                                                <div className="text-xs text-gray-500 mt-2">
                                                    <span className="font-medium">Created:</span> {new Date(item.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleStatus(item)}
                                                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                                                        item.isActive === false 
                                                            ? 'bg-green-500 text-white hover:bg-green-600' 
                                                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                    }`}
                                                    title={item.isActive === false ? "Activate" : "Deactivate"}
                                                >
                                                    {item.isActive === false ? '✅ Activate' : '⏸️ Deactivate'}
                                                </button>
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

export default Category;