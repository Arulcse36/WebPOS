// pages/BarcodeManager.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useSearchParams } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}`;

const BarcodeManager = () => {
    const companyId = localStorage.getItem("companyId");
    const [searchParams] = useSearchParams();
    const productIdParam = searchParams.get('productId');
    
    const [barcodes, setBarcodes] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBarcode, setEditingBarcode] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProduct, setFilterProduct] = useState(productIdParam || "");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });
    
    const [formData, setFormData] = useState({
        productId: productIdParam || "",
        barcode: "",
        expiryDate: "",
        mrp: "",
        retailRate: "",
        wholesaleRate: "",
        isActive: true
    });
    
    const [formErrors, setFormErrors] = useState({});
    const [notification, setNotification] = useState(null);
    const [importing, setImporting] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(null);
    const [isDuplicateBarcode, setIsDuplicateBarcode] = useState(false);

    // Load data
    const loadData = useCallback(async () => {
        if (!companyId) return;
        
        setLoading(true);
        try {
            const [barcodesRes, productsRes] = await Promise.all([
                axios.get(`${API}/barcodes`, { 
                    params: { 
                        companyId,
                        page: pagination.page,
                        limit: pagination.limit,
                        search: searchTerm,
                        productId: filterProduct
                    } 
                }),
                axios.get(`${API}/products`, { params: { companyId } })
            ]);
            
            setBarcodes(barcodesRes.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: barcodesRes.data.pagination?.total || 0,
                pages: barcodesRes.data.pagination?.pages || 0
            }));
            setProducts(productsRes.data || []);
            
            if (productIdParam) {
                const product = productsRes.data.find(p => p._id === productIdParam);
                if (product) {
                    setSelectedProduct(product);
                    setFormData(prev => ({
                        ...prev,
                        productId: productIdParam
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, [companyId, pagination.page, pagination.limit, searchTerm, filterProduct, productIdParam]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
        
        if (field === 'productId') {
            const product = products.find(p => p._id === value);
            setSelectedProduct(product || null);
        }

        // Check for duplicate barcode when barcode field changes
        if (field === 'barcode' && value.trim()) {
            checkDuplicateBarcode(value.trim());
        } else if (field === 'barcode') {
            setIsDuplicateBarcode(false);
        }
    };

    // Function to check if barcode already exists
    const checkDuplicateBarcode = (barcodeValue) => {
        if (!barcodeValue) {
            setIsDuplicateBarcode(false);
            return;
        }

        // If editing, exclude the current barcode from duplicate check
        const existingBarcode = barcodes.find(b => 
            b.barcode === barcodeValue && 
            (!editingBarcode || b._id !== editingBarcode._id)
        );

        if (existingBarcode) {
            setIsDuplicateBarcode(true);
            setFormErrors(prev => ({
                ...prev,
                barcode: `Barcode "${barcodeValue}" already exists for product: ${existingBarcode.productId?.name || 'Unknown'}`
            }));
        } else {
            setIsDuplicateBarcode(false);
            setFormErrors(prev => ({
                ...prev,
                barcode: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.productId) errors.productId = 'Product is required';
        if (!formData.barcode) errors.barcode = 'Barcode is required';
        if (isDuplicateBarcode) errors.barcode = 'This barcode already exists';
        if (!formData.expiryDate) errors.expiryDate = 'Expiry date is required';
        if (!formData.mrp || parseFloat(formData.mrp) <= 0) errors.mrp = 'MRP must be greater than 0';
        if (formData.retailRate && parseFloat(formData.retailRate) < 0) errors.retailRate = 'Retail rate must be >= 0';
        if (formData.wholesaleRate && parseFloat(formData.wholesaleRate) < 0) errors.wholesaleRate = 'Wholesale rate must be >= 0';
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const openAddModal = () => {
        setFormData({
            productId: filterProduct || productIdParam || "",
            barcode: "",
            expiryDate: "",
            mrp: "",
            retailRate: "",
            wholesaleRate: "",
            isActive: true
        });
        setFormErrors({});
        setEditingBarcode(null);
        setIsDuplicateBarcode(false);
        
        if (filterProduct || productIdParam) {
            const product = products.find(p => p._id === (filterProduct || productIdParam));
            setSelectedProduct(product || null);
        } else {
            setSelectedProduct(null);
        }
        
        setShowModal(true);
    };

    const editBarcode = (barcode) => {
        setEditingBarcode(barcode);
        setFormData({
            productId: barcode.productId?._id || barcode.productId,
            barcode: barcode.barcode,
            expiryDate: new Date(barcode.expiryDate).toISOString().split('T')[0],
            mrp: barcode.mrp,
            retailRate: barcode.retailRate || '',
            wholesaleRate: barcode.wholesaleRate || '',
            isActive: barcode.isActive
        });
        setFormErrors({});
        setIsDuplicateBarcode(false);
        if (barcode.productId) {
            setSelectedProduct(barcode.productId);
        }
        setShowModal(true);
    };

    const saveBarcode = async () => {
        // Check for duplicate before validation
        if (formData.barcode && !editingBarcode) {
            const existingBarcode = barcodes.find(b => b.barcode === formData.barcode);
            if (existingBarcode) {
                showNotification(`❌ Barcode "${formData.barcode}" already exists! Please use a unique barcode.`, 'error');
                setFormErrors(prev => ({
                    ...prev,
                    barcode: `Barcode "${formData.barcode}" already exists`
                }));
                return;
            }
        }

        if (!validateForm()) return;
        
        setSaving(true);
        try {
            const payload = {
                ...formData,
                companyId,
                expiryDate: new Date(formData.expiryDate).toISOString(),
                mrp: parseFloat(formData.mrp),
                retailRate: parseFloat(formData.retailRate) || 0,
                wholesaleRate: parseFloat(formData.wholesaleRate) || 0,
                isActive: formData.isActive
            };

            if (editingBarcode) {
                await axios.put(`${API}/barcodes/${editingBarcode._id}`, payload);
                showNotification('✅ Barcode updated successfully!');
            } else {
                await axios.post(`${API}/barcodes`, payload);
                showNotification('✅ Barcode created successfully!');
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving barcode:', error);
            
            // Check if error is due to duplicate barcode
            if (error.response?.data?.message?.includes('duplicate') || 
                error.response?.data?.message?.includes('already exists')) {
                showNotification(`❌ ${error.response.data.message}`, 'error');
                setFormErrors(prev => ({
                    ...prev,
                    barcode: error.response.data.message
                }));
            } else {
                showNotification(error.response?.data?.message || 'Failed to save barcode', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    // Toggle status function
    const toggleStatus = async (barcode) => {
        if (togglingStatus) return;
        
        setTogglingStatus(barcode._id);
        try {
            const payload = {
                ...barcode,
                isActive: !barcode.isActive,
                companyId,
                expiryDate: new Date(barcode.expiryDate).toISOString(),
                mrp: parseFloat(barcode.mrp),
                retailRate: parseFloat(barcode.retailRate) || 0,
                wholesaleRate: parseFloat(barcode.wholesaleRate) || 0
            };
            
            await axios.put(`${API}/barcodes/${barcode._id}`, payload);
            showNotification(`✅ Barcode ${!barcode.isActive ? 'activated' : 'deactivated'} successfully!`);
            loadData();
        } catch (error) {
            console.error('Error toggling status:', error);
            showNotification('Failed to update status', 'error');
        } finally {
            setTogglingStatus(null);
        }
    };

    const resetForm = () => {
        setFormData({
            productId: filterProduct || productIdParam || "",
            barcode: "",
            expiryDate: "",
            mrp: "",
            retailRate: "",
            wholesaleRate: "",
            isActive: true
        });
        setFormErrors({});
        setEditingBarcode(null);
        setIsDuplicateBarcode(false);
        if (filterProduct || productIdParam) {
            const product = products.find(p => p._id === (filterProduct || productIdParam));
            setSelectedProduct(product || null);
        } else {
            setSelectedProduct(null);
        }
    };

    const importFromExcel = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setImporting(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const barcodesToImport = jsonData.map(row => ({
                productId: row.ProductId || row.productId,
                barcode: row.Barcode || row.barcode,
                expiryDate: row.ExpiryDate || row.expiryDate,
                mrp: row.MRP || row.mrp,
                retailRate: row.RetailRate || row.retailRate || 0,
                wholesaleRate: row.WholesaleRate || row.wholesaleRate || 0
            }));

            // Check for duplicate barcodes in the import
            const existingBarcodes = barcodes.map(b => b.barcode);
            const duplicateBarcodes = barcodesToImport
                .filter(b => existingBarcodes.includes(b.barcode))
                .map(b => b.barcode);

            if (duplicateBarcodes.length > 0) {
                showNotification(`❌ Duplicate barcodes found in import: ${duplicateBarcodes.join(', ')}. Please check and try again.`, 'error');
                setImporting(false);
                event.target.value = '';
                return;
            }

            const response = await axios.post(`${API}/barcodes/bulk`, {
                companyId,
                barcodes: barcodesToImport
            });

            showNotification(`✅ ${response.data.message || 'Barcodes imported successfully!'}`);
            loadData();
        } catch (error) {
            console.error('Error importing barcodes:', error);
            if (error.response?.data?.message?.includes('duplicate')) {
                showNotification(`❌ ${error.response.data.message}`, 'error');
            } else {
                showNotification('Failed to import barcodes', 'error');
            }
        } finally {
            setImporting(false);
            event.target.value = '';
        }
    };

    const exportToExcel = () => {
        if (barcodes.length === 0) {
            showNotification('No barcodes to export', 'error');
            return;
        }

        const data = barcodes.map(b => ({
            'Barcode': b.barcode,
            'Product': b.productId?.name || '',
            'Product Code': b.productId?.productCode || '',
            'Expiry Date': new Date(b.expiryDate).toLocaleDateString(),
            'MRP': b.mrp,
            'Retail Rate': b.retailRate || 0,
            'Wholesale Rate': b.wholesaleRate || 0,
            'Status': b.isActive ? 'Active' : 'Inactive'
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        worksheet['!cols'] = [
            { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 },
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Barcodes');
        XLSX.writeFile(workbook, `barcodes_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const isExpired = (date) => {
        return new Date(date) < new Date();
    };

    if (!companyId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-md p-10 rounded-2xl shadow-xl text-center">
                    <div className="text-7xl mb-5">🏢</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">No Company Associated</h2>
                    <p className="text-gray-600 mb-6">Please login again to access barcodes.</p>
                    <button onClick={() => window.location.href = '/login'}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-full mx-auto">
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
                        notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                        {notification.message}
                    </div>
                )}

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        🏷️ Barcode Manager
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Manage product barcodes with expiry dates and pricing information.
                        {selectedProduct && (
                            <span className="block text-purple-600 font-medium mt-1">
                                📦 Currently viewing: {selectedProduct.name} ({selectedProduct.productCode})
                            </span>
                        )}
                    </p>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-2xl shadow-md px-5 py-4 mb-5 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            type="text"
                            placeholder="🔍 Search barcode..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none w-64 text-gray-900"
                        />
                        <select
                            value={filterProduct}
                            onChange={e => {
                                setFilterProduct(e.target.value);
                                const product = products.find(p => p._id === e.target.value);
                                setSelectedProduct(product || null);
                                setFormData(prev => ({
                                    ...prev,
                                    productId: e.target.value
                                }));
                            }}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 bg-white"
                        >
                            <option value="">All Products</option>
                            {products.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={openAddModal}
                            className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold shadow"
                        >
                            ➕ Add Barcode
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="text-sm px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition font-semibold shadow"
                        >
                            📊 Export
                        </button>
                        <label className="text-sm px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-semibold shadow cursor-pointer">
                            📥 Import
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={importFromExcel}
                                className="hidden"
                                disabled={importing}
                            />
                        </label>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50"
                        >
                            🔄 Refresh
                        </button>
                        {filterProduct && (
                            <button
                                onClick={() => {
                                    setFilterProduct("");
                                    setSelectedProduct(null);
                                    setFormData(prev => ({
                                        ...prev,
                                        productId: ""
                                    }));
                                }}
                                className="text-sm px-3 py-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition font-medium"
                            >
                                ✕ Clear Filter
                            </button>
                        )}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Total: {pagination.total} barcodes</span>
                        <div className="flex items-center gap-2">
                            <select
                                value={pagination.limit}
                                onChange={e => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                                className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Barcode Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                            <p className="text-gray-500 mt-4 text-sm">Loading barcodes...</p>
                        </div>
                    ) : barcodes.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <div className="text-5xl mb-3">📭</div>
                            <p>No barcodes found.</p>
                            <button
                                onClick={openAddModal}
                                className="mt-4 text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
                            >
                                Add your first barcode
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider sticky top-0">
                                            <th className="px-3 py-3 text-left">Barcode</th>
                                            <th className="px-3 py-3 text-left">Product</th>
                                            <th className="px-3 py-3 text-center">Expiry Date</th>
                                            <th className="px-3 py-3 text-right">MRP</th>
                                            <th className="px-3 py-3 text-right">Retail</th>
                                            <th className="px-3 py-3 text-right">Wholesale</th>
                                            <th className="px-3 py-3 text-center">Status</th>
                                            <th className="px-3 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {barcodes.map((barcode) => {
                                            const expired = isExpired(barcode.expiryDate);
                                            return (
                                                <tr key={barcode._id} className={`border-b border-gray-100 transition-colors ${
                                                    expired ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                                                }`}>
                                                    <td className="px-3 py-2 font-mono text-xs font-semibold text-gray-900">
                                                        {barcode.barcode}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium text-gray-900">
                                                            {barcode.productId?.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {barcode.productId?.productCode || ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            expired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {formatDate(barcode.expiryDate)}
                                                            {expired && ' ⚠️'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                                                        ₹{barcode.mrp.toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-gray-700">
                                                        ₹{(barcode.retailRate || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-gray-700">
                                                        ₹{(barcode.wholesaleRate || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                checked={barcode.isActive}
                                                                onChange={() => toggleStatus(barcode)}
                                                                disabled={togglingStatus === barcode._id}
                                                            />
                                                            <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 transition-all duration-300 
                                                                ${togglingStatus === barcode._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 
                                                                    ${barcode.isActive ? 'translate-x-5' : 'translate-x-0'} 
                                                                    ${togglingStatus === barcode._id ? 'opacity-50' : ''}`}>
                                                                </div>
                                                            </div>
                                                            <span className={`ml-2 text-xs font-medium ${
                                                                barcode.isActive ? 'text-green-600' : 'text-gray-500'
                                                            }`}>
                                                                {togglingStatus === barcode._id ? '...' : (barcode.isActive ? 'Active' : 'Inactive')}
                                                            </span>
                                                        </label>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            onClick={() => editBarcode(barcode)}
                                                            className="text-blue-600 hover:text-blue-800 p-1 transition"
                                                            title="Edit"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Page {pagination.page} of {pagination.pages}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.page === 1}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                                bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                        >
                                            ◀ Prev
                                        </button>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.page === pagination.pages}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                                bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                        >
                                            Next ▶
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                                <h3 className="text-lg font-bold text-white">
                                    {editingBarcode ? '✏️ Edit Barcode' : '➕ Add New Barcode'}
                                </h3>
                                <p className="text-white/80 text-xs mt-0.5">
                                    {editingBarcode ? 'Update barcode details' : 'Create a new product barcode'}
                                </p>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Product Selection - Disabled in Edit Mode */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.productId}
                                        onChange={e => handleFormChange('productId', e.target.value)}
                                        disabled={!!editingBarcode}
                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 bg-white ${
                                            editingBarcode ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''
                                        } ${
                                            formErrors.productId ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} ({p.productCode})
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.productId && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.productId}</p>
                                    )}
                                    {editingBarcode && (
                                        <p className="text-xs text-gray-500 mt-1">⚠️ Product cannot be changed in edit mode</p>
                                    )}
                                    {selectedProduct && (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                                            <span className="text-blue-600">✅</span>
                                            <span className="text-sm text-gray-700">
                                                Selected: <strong>{selectedProduct.name}</strong> ({selectedProduct.productCode})
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Barcode with duplicate check */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Barcode <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.barcode}
                                        onChange={e => handleFormChange('barcode', e.target.value)}
                                        placeholder="Enter barcode number"
                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 ${
                                            formErrors.barcode ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        } ${isDuplicateBarcode ? 'border-red-400 bg-red-50' : ''}`}
                                    />
                                    {formErrors.barcode && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.barcode}</p>
                                    )}
                                    {isDuplicateBarcode && (
                                        <div className="mt-1 flex items-center gap-2 text-red-600 text-xs">
                                            <span>⚠️</span>
                                            <span>This barcode already exists in the system</span>
                                        </div>
                                    )}
                                    {!isDuplicateBarcode && formData.barcode && !formErrors.barcode && (
                                        <p className="text-green-500 text-xs mt-1">✅ Barcode is available</p>
                                    )}
                                </div>

                                {/* Expiry Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expiry Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={e => handleFormChange('expiryDate', e.target.value)}
                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 ${
                                            formErrors.expiryDate ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    />
                                    {formErrors.expiryDate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.expiryDate}</p>
                                    )}
                                </div>

                                {/* Pricing Fields - One below another */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        MRP (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.mrp}
                                        onChange={e => handleFormChange('mrp', e.target.value)}
                                        placeholder="Enter MRP"
                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 ${
                                            formErrors.mrp ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    />
                                    {formErrors.mrp && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.mrp}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Retail Rate (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.retailRate}
                                        onChange={e => handleFormChange('retailRate', e.target.value)}
                                        placeholder="Enter retail rate"
                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 ${
                                            formErrors.retailRate ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    />
                                    {formErrors.retailRate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.retailRate}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Wholesale Rate (₹)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.wholesaleRate}
                                        onChange={e => handleFormChange('wholesaleRate', e.target.value)}
                                        placeholder="Enter wholesale rate"
                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 ${
                                            formErrors.wholesaleRate ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        }`}
                                    />
                                    {formErrors.wholesaleRate && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.wholesaleRate}</p>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 pb-5 flex gap-3 justify-end border-t border-gray-100 pt-4">
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveBarcode}
                                    disabled={saving || isDuplicateBarcode}
                                    className={`px-5 py-2 rounded-xl text-white transition text-sm font-semibold shadow ${
                                        isDuplicateBarcode 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {saving ? 'Saving...' : editingBarcode ? 'Update Barcode' : 'Add Barcode'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BarcodeManager;