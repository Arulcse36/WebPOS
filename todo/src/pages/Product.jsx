import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://192.168.1.14:5000";

// Move these components outside
const InputField = ({ label, name, value, onChange, type = "text", required = true, error, disabled }) => (
    <div>
        <label className="block text-sm font-medium mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            name={name}
            value={value || ""}
            onChange={onChange}
            type={type}
            className={`w-full border p-2 rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
            disabled={disabled}
        />
        {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
    </div>
);

const SelectField = ({ label, name, value, onChange, options, required = true, error, disabled }) => (
    <div>
        <label className="block text-sm font-medium mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            value={value || ""}
            onChange={onChange}
            className={`w-full border p-2 rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
            disabled={disabled}
        >
            <option value="">Select {label}</option>
            {options.map(opt => (
                <option key={opt._id} value={opt._id}>{opt.name}</option>
            ))}
        </select>
        {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
    </div>
);

const Product = () => {
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
        isActive: true  // Added isActive field
    });

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false); // Toggle for showing inactive products

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, c, b, u] = await Promise.all([
                axios.get(`${API}/products`),
                axios.get(`${API}/categories`),
                axios.get(`${API}/brands`),
                axios.get(`${API}/uoms`)
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

        // Product Code validation
        if (!form.productCode.trim()) err.productCode = "Product Code is required";
        
        // Product Name validation
        if (!form.name.trim()) err.name = "Product Name is required";
        
        // Tamil Name validation - MANDATORY
        if (!form.tamilName.trim()) err.tamilName = "Tamil Name is required";
        
        // MRP validation
        if (!form.mrp) err.mrp = "MRP is required";
        if (form.mrp && parseFloat(form.mrp) <= 0) err.mrp = "MRP must be greater than 0";
        
        // Retail Rate validation
        if (!form.retailRate) err.retailRate = "Retail Rate is required";
        if (form.retailRate && parseFloat(form.retailRate) <= 0) err.retailRate = "Retail Rate must be greater than 0";
        
        // Wholesale Rate validation
        if (!form.wholesaleRate) err.wholesaleRate = "Wholesale Rate is required";
        if (form.wholesaleRate && parseFloat(form.wholesaleRate) <= 0) err.wholesaleRate = "Wholesale Rate must be greater than 0";
        
        // Category validation
        if (!form.category) err.category = "Select category";
        
        // Brand validation
        if (!form.brand) err.brand = "Select brand";
        
        // UOM validation
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
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const saveProduct = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            if (editId) {
                const res = await axios.put(`${API}/products/${editId}`, form);
                setProducts(products.map(p =>
                    p._id === editId ? res.data : p
                ));
                setEditId(null);
            } else {
                const res = await axios.post(`${API}/products`, form);
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
            await axios.delete(`${API}/products/${id}`);
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
            const updatedProduct = { ...product, isActive: newStatus };
            const res = await axios.put(`${API}/products/${product._id}`, updatedProduct);
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

    // Filter products based on showInactive toggle
    const filteredProducts = showInactive 
        ? products 
        : products.filter(p => p.isActive !== false);

    return (
        <div className="w-full flex justify-center p-4">
            <div className="bg-white w-full max-w-3xl p-4 rounded-xl shadow-lg text-black">
                <h1 className="text-xl font-bold mb-4">🛒 Product Management</h1>

                {/* FORM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                        label="MRP" 
                        name="mrp"
                        value={form.mrp}
                        onChange={handleChange}
                        type="number"
                        error={errors.mrp}
                        disabled={loading}
                    />
                    <InputField 
                        label="Retail Rate" 
                        name="retailRate"
                        value={form.retailRate}
                        onChange={handleChange}
                        type="number"
                        error={errors.retailRate}
                        disabled={loading}
                    />
                    <InputField 
                        label="Wholesale Rate" 
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
                    <div className="col-span-1 sm:col-span-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={form.isActive}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                disabled={loading}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Product is Active (available for sale)
                            </span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-start gap-2">
                    <button
                        onClick={saveProduct}
                        disabled={loading}
                        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Saving..." : (editId ? "Update Product" : "Add Product")}
                    </button>
                    {editId && (
                        <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {/* LIST CONTROLS */}
                <div className="mt-6 mb-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">
                        Product List ({filteredProducts.length} / {products.length})
                    </h2>
                    <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-600">Show inactive products</span>
                        </label>
                    </div>
                </div>

                {/* PRODUCT LIST */}
                {filteredProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        {showInactive ? "No products found." : "No active products found. Toggle 'Show inactive products' to view all."}
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {filteredProducts.map(p => (
                            <li
                                key={p._id}
                                className={`p-3 rounded flex items-center justify-between hover:shadow-md transition-shadow ${
                                    p.isActive === false ? 'bg-gray-100 opacity-75' : 'bg-slate-100'
                                }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold">
                                            {p.name}
                                            <span className="text-xs text-gray-500 ml-2">({p.productCode})</span>
                                        </div>
                                        {p.isActive === false && (
                                            <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                        {p.isActive !== false && (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {p.tamilName && <span className="mr-2">📝 {p.tamilName}</span>}
                                        {p.category?.name} | {p.brand?.name} | {p.uom?.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        MRP: ₹{p.mrp} | Retail: ₹{p.retailRate} | Wholesale: ₹{p.wholesaleRate}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                    <button
                                        onClick={() => toggleProductStatus(p)}
                                        className={`p-1 rounded ${
                                            p.isActive === false 
                                                ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                                                : 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                        }`}
                                        title={p.isActive === false ? "Activate" : "Deactivate"}
                                    >
                                        {p.isActive === false ? '▶️' : '⏸️'}
                                    </button>
                                    <button
                                        onClick={() => editProduct(p)}
                                        className="text-blue-500 hover:text-blue-700 p-1"
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => deleteProduct(p._id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Delete"
                                    >
                                        ❌
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Product;