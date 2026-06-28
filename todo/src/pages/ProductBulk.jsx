import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}`;

// Memoized cell components to prevent unnecessary re-renders
const CellInput = memo(({ value, onChange, type = "text", error, dirty, className = "", placeholder, onKeyDown, inputRef }) => (
    <div>
        <input
            ref={inputRef}
            type={type}
            value={value ?? ""}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className={`border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 outline-none transition text-gray-900 bg-white ${className}
                ${error ? "border-red-400 bg-red-50" : dirty ? "border-amber-400 bg-amber-50" : "border-gray-200"}`}
        />
        {error && <p className="text-red-500 text-[10px] mt-0.5 whitespace-nowrap">{error}</p>}
    </div>
));

const CellSelect = memo(({ value, onChange, options, error, dirty, className = "", selectRef, onKeyDown }) => (
    <div>
        <select
            ref={selectRef}
            value={value ?? ""}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className={`border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 outline-none transition text-gray-900 bg-white ${className}
                ${error ? "border-red-400 bg-red-50" : dirty ? "border-amber-400 bg-amber-50" : "border-gray-200"}`}
        >
            <option value="">— Select —</option>
            {options.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
        </select>
        {error && <p className="text-red-500 text-[10px] mt-0.5 whitespace-nowrap">{error}</p>}
    </div>
));

// Memoized product row component
const ProductRow = memo(({ 
    product, 
    idx, 
    isSelected, 
    dirty, 
    rowErrors, 
    getValue, 
    handleCellChange, 
    toggleSelect, 
    discardRow, 
    saveSingleRow,
    categories, 
    brands, 
    uoms, 
    saving,
    editedRows
}) => {
    const inactive = getValue(product, "isActive") === false || getValue(product, "isActive") === "false";
    
    return (
        <tr className={`border-b border-gray-100 transition-colors
            ${dirty ? "bg-amber-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
            ${isSelected ? "ring-2 ring-inset ring-indigo-400" : ""}
            ${inactive && !dirty ? "opacity-60" : ""}
        `}>
            <td className="px-3 py-2 text-center">
                <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleSelect(product._id)}
                    className="w-4 h-4 rounded text-indigo-500 cursor-pointer" 
                />
            </td>
            <td className="px-2 py-1.5">
                <CellInput
                    value={getValue(product, "productCode")}
                    onChange={v => handleCellChange(product._id, "productCode", v)}
                    error={rowErrors.productCode}
                    dirty={dirty && "productCode" in (editedRows[product._id] || {})}
                    className="font-mono w-28"
                />
            </td>
            <td className="px-2 py-1.5">
                <CellInput
                    value={getValue(product, "name")}
                    onChange={v => handleCellChange(product._id, "name", v)}
                    error={rowErrors.name}
                    dirty={dirty && "name" in (editedRows[product._id] || {})}
                    className="w-80"
                />
            </td>
            <td className="px-2 py-1.5">
                <CellInput
                    value={getValue(product, "tamilName")}
                    onChange={v => handleCellChange(product._id, "tamilName", v)}
                    error={rowErrors.tamilName}
                    dirty={dirty && "tamilName" in (editedRows[product._id] || {})}
                    className="w-80"
                />
            </td>
            <td className="px-2 py-1.5">
                <CellInput
                    value={getValue(product, "mrp")}
                    onChange={v => handleCellChange(product._id, "mrp", v)}
                    type="number"
                    error={rowErrors.mrp}
                    dirty={dirty && "mrp" in (editedRows[product._id] || {})}
                    className="w-24 text-right"
                />
            </td>
            <td className="px-2 py-1.5">
                <CellInput
                    value={getValue(product, "retailRate")}
                    onChange={v => handleCellChange(product._id, "retailRate", v)}
                    type="number"
                    error={rowErrors.retailRate}
                    dirty={dirty && "retailRate" in (editedRows[product._id] || {})}
                    className="w-24 text-right"
                />
            </td>
            <td className="px-2 py-1.5">
                <CellInput
                    value={getValue(product, "wholesaleRate")}
                    onChange={v => handleCellChange(product._id, "wholesaleRate", v)}
                    type="number"
                    error={rowErrors.wholesaleRate}
                    dirty={dirty && "wholesaleRate" in (editedRows[product._id] || {})}
                    className="w-24 text-right"
                />
            </td>
            <td className="px-2 py-1.5">
                <CellSelect
                    value={getValue(product, "category")}
                    onChange={v => handleCellChange(product._id, "category", v)}
                    options={categories}
                    error={rowErrors.category}
                    dirty={dirty && "category" in (editedRows[product._id] || {})}
                    className="w-36"
                />
            </td>
            <td className="px-2 py-1.5">
                <CellSelect
                    value={getValue(product, "brand")}
                    onChange={v => handleCellChange(product._id, "brand", v)}
                    options={brands}
                    error={rowErrors.brand}
                    dirty={dirty && "brand" in (editedRows[product._id] || {})}
                    className="w-36"
                />
            </td>
            <td className="px-2 py-1.5">
                <CellSelect
                    value={getValue(product, "uom")}
                    onChange={v => handleCellChange(product._id, "uom", v)}
                    options={uoms}
                    error={rowErrors.uom}
                    dirty={dirty && "uom" in (editedRows[product._id] || {})}
                    className="w-32"
                />
            </td>
            <td className="px-2 py-1.5 text-center">
                <select
                    value={String(getValue(product, "isActive"))}
                    onChange={e => handleCellChange(product._id, "isActive", e.target.value === "true")}
                    className={`border rounded-lg px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-blue-400 outline-none transition
                        ${"isActive" in (editedRows[product._id] || {}) ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"}
                        ${inactive ? "text-red-600" : "text-green-700"}`}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </td>
            <td className="px-2 py-1.5 text-center">
                <div className="flex items-center justify-center gap-1">
                    {dirty ? (
                        <>
                            <button
                                onClick={() => saveSingleRow(product)}
                                className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-blue-600 transition font-semibold whitespace-nowrap"
                            >
                                💾 Save
                            </button>
                            <button
                                onClick={() => discardRow(product._id)}
                                className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs hover:bg-gray-300 transition font-semibold"
                            >
                                ✖
                            </button>
                        </>
                    ) : (
                        <span className="text-gray-300 text-xs select-none">—</span>
                    )}
                </div>
            </td>
        </tr>
    );
});

const ProductBulk = () => {
    const companyId = localStorage.getItem("companyId");

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editedRows, setEditedRows] = useState({});
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterUom, setFilterUom] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [saveResult, setSaveResult] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [newRows, setNewRows] = useState([]);
    const [newRowErrors, setNewRowErrors] = useState({});
    const [bulkField, setBulkField] = useState("");
    const [bulkValue, setBulkValue] = useState("");
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    
    // Quick-add modal state
    const [quickAdd, setQuickAdd] = useState(null);
    const [quickAddName, setQuickAddName] = useState("");
    const [quickAddSaving, setQuickAddSaving] = useState(false);
    const [quickAddError, setQuickAddError] = useState("");

    // Refs
    const newRowCodeRefs = useRef({});
    const newRowFieldRefs = useRef({});
    const newRowSelectRefs = useRef({});
    const debounceTimerRef = useRef(null);

    // Memoized filtered products for performance
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesStatus = filterStatus === "active"
                ? p.isActive !== false
                : filterStatus === "inactive"
                    ? p.isActive === false
                    : true;
            const matchesSearch =
                !search ||
                p.name?.toLowerCase().includes(search.toLowerCase()) ||
                p.productCode?.toLowerCase().includes(search.toLowerCase()) ||
                p.tamilName?.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = !filterCategory || p.category?._id === filterCategory;
            const matchesBrand = !filterBrand || p.brand?._id === filterBrand;
            const matchesUom = !filterUom || p.uom?._id === filterUom;
            return matchesStatus && matchesSearch && matchesCategory && matchesBrand && matchesUom;
        });
    }, [products, filterStatus, search, filterCategory, filterBrand, filterUom]);

    // Get UOMs that are actually used in products
    const availableUoms = useMemo(() => {
        // Get unique UOM IDs from products
        const usedUomIds = new Set();
        products.forEach(p => {
            if (p.uom?._id) {
                usedUomIds.add(p.uom._id);
            }
        });
        
        // Filter UOMs to only those used in products
        return uoms.filter(uom => usedUomIds.has(uom._id));
    }, [products, uoms]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterCategory, filterBrand, filterUom, filterStatus]);

    const activeFilterCount = useMemo(() => {
        return [filterCategory, filterBrand, filterUom, filterStatus, search].filter(Boolean).length;
    }, [filterCategory, filterBrand, filterUom, filterStatus, search]);

    const dirtyCount = useMemo(() => {
        return Object.keys(editedRows).filter(id => Object.keys(editedRows[id]).length > 0).length;
    }, [editedRows]);

    useEffect(() => {
        if (companyId) loadData();
    }, [companyId]);

    const loadData = async () => {
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
        } catch (err) {
            alert("Failed to load data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    // Debounced cell change handler
    const handleCellChange = useCallback((productId, field, value) => {
        // Clear any pending debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        // Update state immediately for responsive UI
        setEditedRows(prev => ({
            ...prev,
            [productId]: { ...(prev[productId] || {}), [field]: value }
        }));
        
        // Clear error for this field
        if (errors[productId]?.[field]) {
            setErrors(prev => ({
                ...prev,
                [productId]: { ...(prev[productId] || {}), [field]: "" }
            }));
        }
    }, [errors]);

    const getValue = useCallback((product, field) => {
        if (editedRows[product._id] && field in editedRows[product._id]) {
            return editedRows[product._id][field];
        }
        if (field === "category") return product.category?._id || "";
        if (field === "brand") return product.brand?._id || "";
        if (field === "uom") return product.uom?._id || "";
        return product[field] ?? "";
    }, [editedRows]);

    const validateRow = useCallback((product) => {
        const errs = {};
        const row = editedRows[product._id] || {};
        const get = (f) => (f in row ? row[f] : getValue(product, f));

        if (!get("productCode")?.toString().trim()) errs.productCode = "Required";
        if (!get("name")?.toString().trim()) errs.name = "Required";
        if (!get("tamilName")?.toString().trim()) errs.tamilName = "Required";
        if (!get("mrp") || parseFloat(get("mrp")) <= 0) errs.mrp = "Must be > 0";
        if (!get("retailRate") || parseFloat(get("retailRate")) <= 0) errs.retailRate = "Must be > 0";
        if (!get("wholesaleRate") || parseFloat(get("wholesaleRate")) <= 0) errs.wholesaleRate = "Must be > 0";
        if (!get("category")) errs.category = "Required";
        if (!get("brand")) errs.brand = "Required";
        if (!get("uom")) errs.uom = "Required";
        return errs;
    }, [editedRows, getValue]);

    const saveSingleRow = useCallback(async (product) => {
        const errs = validateRow(product);
        if (Object.keys(errs).length > 0) {
            setErrors(prev => ({ ...prev, [product._id]: errs }));
            return;
        }
        
        setSaving(true);
        const merged = {
            productCode: getValue(product, "productCode"),
            name: getValue(product, "name"),
            tamilName: getValue(product, "tamilName"),
            mrp: getValue(product, "mrp"),
            retailRate: getValue(product, "retailRate"),
            wholesaleRate: getValue(product, "wholesaleRate"),
            category: getValue(product, "category"),
            brand: getValue(product, "brand"),
            uom: getValue(product, "uom"),
            isActive: getValue(product, "isActive"),
            companyId,
        };
        
        try {
            const res = await axios.put(`${API}/products/${product._id}?companyId=${companyId}`, merged);
            setProducts(prev => prev.map(p => p._id === product._id ? res.data : p));
            // Clear edited row
            setEditedRows(prev => {
                const updated = { ...prev };
                delete updated[product._id];
                return updated;
            });
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[product._id];
                return updated;
            });
            
            // Show success feedback
            const notification = document.createElement('div');
            notification.textContent = `✅ ${product.name} saved successfully`;
            notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        } catch (err) {
            alert(`Failed to save ${product.name}`);
        } finally {
            setSaving(false);
        }
    }, [validateRow, getValue, companyId]);

    const saveAll = useCallback(async () => {
        const idsToSave = Object.keys(editedRows).filter(id => Object.keys(editedRows[id]).length > 0);
        if (idsToSave.length === 0) return;

        // Validate all dirty rows
        let hasErrors = false;
        const newErrors = {};
        for (const id of idsToSave) {
            const product = products.find(p => p._id === id);
            if (!product) continue;
            const errs = validateRow(product);
            if (Object.keys(errs).length > 0) {
                newErrors[id] = errs;
                hasErrors = true;
            }
        }
        setErrors(newErrors);
        if (hasErrors) {
            alert("Please fix validation errors before saving.");
            return;
        }

        setSaving(true);
        const results = { success: [], failed: [] };

        // Use Promise.allSettled for better performance with parallel saves
        const savePromises = idsToSave.map(async (id) => {
            const product = products.find(p => p._id === id);
            if (!product) return { name: product?.name, success: false };

            const merged = {
                productCode: getValue(product, "productCode"),
                name: getValue(product, "name"),
                tamilName: getValue(product, "tamilName"),
                mrp: getValue(product, "mrp"),
                retailRate: getValue(product, "retailRate"),
                wholesaleRate: getValue(product, "wholesaleRate"),
                category: getValue(product, "category"),
                brand: getValue(product, "brand"),
                uom: getValue(product, "uom"),
                isActive: getValue(product, "isActive"),
                companyId,
            };

            try {
                const res = await axios.put(`${API}/products/${id}?companyId=${companyId}`, merged);
                setProducts(prev => prev.map(p => p._id === id ? res.data : p));
                return { name: product.name, success: true };
            } catch (err) {
                return { name: product.name, success: false };
            }
        });

        const results_array = await Promise.allSettled(savePromises);
        
        results_array.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                if (result.value.success) {
                    results.success.push(result.value.name);
                } else {
                    results.failed.push(result.value.name);
                }
            }
        });

        // Clear saved rows from editedRows
        setEditedRows(prev => {
            const updated = { ...prev };
            results.success.forEach(name => {
                const product = products.find(p => p.name === name);
                if (product) delete updated[product._id];
            });
            return updated;
        });

        setSaveResult(results);
        setSaving(false);
        setTimeout(() => setSaveResult(null), 5000);
    }, [editedRows, products, validateRow, getValue, companyId]);

    const discardRow = useCallback((productId) => {
        setEditedRows(prev => {
            const updated = { ...prev };
            delete updated[productId];
            return updated;
        });
        setErrors(prev => {
            const updated = { ...prev };
            delete updated[productId];
            return updated;
        });
    }, []);

    const discardAll = useCallback(() => {
        if (!window.confirm("Discard all unsaved changes?")) return;
        setEditedRows({});
        setErrors({});
    }, []);

    // Bulk selection handlers - only for current page
    const toggleSelectAll = useCallback(() => {
        if (selectAll) {
            setSelectedIds(new Set());
            setSelectAll(false);
        } else {
            setSelectedIds(new Set(currentProducts.map(p => p._id)));
            setSelectAll(true);
        }
    }, [selectAll, currentProducts]);

    const toggleSelect = useCallback((id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            setSelectAll(false);
            return next;
        });
    }, []);

    const applyBulkField = useCallback(() => {
        if (!bulkField || !bulkValue || selectedIds.size === 0) return;
        const updates = {};
        selectedIds.forEach(id => {
            updates[id] = { ...(editedRows[id] || {}), [bulkField]: bulkValue };
        });
        setEditedRows(prev => ({ ...prev, ...updates }));
        setBulkField("");
        setBulkValue("");
    }, [bulkField, bulkValue, selectedIds, editedRows]);

    // Pagination handlers
    const goToPage = useCallback((page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    const handleRowsPerPageChange = useCallback((e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setCurrentPage(1); // Reset to first page
    }, []);

    // New row handlers
    const addNewRow = useCallback(() => {
        const tempId = `new_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const emptyRow = {
            tempId,
            productCode: "",
            name: "",
            tamilName: "",
            _tamilNamePristine: "",
            mrp: "",
            retailRate: "",
            wholesaleRate: "",
            category: "",
            brand: "",
            uom: "",
            isActive: true,
        };
        setNewRows(prev => [emptyRow, ...prev]);
        setTimeout(() => {
            newRowCodeRefs.current[tempId]?.focus();
        }, 50);
    }, []);

    const handleNewRowChange = useCallback((tempId, field, value) => {
        setNewRows(prev => prev.map(r => {
            if (r.tempId !== tempId) return r;
            const updated = { ...r, [field]: value };
            if (field === "name" && r.tamilName === r._tamilNamePristine) {
                updated.tamilName = value;
                updated._tamilNamePristine = value;
            }
            if (field === "tamilName") {
                updated._tamilNamePristine = undefined;
            }
            return updated;
        }));
        if (newRowErrors[tempId]?.[field]) {
            setNewRowErrors(prev => ({ ...prev, [tempId]: { ...(prev[tempId] || {}), [field]: "" } }));
        }
    }, [newRowErrors]);

    const validateNewRow = useCallback((row) => {
        const errs = {};
        if (!row.productCode?.trim()) errs.productCode = "Required";
        if (!row.name?.trim()) errs.name = "Required";
        if (!row.tamilName?.trim()) errs.tamilName = "Required";
        if (!row.mrp || parseFloat(row.mrp) <= 0) errs.mrp = "Must be > 0";
        if (!row.retailRate || parseFloat(row.retailRate) <= 0) errs.retailRate = "Must be > 0";
        if (!row.wholesaleRate || parseFloat(row.wholesaleRate) <= 0) errs.wholesaleRate = "Must be > 0";
        if (!row.category) errs.category = "Required";
        if (!row.brand) errs.brand = "Required";
        if (!row.uom) errs.uom = "Required";
        return errs;
    }, []);

    const saveNewRow = useCallback(async (tempId) => {
        const row = newRows.find(r => r.tempId === tempId);
        if (!row) return;
        const errs = validateNewRow(row);
        if (Object.keys(errs).length > 0) {
            setNewRowErrors(prev => ({ ...prev, [tempId]: errs }));
            return;
        }
        setSaving(true);
        try {
            const payload = {
                productCode: row.productCode,
                name: row.name,
                tamilName: row.tamilName,
                mrp: row.mrp,
                retailRate: row.retailRate,
                wholesaleRate: row.wholesaleRate,
                category: row.category,
                brand: row.brand,
                uom: row.uom,
                isActive: row.isActive,
                companyId,
            };
            const res = await axios.post(`${API}/products?companyId=${companyId}`, payload);
            setProducts(prev => [res.data, ...prev]);
            
            const nextTempId = `new_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const nextEmptyRow = {
                tempId: nextTempId,
                productCode: "",
                name: row.name,
                tamilName: row.tamilName,
                _tamilNamePristine: row.tamilName,
                mrp: "",
                retailRate: "",
                wholesaleRate: "",
                category: row.category,
                brand: row.brand,
                uom: row.uom,
                isActive: true,
            };
            setNewRows(prev => {
                const remaining = prev.filter(r => r.tempId !== tempId);
                return [nextEmptyRow, ...remaining];
            });
            setNewRowErrors(prev => { const u = { ...prev }; delete u[tempId]; return u; });
            delete newRowCodeRefs.current[tempId];
            setTimeout(() => { newRowCodeRefs.current[nextTempId]?.focus(); }, 50);
        } catch (err) {
            alert(err.response?.data?.message || `Failed to save new product.`);
        } finally {
            setSaving(false);
        }
    }, [newRows, validateNewRow, companyId]);

    const discardNewRow = useCallback((tempId) => {
        setNewRows(prev => prev.filter(r => r.tempId !== tempId));
        setNewRowErrors(prev => { const u = { ...prev }; delete u[tempId]; return u; });
        delete newRowCodeRefs.current[tempId];
    }, []);

    // Quick-add handlers
    const openQuickAdd = useCallback((type, tempId, field) => {
        setQuickAdd({ type, tempId, field });
        setQuickAddName("");
        setQuickAddError("");
    }, []);

    const closeQuickAdd = useCallback(() => {
        setQuickAdd(null);
        setQuickAddName("");
        setQuickAddError("");
    }, []);

    const saveQuickAdd = useCallback(async () => {
        if (!quickAddName.trim()) { setQuickAddError("Name is required"); return; }
        setQuickAddSaving(true);
        setQuickAddError("");
        try {
            const endpoint = quickAdd.type === "brand" ? "brands" : "categories";
            const res = await axios.post(`${API}/${endpoint}?companyId=${companyId}`, {
                companyId,
                name: quickAddName.trim(),
            });
            const newItem = res.data;
            if (quickAdd.type === "brand") {
                setBrands(prev => [newItem, ...prev]);
            } else {
                setCategories(prev => [newItem, ...prev]);
            }
            const { tempId: qTempId, field: qField } = quickAdd;
            if (qTempId) {
                handleNewRowChange(qTempId, qField, newItem._id);
            }
            closeQuickAdd();
            setTimeout(() => {
                newRowSelectRefs.current[`${qTempId}_${qField}`]?.focus();
            }, 80);
        } catch (err) {
            setQuickAddError(err.response?.data?.message || `Failed to create ${quickAdd.type}`);
        } finally {
            setQuickAddSaving(false);
        }
    }, [quickAdd, quickAddName, companyId, handleNewRowChange, closeQuickAdd]);

    const clearAllFilters = useCallback(() => {
        setSearch("");
        setFilterCategory("");
        setFilterBrand("");
        setFilterUom("");
        setFilterStatus("");
    }, []);

    const bulkFieldOptions = [
        { value: "category", label: "Category" },
        { value: "brand", label: "Brand" },
        { value: "uom", label: "UOM" },
        { value: "isActive", label: "Status" },
    ];

    const getBulkValueOptions = useCallback(() => {
        if (bulkField === "category") return categories.map(c => ({ value: c._id, label: c.name }));
        if (bulkField === "brand") return brands.map(b => ({ value: b._id, label: b.name }));
        if (bulkField === "uom") return uoms.map(u => ({ value: u._id, label: u.name }));
        if (bulkField === "isActive") return [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }];
        return [];
    }, [bulkField, categories, brands, uoms]);

    if (!companyId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-md p-10 rounded-2xl shadow-xl text-center">
                    <div className="text-7xl mb-5">🏢</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">No Company Associated</h2>
                    <p className="text-gray-600 mb-6">Please login again to access products.</p>
                    <button onClick={() => window.location.href = '/login'}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        📦 Bulk Product Editor
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Edit multiple product fields inline — changes are highlighted until you save.
                    </p>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-2xl shadow-md px-5 py-4 mb-5 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            type="text"
                            placeholder="🔍 Search by name, code, Tamil name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none w-64 text-gray-900"
                        />
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 bg-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <select
                            value={filterBrand}
                            onChange={e => setFilterBrand(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 bg-white"
                        >
                            <option value="">All Brands</option>
                            {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        <select
                            value={filterUom}
                            onChange={e => setFilterUom(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 bg-white"
                        >
                            <option value="">All UOMs</option>
                            {availableUoms.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 bg-white"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
                            >
                                ✕ Clear filters
                                <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                    {activeFilterCount}
                                </span>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {dirtyCount > 0 && (
                            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-300">
                                {dirtyCount} unsaved {dirtyCount === 1 ? "change" : "changes"}
                            </span>
                        )}
                        <button onClick={addNewRow}
                            className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold shadow">
                            ➕ Add New Product
                        </button>
                        <button onClick={loadData} disabled={loading}
                            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium disabled:opacity-50">
                            🔄 Refresh
                        </button>
                        {dirtyCount > 0 && (
                            <>
                                <button onClick={discardAll} disabled={saving}
                                    className="text-sm px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition font-medium">
                                    ✖ Discard All
                                </button>
                                <button onClick={saveAll} disabled={saving}
                                    className="text-sm px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold shadow disabled:opacity-60">
                                    {saving ? "Saving..." : `💾 Save ${dirtyCount} ${dirtyCount === 1 ? "Change" : "Changes"}`}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Save Result Banner */}
                {saveResult && (
                    <div className={`mb-4 px-5 py-3 rounded-xl text-sm font-medium flex gap-4 flex-wrap ${saveResult.failed.length === 0 ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                        {saveResult.success.length > 0 && <span>✅ Saved: {saveResult.success.join(", ")}</span>}
                        {saveResult.failed.length > 0 && <span>❌ Failed: {saveResult.failed.join(", ")}</span>}
                    </div>
                )}

                {/* Bulk Apply Bar */}
                {selectedIds.size > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-3 mb-5 flex flex-wrap gap-3 items-center">
                        <span className="text-sm font-semibold text-indigo-700">
                            {selectedIds.size} row{selectedIds.size > 1 ? "s" : ""} selected
                        </span>
                        <select value={bulkField} onChange={e => { setBulkField(e.target.value); setBulkValue(""); }}
                            className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-400 outline-none">
                            <option value="">Choose field...</option>
                            {bulkFieldOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {bulkField && (
                            <select value={bulkValue} onChange={e => setBulkValue(e.target.value)}
                                className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-400 outline-none">
                                <option value="">Choose value...</option>
                                {getBulkValueOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        )}
                        <button onClick={applyBulkField} disabled={!bulkField || !bulkValue}
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40">
                            Apply
                        </button>
                        <button onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}
                            className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                            Clear
                        </button>
                    </div>
                )}

                {/* Stats and Pagination Controls */}
                <div className="flex justify-between items-center mb-3 px-1">
                    <div className="text-xs text-gray-500">
                        Showing <span className="font-semibold text-gray-700">{startIndex + 1}</span> to <span className="font-semibold text-gray-700">{Math.min(endIndex, filteredProducts.length)}</span> of <span className="font-semibold text-gray-700">{filteredProducts.length}</span> products
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={rowsPerPage}
                            onChange={handleRowsPerPageChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                            <p className="text-gray-500 mt-4 text-sm">Loading products...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <div className="text-5xl mb-3">📭</div>
                            <p>No products found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider sticky top-0">
                                            <th className="px-3 py-3 text-center w-10">
                                                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll}
                                                    className="w-4 h-4 rounded text-blue-500 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">Code</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap min-w-[300px]">Product Name</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap min-w-[300px]">Tamil Name</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">MRP (₹)</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Retail (₹)</th>
                                            <th className="px-3 py-3 text-right whitespace-nowrap">Wholesale (₹)</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">Category</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">Brand</th>
                                            <th className="px-3 py-3 text-left whitespace-nowrap">UOM</th>
                                            <th className="px-3 py-3 text-center whitespace-nowrap">Status</th>
                                            <th className="px-3 py-3 text-center whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* New rows */}
                                        {newRows.map((row) => {
                                            const rowErrs = newRowErrors[row.tempId] || {};
                                            const fRefs = [];
                                            newRowFieldRefs.current[row.tempId] = fRefs;
                                            const fieldRef = (idx) => el => {
                                                fRefs[idx] = el;
                                                if (idx === 0) newRowCodeRefs.current[row.tempId] = el;
                                                if (idx === 6) newRowSelectRefs.current[`${row.tempId}_category`] = el;
                                                if (idx === 7) newRowSelectRefs.current[`${row.tempId}_brand`] = el;
                                            };
                                            const handleKeyDown = (e, fieldIndex) => {
                                                if (e.key !== "Enter") return;
                                                e.preventDefault();
                                                const refs = newRowFieldRefs.current[row.tempId] || [];
                                                const nextRef = refs[fieldIndex + 1];
                                                if (nextRef) {
                                                    nextRef.focus();
                                                } else {
                                                    saveNewRow(row.tempId);
                                                }
                                            };
                                            return (
                                                <tr key={row.tempId} className="border-b border-green-200 bg-green-50">
                                                    <td className="px-3 py-2 text-center">
                                                        <span className="text-green-400 text-xs font-bold">NEW</span>
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <div>
                                                            <input
                                                                ref={fieldRef(0)}
                                                                value={row.productCode}
                                                                onChange={e => handleNewRowChange(row.tempId, "productCode", e.target.value)}
                                                                onKeyDown={e => handleKeyDown(e, 0)}
                                                                className={`border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-green-400 outline-none transition text-gray-900 bg-white font-mono w-28 ${rowErrs.productCode ? "border-red-400 bg-red-50" : "border-green-300"}`}
                                                                placeholder="Code"
                                                            />
                                                            {rowErrs.productCode && <p className="text-red-500 text-[10px] mt-0.5">{rowErrs.productCode}</p>}
                                                        </div>
                                                     </td>
                                                    <td className="px-2 py-1.5">
                                                        <CellInput value={row.name}
                                                            onChange={v => handleNewRowChange(row.tempId, "name", v)}
                                                            onKeyDown={e => handleKeyDown(e, 1)}
                                                            inputRef={fieldRef(1)}
                                                            error={rowErrs.name} dirty={false} className="w-80 border-green-300 bg-white"
                                                            placeholder="Product name" />
                                                     </td>
                                                    <td className="px-2 py-1.5">
                                                        <CellInput value={row.tamilName}
                                                            onChange={v => handleNewRowChange(row.tempId, "tamilName", v)}
                                                            onKeyDown={e => handleKeyDown(e, 2)}
                                                            inputRef={fieldRef(2)}
                                                            error={rowErrs.tamilName} dirty={false} className="w-80 border-green-300 bg-white" />
                                                     </td>
                                                    <td className="px-2 py-1.5">
                                                        <CellInput value={row.mrp} type="number"
                                                            onChange={v => handleNewRowChange(row.tempId, "mrp", v)}
                                                            onKeyDown={e => handleKeyDown(e, 3)}
                                                            inputRef={fieldRef(3)}
                                                            error={rowErrs.mrp} dirty={false} className="w-24 text-right border-green-300 bg-white" />
                                                     </td>
                                                    <td className="px-2 py-1.5">
                                                        <CellInput value={row.retailRate} type="number"
                                                            onChange={v => handleNewRowChange(row.tempId, "retailRate", v)}
                                                            onKeyDown={e => handleKeyDown(e, 4)}
                                                            inputRef={fieldRef(4)}
                                                            error={rowErrs.retailRate} dirty={false} className="w-24 text-right border-green-300 bg-white" />
                                                     </td>
                                                    <td className="px-2 py-1.5">
                                                        <CellInput value={row.wholesaleRate} type="number"
                                                            onChange={v => handleNewRowChange(row.tempId, "wholesaleRate", v)}
                                                            onKeyDown={e => handleKeyDown(e, 5)}
                                                            inputRef={fieldRef(5)}
                                                            error={rowErrs.wholesaleRate} dirty={false} className="w-24 text-right border-green-300 bg-white" />
                                                     </td>
                                                    <td className="px-2 py-1.5">
                                                        <div className="flex items-start gap-1">
                                                            <CellSelect value={row.category}
                                                                onChange={v => handleNewRowChange(row.tempId, "category", v)}
                                                                onKeyDown={e => handleKeyDown(e, 6)}
                                                                options={categories} error={rowErrs.category} dirty={false} className="w-36 border-green-300"
                                                                selectRef={fieldRef(6)} />
                                                            <button tabIndex={-1}
                                                                onClick={() => openQuickAdd("category", row.tempId, "category")}
                                                                className="mt-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-lg px-1.5 py-1 text-xs font-bold transition shrink-0"
                                                            >＋</button>
                                                        </div>
                                                     </td>
                                                    <td className="px-2 py-1.5">
                                                        <div className="flex items-start gap-1">
                                                            <CellSelect value={row.brand}
                                                                onChange={v => handleNewRowChange(row.tempId, "brand", v)}
                                                                onKeyDown={e => handleKeyDown(e, 7)}
                                                                options={brands} error={rowErrs.brand} dirty={false} className="w-36 border-green-300"
                                                                selectRef={fieldRef(7)} />
                                                            <button tabIndex={-1}
                                                                onClick={() => openQuickAdd("brand", row.tempId, "brand")}
                                                                className="mt-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-lg px-1.5 py-1 text-xs font-bold transition shrink-0"
                                                            >＋</button>
                                                        </div>
                                                     </td>
                                                    <td className="px-2 py-1.5">
                                                        <CellSelect value={row.uom}
                                                            onChange={v => handleNewRowChange(row.tempId, "uom", v)}
                                                            onKeyDown={e => handleKeyDown(e, 8)}
                                                            options={uoms} error={rowErrs.uom} dirty={false} className="w-32 border-green-300"
                                                            selectRef={fieldRef(8)} />
                                                     </td>
                                                    <td className="px-2 py-1.5 text-center">
                                                        <select
                                                            ref={fieldRef(9)}
                                                            value={String(row.isActive)}
                                                            onChange={e => handleNewRowChange(row.tempId, "isActive", e.target.value === "true")}
                                                            onKeyDown={e => handleKeyDown(e, 9)}
                                                            className="border border-green-300 rounded-lg px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-green-400 outline-none bg-white text-green-700">
                                                            <option value="true">Active</option>
                                                            <option value="false">Inactive</option>
                                                        </select>
                                                     </td>
                                                    <td className="px-2 py-1.5 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => saveNewRow(row.tempId)} disabled={saving}
                                                                className="bg-green-600 text-white px-2 py-1 rounded-lg text-xs hover:bg-green-700 transition font-semibold whitespace-nowrap disabled:opacity-50">
                                                                💾 Save
                                                            </button>
                                                            <button onClick={() => discardNewRow(row.tempId)}
                                                                className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs hover:bg-gray-300 transition font-semibold">
                                                                ✖
                                                            </button>
                                                        </div>
                                                     </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Existing product rows - current page only */}
                                        {currentProducts.map((product, idx) => (
                                            <ProductRow
                                                key={product._id}
                                                product={product}
                                                idx={idx}
                                                isSelected={selectedIds.has(product._id)}
                                                dirty={Object.keys(editedRows[product._id] || {}).length > 0}
                                                rowErrors={errors[product._id] || {}}
                                                getValue={getValue}
                                                handleCellChange={handleCellChange}
                                                toggleSelect={toggleSelect}
                                                discardRow={discardRow}
                                                saveSingleRow={saveSingleRow}
                                                categories={categories}
                                                brands={brands}
                                                uoms={uoms}
                                                saving={saving}
                                                editedRows={editedRows}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination Footer */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => goToPage(1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                                bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                        >
                                            ⏮ First
                                        </button>
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                                bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                        >
                                            ◀ Prev
                                        </button>
                                        <div className="flex gap-1">
                                            {(() => {
                                                const maxVisible = 5;
                                                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                                                if (endPage - startPage + 1 < maxVisible) {
                                                    startPage = Math.max(1, endPage - maxVisible + 1);
                                                }
                                                const pages = [];
                                                for (let i = startPage; i <= endPage; i++) {
                                                    pages.push(i);
                                                }
                                                return pages.map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`w-8 h-8 text-sm font-semibold rounded-lg transition-all ${
                                                            currentPage === page
                                                                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-200'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                                bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                        >
                                            Next ▶
                                        </button>
                                        <button
                                            onClick={() => goToPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                                bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                        >
                                            Last ⏭
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Quick-Add Modal */}
                {quickAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                            <div className={`px-6 py-4 ${quickAdd.type === "brand" ? "bg-gradient-to-r from-orange-500 to-pink-600" : "bg-gradient-to-r from-blue-600 to-indigo-700"}`}>
                                <h3 className="text-lg font-bold text-white">
                                    {quickAdd.type === "brand" ? "🏷️ Add New Brand" : "📁 Add New Category"}
                                </h3>
                                <p className="text-white/80 text-xs mt-0.5">
                                    This will be saved immediately and available for selection.
                                </p>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {quickAdd.type === "brand" ? "Brand" : "Category"} Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={quickAddName}
                                    onChange={e => { setQuickAddName(e.target.value); setQuickAddError(""); }}
                                    onKeyDown={e => { if (e.key === "Enter") saveQuickAdd(); if (e.key === "Escape") closeQuickAdd(); }}
                                    placeholder={`Enter ${quickAdd.type} name...`}
                                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 ${quickAddError ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                                />
                                {quickAddError && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">⚠️ {quickAddError}</p>
                                )}
                                <p className="text-gray-400 text-xs mt-2">Press Enter to save, Escape to cancel</p>
                            </div>
                            <div className="px-6 pb-5 flex gap-3 justify-end">
                                <button onClick={closeQuickAdd}
                                    className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm font-medium">
                                    Cancel
                                </button>
                                <button onClick={saveQuickAdd} disabled={quickAddSaving}
                                    className={`px-5 py-2 rounded-xl text-white transition text-sm font-semibold shadow disabled:opacity-50 ${quickAdd.type === "brand" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}>
                                    {quickAddSaving ? "Saving..." : `Add ${quickAdd.type === "brand" ? "Brand" : "Category"}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom save bar */}
                {dirtyCount > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-gray-700">
                        <span className="text-sm font-medium text-amber-300">
                            ⚠️ {dirtyCount} unsaved {dirtyCount === 1 ? "change" : "changes"}
                        </span>
                        <button onClick={discardAll}
                            className="text-sm px-4 py-1.5 rounded-lg border border-gray-500 text-gray-300 hover:bg-gray-700 transition font-medium">
                            Discard All
                        </button>
                        <button onClick={saveAll} disabled={saving}
                            className="text-sm px-5 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-400 transition font-semibold disabled:opacity-60">
                            {saving ? "Saving..." : `Save All (${dirtyCount})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductBulk;