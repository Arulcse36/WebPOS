import { useState, useEffect } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}`;

// Move these components outside
const InputField = ({ label, name, value, onChange, type = "text", required = true, error, disabled }) => (
    <div>
        <label className="block text-sm font-medium mb-1 text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            name={name}
            value={value || ""}
            onChange={onChange}
            type={type}
            className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}
            disabled={disabled}
        />
        {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
    </div>
);

const SelectField = ({ label, name, value, onChange, options, required = true, error, disabled }) => (
    <div>
        <label className="block text-sm font-medium mb-1 text-gray-900">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            value={value || ""}
            onChange={onChange}
            className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-gray-900 ${error ? 'border-red-500' : 'border-gray-300'}`}
            disabled={disabled}
        >
            <option value="" className="text-gray-900">Select {label}</option>
            {options.map(opt => (
                <option key={opt._id} value={opt._id} className="text-gray-900">{opt.name}</option>
            ))}
        </select>
        {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
    </div>
);

const Product = () => {
    // Get companyId from localStorage
    const companyId = localStorage.getItem("companyId");
    
    const [form, setForm] = useState({
        productCode: "",
        name: "",
        tamilName: "",
        mrp: "",
        retailRate: "",
        wholesaleRate: "",
        category: "",
        brand: "",
        uom: "",
        isActive: true
    });

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

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
            const [p, c, b, u] = await Promise.all([
                axios.get(`${API}/products?companyId=${companyId}`),
                axios.get(`${API}/categories?companyId=${companyId}`),
                axios.get(`${API}/brands?companyId=${companyId}`),
                axios.get(`${API}/uoms?companyId=${companyId}`)
            ]);

            setProducts(p.data);
            setCategories(c.data.filter(x => x.isActive));
            setBrands(b.data.filter(x => x.isActive));
            setUoms(u.data.filter(x => x.isActive));
        } catch (error) {
            console.error("Error loading data:", error);
            alert("Failed to load data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        let err = {};

        if (!form.productCode.trim()) err.productCode = "Product Code is required";
        if (!form.name.trim()) err.name = "Product Name is required";
        if (!form.tamilName.trim()) err.tamilName = "Tamil Name is required";
        if (!form.mrp) err.mrp = "MRP is required";
        if (form.mrp && parseFloat(form.mrp) <= 0) err.mrp = "MRP must be greater than 0";
        if (!form.retailRate) err.retailRate = "Retail Rate is required";
        if (form.retailRate && parseFloat(form.retailRate) <= 0) err.retailRate = "Retail Rate must be greater than 0";
        if (!form.wholesaleRate) err.wholesaleRate = "Wholesale Rate is required";
        if (form.wholesaleRate && parseFloat(form.wholesaleRate) <= 0) err.wholesaleRate = "Wholesale Rate must be greater than 0";
        if (!form.category) err.category = "Select category";
        if (!form.brand) err.brand = "Select brand";
        if (!form.uom) err.uom = "Select UOM";

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const saveProduct = async () => {
        if (!companyId) {
            alert("No company associated. Please login again.");
            return;
        }
        
        if (!validate()) return;

        setLoading(true);
        try {
            const productData = {
                ...form,
                companyId: companyId
            };
            
            if (editId) {
                const res = await axios.put(`${API}/products/${editId}?companyId=${companyId}`, productData);
                setProducts(products.map(p =>
                    p._id === editId ? res.data : p
                ));
                setEditId(null);
            } else {
                const res = await axios.post(`${API}/products?companyId=${companyId}`, productData);
                setProducts([res.data, ...products]);
            }

            resetForm();
        } catch (error) {
            console.error("Error saving product:", error);
            alert(error.response?.data?.message || "Error saving product. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            productCode: "",
            name: "",
            tamilName: "",
            mrp: "",
            retailRate: "",
            wholesaleRate: "",
            category: "",
            brand: "",
            uom: "",
            isActive: true
        });
        setErrors({});
    };

    const editProduct = (item) => {
        setForm({
            productCode: item.productCode,
            name: item.name,
            tamilName: item.tamilName || "",
            mrp: item.mrp || "",
            retailRate: item.retailRate || "",
            wholesaleRate: item.wholesaleRate || "",
            category: item.category?._id || "",
            brand: item.brand?._id || "",
            uom: item.uom?._id || "",
            isActive: item.isActive !== undefined ? item.isActive : true
        });
        setEditId(item._id);
        setErrors({});
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
        
        setLoading(true);
        try {
            await axios.delete(`${API}/products/${id}?companyId=${companyId}`);
            setProducts(products.filter(x => x._id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Error deleting product. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const toggleProductStatus = async (product) => {
        const newStatus = !product.isActive;
        const action = newStatus ? "activate" : "deactivate";
        
        if (!window.confirm(`Are you sure you want to ${action} "${product.name}"?`)) return;
        
        setLoading(true);
        try {
            const updatedProduct = { ...product, isActive: newStatus, companyId: companyId };
            const res = await axios.put(`${API}/products/${product._id}?companyId=${companyId}`, updatedProduct);
            setProducts(products.map(p =>
                p._id === product._id ? res.data : p
            ));
        } catch (error) {
            console.error("Error updating product status:", error);
            alert(`Error ${newStatus ? "activating" : "deactivating"} product. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        resetForm();
        setEditId(null);
    };

    const filteredProducts = showInactive 
        ? products 
        : products.filter(p => p.isActive !== false);

    // Show loading or redirect if no company
    if (!companyId) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-2xl p-10 rounded-2xl shadow-xl text-center">
                    <div className="text-7xl mb-5">🏢</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">No Company Associated</h2>
                    <p className="text-gray-600 mb-6">Please login again to access products.</p>
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
                        🛒 Product Management
                    </h1>
                    <p className="text-gray-600 mt-2">Manage your product inventory, prices, and categories</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white">
                            {editId ? "✏️ Edit Product" : "➕ Add New Product"}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {editId ? "Update product details" : "Fill in the product information below"}
                        </p>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField 
                                label="Product Code" 
                                name="productCode"
                                value={form.productCode}
                                onChange={handleChange}
                                error={errors.productCode}
                                disabled={loading}
                            />
                            <InputField 
                                label="Product Name" 
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                error={errors.name}
                                disabled={loading}
                            />
                            <InputField 
                                label="Tamil Name" 
                                name="tamilName"
                                value={form.tamilName}
                                onChange={handleChange}
                                required={true}
                                error={errors.tamilName}
                                disabled={loading}
                            />
                            <InputField 
                                label="MRP (₹)" 
                                name="mrp"
                                value={form.mrp}
                                onChange={handleChange}
                                type="number"
                                error={errors.mrp}
                                disabled={loading}
                            />
                            <InputField 
                                label="Retail Rate (₹)" 
                                name="retailRate"
                                value={form.retailRate}
                                onChange={handleChange}
                                type="number"
                                error={errors.retailRate}
                                disabled={loading}
                            />
                            <InputField 
                                label="Wholesale Rate (₹)" 
                                name="wholesaleRate"
                                value={form.wholesaleRate}
                                onChange={handleChange}
                                type="number"
                                error={errors.wholesaleRate}
                                disabled={loading}
                            />
                            <SelectField 
                                label="Category" 
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                options={categories}
                                error={errors.category}
                                disabled={loading}
                            />
                            <SelectField 
                                label="Brand" 
                                name="brand"
                                value={form.brand}
                                onChange={handleChange}
                                options={brands}
                                error={errors.brand}
                                disabled={loading}
                            />
                            <SelectField 
                                label="UOM" 
                                name="uom"
                                value={form.uom}
                                onChange={handleChange}
                                options={uoms}
                                error={errors.uom}
                                disabled={loading}
                            />
                            
                            {/* Active Status Toggle */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        disabled={loading}
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">
                                            Product is Active
                                        </span>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Active products are available for sale in POS
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-start gap-4 mt-8 pt-4 border-t border-gray-200">
                            <button
                                onClick={saveProduct}
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving..." : (editId ? "Update Product" : "Add Product")}
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

                {/* Product List Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    📋 Product List
                                </h2>
                                <p className="text-gray-300 text-sm mt-1">
                                    Manage your product inventory
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
                                    <span className="text-sm text-gray-200">Show inactive products</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-4 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing {filteredProducts.length} of {products.length} products
                            </div>
                        </div>

                        {loading && products.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                                <p className="text-gray-600 mt-4">Loading products...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <div className="text-5xl mb-3">📦</div>
                                <p className="text-gray-600">
                                    {showInactive ? "No products found." : "No active products found. Toggle 'Show inactive products' to view all."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredProducts.map(p => (
                                    <div
                                        key={p._id}
                                        className={`p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                                            p.isActive === false ? 'bg-gray-50 border border-gray-200 opacity-75' : 'bg-gray-50 border border-gray-200 hover:border-blue-200'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <div className="font-semibold text-gray-900 text-lg">
                                                        {p.name}
                                                    </div>
                                                    <span className="text-xs text-gray-600 font-mono bg-gray-200 px-2 py-1 rounded">
                                                        {p.productCode}
                                                    </span>
                                                    {p.isActive === false && (
                                                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                                                            Inactive
                                                        </span>
                                                    )}
                                                    {p.isActive !== false && (
                                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-2 flex flex-wrap gap-2">
                                                    {p.tamilName && (
                                                        <span className="bg-blue-50 text-gray-700 px-2 py-1 rounded">📝 {p.tamilName}</span>
                                                    )}
                                                    <span className="bg-purple-50 text-gray-700 px-2 py-1 rounded">📁 {p.category?.name}</span>
                                                    <span className="bg-orange-50 text-gray-700 px-2 py-1 rounded">🏷️ {p.brand?.name}</span>
                                                    <span className="bg-green-50 text-gray-700 px-2 py-1 rounded">⚖️ {p.uom?.name}</span>
                                                </div>
                                                <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-3">
                                                    <span className="font-medium">MRP: <span className="text-gray-900">₹{p.mrp}</span></span>
                                                    <span className="font-medium">Retail: <span className="text-gray-900">₹{p.retailRate}</span></span>
                                                    <span className="font-medium">Wholesale: <span className="text-gray-900">₹{p.wholesaleRate}</span></span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleProductStatus(p)}
                                                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                                                        p.isActive === false 
                                                            ? 'bg-green-500 text-white hover:bg-green-600' 
                                                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                    }`}
                                                    title={p.isActive === false ? "Activate" : "Deactivate"}
                                                >
                                                    {p.isActive === false ? '✅ Activate' : '⏸️ Deactivate'}
                                                </button>
                                                <button
                                                    onClick={() => editProduct(p)}
                                                    className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-all font-medium text-sm"
                                                    title="Edit"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(p._id)}
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

export default Product;