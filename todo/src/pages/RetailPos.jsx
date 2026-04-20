import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import useDebounce from '../hooks/useDebounce';
import { formatDateTime, formatForInput, formatCurrency, formatQuantityDisplay } from '../utils/formatters';
import { roundToTwoDecimals } from '../utils/mathHelpers';
import { getSafeString } from '../utils/productHelpers';
import { handlePrintBill } from '../utils/printBill';

const API = `${import.meta.env.VITE_API_URL}`;

// Helper function to extract UOM name from populated object or string
const extractUOMName = (uom) => {
  if (!uom) return 'NOS';
  if (typeof uom === 'object' && uom.name) return uom.name;
  if (typeof uom === 'string') return uom === 'PRIMARY' ? 'NOS' : uom;
  return 'NOS';
};

// --- Product Search & Add Component with Keyboard Navigation ---
const ProductSearchInput = ({ products, onAddToCart, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const qtyInputRef = useRef(null);
  const addButtonRef = useRef(null);
  const selectedProductRef = useRef(null);
  const containerRef = useRef(null);

  // Get UOM display value from product
  const getUOMDisplay = (product) => {
    if (!product) return 'NOS';
    return extractUOMName(product.uom);
  };

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim().length > 1 && !selectedProduct) {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(p => 
        p && p.isActive === true && 
        p.name && (
          p.name.toLowerCase().includes(term) ||
          (p.barcode && p.barcode.toString().includes(term)) ||
          (p.productCode && p.productCode.toString().includes(term))
        )
      );
      setSearchResults(filtered.slice(0, 8));
      setShowResults(true);
      setSelectedIndex(filtered.length > 0 ? 0 : -1);
    } else if (!selectedProduct) {
      setSearchResults([]);
      setShowResults(false);
      setSelectedIndex(-1);
    }
  }, [searchTerm, products, selectedProduct]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && containerRef.current.contains(event.target)) {
        return;
      }
      if (resultsRef.current && !resultsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus quantity input when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setShowResults(false);
      setSearchResults([]);
      setSelectedIndex(-1);
      
      setTimeout(() => {
        if (qtyInputRef.current) {
          qtyInputRef.current.focus();
          qtyInputRef.current.select();
        }
        if (selectedProductRef.current) {
          selectedProductRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [selectedProduct]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && showResults) {
      const selectedElement = document.getElementById(`result-item-${selectedIndex}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, showResults]);

  const handleSelectProduct = (product) => {
    if (!product || !product.name) return;
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowResults(false);
    setSearchResults([]);
    setQuantity(1);
    setSelectedIndex(-1);
  };

  const handleAdd = () => {
    if (!selectedProduct) {
      alert("Please select a product first");
      inputRef.current?.focus();
      return;
    }
    if (quantity <= 0) {
      alert("Please enter a valid quantity");
      qtyInputRef.current?.focus();
      return;
    }
    if (selectedProduct.stock !== undefined && quantity > selectedProduct.stock) {
      alert(`Only ${selectedProduct.stock} units available in stock`);
      qtyInputRef.current?.focus();
      return;
    }
    
    onAddToCart(selectedProduct, quantity);
    
    // Reset after adding
    setSelectedProduct(null);
    setSearchTerm("");
    setQuantity(1);
    setShowResults(false);
    setSearchResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSearchTerm("");
    setQuantity(1);
    setShowResults(false);
    setSearchResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (showResults && searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = selectedIndex < searchResults.length - 1 ? selectedIndex + 1 : 0;
        setSelectedIndex(newIndex);
      } 
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : searchResults.length - 1;
        setSelectedIndex(newIndex);
      }
      else if (e.key === 'Enter' && selectedIndex >= 0 && searchResults[selectedIndex]) {
        e.preventDefault();
        handleSelectProduct(searchResults[selectedIndex]);
      }
    }
    
    if (e.key === 'Enter' && !showResults && searchTerm.trim()) {
      e.preventDefault();
      if (selectedProduct) {
        qtyInputRef.current?.focus();
      } else if (searchResults.length === 1) {
        handleSelectProduct(searchResults[0]);
      } else if (searchResults.length > 0 && selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSelectProduct(searchResults[selectedIndex]);
      }
    }
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (selectedProduct && value !== selectedProduct.name) {
      setSelectedProduct(null);
    }
  };

  const safeString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return '';
    return String(value);
  };

  return (
    <div ref={containerRef} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Add Item</h3>
      
      {/* Product Search */}
      <div className="relative mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by product name, barcode, or code... (↑ ↓ to navigate, Enter to select)"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchTerm.trim().length > 1 && !selectedProduct) {
                setShowResults(true);
              }
            }}
            onKeyDown={handleKeyDown}
            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-gray-900 bg-white"
            autoComplete="off"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && !selectedProduct && (
          <div 
            ref={resultsRef}
            className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto"
          >
            {searchResults.map((product, idx) => (
              <button
                id={`result-item-${idx}`}
                key={product._id || idx}
                onClick={() => handleSelectProduct(product)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left p-3 transition-colors border-b border-gray-100 last:border-0 ${
                  selectedIndex === idx 
                    ? 'bg-indigo-100 border-l-4 border-l-indigo-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">
                      {safeString(product.name)}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-gray-600">
                        Stock: {product.stock !== undefined && product.stock !== null ? product.stock : '∞'} {getUOMDisplay(product)}
                      </span>
                      {product.category && (
                        <span className="text-xs text-gray-500">
                          📁 {typeof product.category === 'object' ? safeString(product.category.name) : safeString(product.category)}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        📦 UOM: {getUOMDisplay(product)}
                      </span>
                    </div>
                  </div>
                  <div className="text-indigo-700 font-bold text-sm ml-3">
                    {formatCurrency(typeof product.retailRate === 'number' ? product.retailRate : 0)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {showResults && searchResults.length === 0 && searchTerm.trim().length > 1 && !selectedProduct && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500 text-sm">
            No products found matching "{safeString(searchTerm)}"
          </div>
        )}
      </div>
      
      {/* Selected Product Section */}
      {selectedProduct && selectedProduct.name && (
        <div 
          ref={selectedProductRef}
          className="mt-4 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-300 shadow-md"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-indigo-700 font-semibold uppercase tracking-wide">✓ Selected Product</div>
              <div className="font-bold text-gray-900 text-base mt-1">
                {safeString(selectedProduct.name)}
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-gray-600 hover:text-red-700 text-sm px-3 py-1.5 rounded-lg hover:bg-white/70 transition-colors font-medium"
            >
              ✕ Change
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
            <div className="bg-white rounded-lg p-2 shadow-sm">
              <div className="text-xs text-gray-600">💰 Price</div>
              <div className="font-bold text-indigo-700 text-lg">
                {formatCurrency(typeof selectedProduct.retailRate === 'number' ? selectedProduct.retailRate : 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm">
              <div className="text-xs text-gray-600">📦 Available Stock</div>
              <div className={`font-bold text-lg ${selectedProduct.stock <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                {selectedProduct.stock !== undefined && selectedProduct.stock !== null ? selectedProduct.stock : '∞'} {getUOMDisplay(selectedProduct)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-2 shadow-sm">
              <div className="text-xs text-gray-600">📏 Unit of Measure</div>
              <div className="font-bold text-gray-800 text-lg">{getUOMDisplay(selectedProduct)}</div>
            </div>
          </div>
          
          {/* Quantity Input Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">
              Enter Quantity ({getUOMDisplay(selectedProduct)}) <span className="text-indigo-600 text-xs font-normal">(Press Enter to add)</span>
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  ref={qtyInputRef}
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  onKeyDown={handleQuantityKeyDown}
                  className="w-full p-3 border-2 border-indigo-400 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none text-lg font-semibold text-gray-900 bg-white"
                  placeholder={`Enter quantity in ${getUOMDisplay(selectedProduct)}`}
                />
              </div>
              <button
                onClick={handleAdd}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Add to Cart +
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard shortcuts help */}
      {!selectedProduct && searchResults.length > 0 && showResults && (
        <div className="mt-3 p-2 bg-indigo-50 rounded-lg text-center border border-indigo-200">
          <div className="text-xs text-indigo-700">
            <span className="inline-flex items-center mr-3">
              <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm text-gray-700 mr-1">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm text-gray-700">↓</kbd>
              <span className="ml-1 text-gray-700">Navigate</span>
            </span>
            <span className="inline-flex items-center">
              <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm text-gray-700 mr-1">↵</kbd>
              <span className="text-gray-700">Select highlighted product</span>
            </span>
          </div>
        </div>
      )}
      
      {/* Initial help text */}
      {!selectedProduct && searchResults.length === 0 && !showResults && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-center border border-gray-200">
          <div className="text-xs text-gray-600">
            <span>🔍 Start typing to search for products</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Cart Items Grid Component with Direct Quantity Input ---
const CartGrid = ({ items, onUpdateQuantity, onRemoveItem, onEditPrice }) => {
  const [editingQtyId, setEditingQtyId] = useState(null);
  const [editingQtyValue, setEditingQtyValue] = useState("");
  const qtyInputRef = useRef(null);

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-3 opacity-50">🛒</div>
        <p className="text-gray-500 text-sm">No items added yet</p>
        <p className="text-gray-400 text-xs mt-1">Search and add products above</p>
        <p className="text-gray-400 text-xs mt-1">Use ↑ ↓ arrows to navigate, Enter to select product</p>
      </div>
    );
  }

  const safeString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return '';
    return String(value);
  };

  const formatQty = (qty) => {
    if (typeof qty === 'number') return formatQuantityDisplay(qty);
    if (typeof qty === 'string') return formatQuantityDisplay(parseFloat(qty) || 0);
    return '0';
  };

  const startEditQty = (item) => {
    setEditingQtyId(item.product);
    setEditingQtyValue(item.qty.toString());
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus();
        qtyInputRef.current.select();
      }
    }, 50);
  };

  const saveQtyEdit = (productId) => {
    const newQty = parseFloat(editingQtyValue);
    if (!isNaN(newQty) && newQty > 0) {
      onUpdateQuantity(productId, newQty);
    }
    setEditingQtyId(null);
    setEditingQtyValue("");
  };

  const handleQtyKeyDown = (e, productId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveQtyEdit(productId);
    } else if (e.key === 'Escape') {
      setEditingQtyId(null);
      setEditingQtyValue("");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
              <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-44">Quantity & UOM</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Price</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Total</th>
              <th className="text-center p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              if (!item || !item.product) return null;
              
              const productId = typeof item.product === 'object' ? item.product._id : item.product;
              const productName = safeString(item.name);
              const itemUOM = safeString(item.uom || 'NOS');
              const itemPrice = typeof item.price === 'number' ? item.price : 0;
              const itemQty = typeof item.qty === 'number' ? item.qty : (parseFloat(item.qty) || 0);
              const itemTotal = typeof item.total === 'number' ? item.total : (itemQty * itemPrice);
              const isEditing = editingQtyId === productId;
              
              return (
                <tr key={productId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-gray-900 text-sm">{productName}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(productId, itemQty - 1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                        >
                          -
                        </button>
                        
                        {isEditing ? (
                          <input
                            ref={qtyInputRef}
                            type="number"
                            step="0.001"
                            value={editingQtyValue}
                            onChange={(e) => setEditingQtyValue(e.target.value)}
                            onBlur={() => saveQtyEdit(productId)}
                            onKeyDown={(e) => handleQtyKeyDown(e, productId)}
                            className="w-20 text-center font-semibold text-gray-900 text-sm border-2 border-indigo-400 rounded-lg px-2 py-1 outline-none focus:border-indigo-600"
                            autoFocus
                          />
                        ) : (
                          <span 
                            onClick={() => startEditQty(item)}
                            className="w-20 text-center font-semibold text-gray-900 text-sm cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
                            title="Click to edit quantity"
                          >
                            {formatQty(itemQty)}
                          </span>
                        )}
                        
                        <button
                          onClick={() => onUpdateQuantity(productId, itemQty + 1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">{itemUOM}</span>
                      <span className="text-[10px] text-gray-400">Click qty to edit</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onEditPrice(item)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline flex items-center justify-end gap-1 w-full"
                    >
                      {formatCurrency(itemPrice)}
                      <span className="text-indigo-400 text-xs">✎</span>
                    </button>
                  </td>
                  <td className="p-4 text-right font-bold text-gray-900 text-sm">
                    {formatCurrency(itemTotal)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onRemoveItem(productId)}
                      className="text-gray-400 hover:text-red-600 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main RetailPos Component ---
const RetailPos = () => {
  const { id: billId } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [billNumber, setBillNumber] = useState("");

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [activePaymentMethod, setActivePaymentMethod] = useState(null);

  const companyId = localStorage.getItem("companyId");

  // Price editing states
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [selectedEditItem, setSelectedEditItem] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState("");

  // Bill date state
  const [billDate, setBillDate] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const dateInputRef = useRef(null);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Customer related states
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  // Credit payment related states
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [dueAmount, setDueAmount] = useState(0);
  const [creditType, setCreditType] = useState("full");

  const mainContainerRef = useRef(null);

  // ─── KEYBOARD FOCUS REFS ──────────────────────────────────────────────────
  const customerSearchRef = useRef(null);
  const creditCashInputRef = useRef(null);
  const creditConfirmBtnRef = useRef(null);

  const isRegisteredCustomer = useMemo(() => {
    return selectedCustomer !== null && selectedCustomer._id;
  }, [selectedCustomer]);

  // Helper function to get UOM from populated object or string
  const getUOMDisplay = useCallback((product) => {
    if (!product) return 'NOS';
    return extractUOMName(product.uom);
  }, []);

  // Fetch product details from product model
  const fetchProductDetails = useCallback(async (productId) => {
    if (!productId) return null;
    try {
      const response = await axios.get(`${API}/products/${productId}`, {
        params: { companyId: companyId }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
  }, [companyId]);

  const totalItemCount = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    const sum = cart.reduce((sum, i) => {
      const qty = typeof i.qty === 'number' ? i.qty : parseFloat(i.qty) || 0;
      return sum + qty;
    }, 0);
    return parseFloat(sum.toFixed(3));
  }, [cart]);

  const subtotal = useMemo(() => {
    if (!cart || cart.length === 0) return 0;
    const sum = cart.reduce((sum, i) => sum + (i.total || 0), 0);
    return roundToTwoDecimals(sum);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const amount = subtotal * (discount / 100);
    return roundToTwoDecimals(amount);
  }, [subtotal, discount]);

  const total = useMemo(() => {
    const finalTotal = subtotal - discountAmount;
    return roundToTwoDecimals(finalTotal);
  }, [subtotal, discountAmount]);

  const removeItem = useCallback((id) => {
    setCart(prev => {
      if (!prev || !Array.isArray(prev)) return [];
      return prev.filter(i => i && i.product !== id);
    });
  }, []);

  const updateQty = useCallback((id, newQty) => {
    const roundedQty = Math.round(newQty * 1000) / 1000;

    if (roundedQty <= 0) {
      return removeItem(id);
    }

    setCart(prev => {
      if (!prev || !Array.isArray(prev)) return [];
      return prev.map(item => {
        if (item && item.product === id) {
          const newTotal = roundToTwoDecimals(roundedQty * (item.price || 0));
          return { ...item, qty: roundedQty, total: newTotal };
        }
        return item;
      });
    });
  }, [removeItem]);

  const handleAddToCart = useCallback(async (product, quantity) => {
    if (!product || !product._id) {
      console.error("Invalid product object:", product);
      alert("Invalid product selected");
      return;
    }
    
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    
    // Fetch fresh product details
    const freshProduct = await fetchProductDetails(product._id);
    const productName = freshProduct?.name || product.name || 'Product';
    const price = roundToTwoDecimals(product.retailRate || 0);
    const uom = getUOMDisplay(freshProduct || product);
    const productId = product._id;
    
    setCart(prev => {
      const currentCart = Array.isArray(prev) ? prev : [];
      const existingIndex = currentCart.findIndex(i => i && i.product === productId);
      
      if (existingIndex !== -1) {
        const existing = currentCart[existingIndex];
        const newQty = roundToTwoDecimals((existing.qty || 0) + quantity);
        
        if (product.stock !== undefined && newQty > product.stock) {
          alert(`Cannot exceed stock limit of ${product.stock} ${uom}`);
          return currentCart;
        }
        
        const newTotal = roundToTwoDecimals(newQty * price);
        const updatedCart = [...currentCart];
        updatedCart[existingIndex] = {
          ...existing,
          qty: newQty,
          total: newTotal,
          uom: uom,
          price: price,
          name: productName
        };
        return updatedCart;
      } else {
        const newItem = {
          product: productId,
          name: productName,
          price: price,
          qty: quantity,
          total: roundToTwoDecimals(price * quantity),
          uom: uom
        };
        return [...currentCart, newItem];
      }
    });
  }, [fetchProductDetails, getUOMDisplay]);

  // Load bill for edit - fetch fresh product names
  useEffect(() => {
    const loadBillForEdit = async () => {
      if (billId) {
        setIsEditMode(true);
        try {
          const response = await axios.get(`${API}/bills/${billId}`, {
            params: { companyId: companyId }
          });
          const bill = response.data;
          
          console.log("Loaded bill for edit:", bill);
          
          setBillNumber(bill.billNumber || bill.id || "N/A");
          setDiscount(bill.discount || 0);

          if (bill.billDate) {
            const billDateObj = new Date(bill.billDate);
            setBillDate(formatForInput(billDateObj));
            setCurrentDateTime(formatDateTime(billDateObj));
          }

          if (bill.customerId) {
            setSelectedCustomer({
              _id: bill.customerId,
              name: bill.customerName || "Customer",
              phone: bill.customerPhone || "",
              email: bill.customerEmail || "",
              address: bill.customerAddress || ""
            });
          }

          // Fetch fresh product names for each item from product model
          const cartItemsWithFreshNames = [];
          
          for (const item of (bill.items || [])) {
            try {
              const freshProduct = await fetchProductDetails(item.productId);
              
              if (freshProduct) {
                cartItemsWithFreshNames.push({
                  product: item.productId,
                  name: freshProduct.name || "Product",
                  price: roundToTwoDecimals(item.price || 0),
                  qty: item.quantity || 0,
                  total: roundToTwoDecimals((item.quantity || 0) * (item.price || 0)),
                  uom: extractUOMName(freshProduct.uom)
                });
                console.log(`Fetched fresh name for ${item.productId}: ${freshProduct.name}`);
              } else {
                // Fallback to stored name
                cartItemsWithFreshNames.push({
                  product: item.productId,
                  name: item.productName || item.name || "Product",
                  price: roundToTwoDecimals(item.price || 0),
                  qty: item.quantity || 0,
                  total: roundToTwoDecimals((item.quantity || 0) * (item.price || 0)),
                  uom: extractUOMName(item.uom)
                });
              }
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
              cartItemsWithFreshNames.push({
                product: item.productId,
                name: item.productName || item.name || "Product",
                price: roundToTwoDecimals(item.price || 0),
                qty: item.quantity || 0,
                total: roundToTwoDecimals((item.quantity || 0) * (item.price || 0)),
                uom: extractUOMName(item.uom)
              });
            }
          }
          
          console.log("Cart items with fresh names:", cartItemsWithFreshNames);
          setCart(cartItemsWithFreshNames);
          
        } catch (error) {
          console.error("Error loading bill:", error);
          alert("Failed to load bill for editing");
          navigate('/reports');
        }
      }
    };

    if (companyId && billId) {
      loadBillForEdit();
    }
  }, [billId, navigate, companyId, fetchProductDetails]);

  // Define processCheckout
  const processCheckout = useCallback(async (paymentData) => {
    if (!cart || cart.length === 0) {
      alert("Cart is empty!");
      return false;
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        companyId: companyId,
        items: cart.map(i => ({
          productId: i.product,
          productName: i.name,
          quantity: i.qty,
          price: roundToTwoDecimals(i.price),
          uom: i.uom || 'NOS'
        })),
        discount: roundToTwoDecimals(discount),
        discountAmount: roundToTwoDecimals(discountAmount),
        paymentMethod: paymentData.paymentMethod,
        paidAmount: paymentData.paidAmount,
        dueAmount: paymentData.dueAmount,
        cashPaid: paymentData.cashPaid,
        upiPaid: paymentData.upiPaid,
        FinalBillValue: total,
        customerId: selectedCustomer?._id || null,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        customerPhone: selectedCustomer?.phone || "",
        customerEmail: selectedCustomer?.email || "",
        customerAddress: selectedCustomer?.address || "",
        timestamp: new Date().toISOString(),
        billDate: new Date(billDate).toISOString()
      };

      let res;
      if (isEditMode && billId) {
        res = await axios.put(`${API}/bills/${billId}`, payload, {
          params: { companyId: companyId }
        });
      } else {
        res = await axios.post(`${API}/bills`, payload);
      }

      if (res.data.success) {
        const savedBill = res.data.bill || res.data.data || {};
        const savedBillId = savedBill._id || savedBill.id;

        if (savedBillId) {
          console.log("Printing bill with ID:", savedBillId);
          handlePrintBill(savedBillId, () => {
            setTimeout(() => {
              const searchInput = document.querySelector('input[placeholder*="Search by product"]');
              if (searchInput) searchInput.focus();
            }, 50);
          });
        } else {
          console.warn("No bill ID returned from server, cannot print");
        }

        let message = isEditMode ? `Bill Updated Successfully!\n` : `Transaction Successful!\n`;
        if (isEditMode) {
          message += `Bill #${billNumber}\n`;
        }
        message += `Bill Date: ${formatDateTime(billDate)}\n`;
        message += `Payment Method: ${paymentData.paymentMethod.toUpperCase()}\n`;
        message += `Total: ${formatCurrency(total)}\n`;
        message += `Customer: ${selectedCustomer?.name || "Walk-in Customer"}`;
        alert(message);

        if (!isEditMode) {
          setCart([]);
          setDiscount(0);
          setSelectedCustomer(null);
          const now = new Date();
          setBillDate(formatForInput(now));
          setCurrentDateTime(formatDateTime(now));
        }

        fetchProducts();

        if (isEditMode) {
          navigate('/reports');
        }
        return true;
      }
    } catch (err) {
      alert(isEditMode ? "Update failed. Please try again." : "Checkout failed. Please try again.");
      console.error("Checkout error:", err);
      return false;
    } finally {
      setCheckoutLoading(false);
    }
  }, [cart, discountAmount, total, selectedCustomer, billDate, isEditMode, billId, navigate, billNumber, companyId, discount]);

  // Payment handlers
  const handleCashPayment = useCallback(async () => {
    if (!cart || cart.length === 0) {
      alert("Cart is empty! Please add items to continue.");
      return;
    }
    
    setActivePaymentMethod('cash');
    setCheckoutLoading(true);
    try {
      await processCheckout({
        paymentMethod: 'cash',
        paidAmount: total,
        dueAmount: 0,
        cashPaid: total,
        upiPaid: 0
      });
    } finally {
      setCheckoutLoading(false);
      setActivePaymentMethod(null);
    }
  }, [cart, total, processCheckout]);

  const handleUPIPayment = useCallback(async () => {
    if (!cart || cart.length === 0) {
      alert("Cart is empty! Please add items to continue.");
      return;
    }
    
    setActivePaymentMethod('upi');
    setCheckoutLoading(true);
    try {
      await processCheckout({
        paymentMethod: 'upi',
        paidAmount: total,
        dueAmount: 0,
        cashPaid: 0,
        upiPaid: total
      });
    } finally {
      setCheckoutLoading(false);
      setActivePaymentMethod(null);
    }
  }, [cart, total, processCheckout]);

  const handleFullCredit = useCallback(() => {
    setCreditType("full");
    setCashAmount("");
    setUpiAmount("");
    setDueAmount(total);
    setShowCreditModal(true);
  }, [total]);

  const handleSplitCredit = useCallback(() => {
    setCreditType("split");
    setCashAmount("");
    setUpiAmount("");
    setDueAmount(total);
    setShowCreditModal(true);
  }, [total]);

  const handleCreditConfirm = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      if (creditType === "full") {
        await processCheckout({
          paymentMethod: 'credit',
          paidAmount: 0,
          dueAmount: total,
          cashPaid: 0,
          upiPaid: 0
        });
      } else {
        const cashPaid = cashAmount === '' ? 0 : roundToTwoDecimals(parseFloat(cashAmount));
        const upiPaid = upiAmount === '' ? 0 : roundToTwoDecimals(parseFloat(upiAmount));
        const totalPaid = roundToTwoDecimals(cashPaid + upiPaid);

        if (totalPaid > total) {
          alert("Total paid amount cannot exceed total amount!");
          return;
        }

        if (totalPaid === 0) {
          alert("Please enter at least one payment amount or choose Full Credit option!");
          return;
        }

        const newDueAmount = roundToTwoDecimals(total - totalPaid);
        
        await processCheckout({
          paymentMethod: 'credit',
          paidAmount: totalPaid,
          dueAmount: newDueAmount,
          cashPaid: cashPaid,
          upiPaid: upiPaid
        });
      }
      setShowCreditModal(false);
      setCashAmount("");
      setUpiAmount("");
    } finally {
      setCheckoutLoading(false);
      setActivePaymentMethod(null);
    }
  }, [creditType, cashAmount, upiAmount, total, processCheckout]);

  const handleCreditPayment = useCallback(() => {
    if (!cart || cart.length === 0) {
      alert("Cart is empty! Please add items to continue.");
      return;
    }
    
    if (!isRegisteredCustomer) {
      alert("Credit option is only available for registered customers. Please add a customer first.");
      return;
    }
    
    if (total <= 0) {
      alert("Bill amount is zero!");
      return;
    }
    
    setActivePaymentMethod('credit');
    const creditOption = window.confirm("Choose Credit Option:\n\nOK: Full Credit (No payment now)\nCancel: Split Payment (Partial payment)");
    if (creditOption) {
      handleFullCredit();
    } else {
      handleSplitCredit();
    }
  }, [cart, total, isRegisteredCustomer, handleFullCredit, handleSplitCredit]);

  const handleCashAmountChange = useCallback((e) => {
    const value = e.target.value;
    const cashVal = value === '' ? 0 : parseFloat(value);
    const upiVal = upiAmount === '' ? 0 : parseFloat(upiAmount);
    const totalPaid = roundToTwoDecimals((cashVal || 0) + (upiVal || 0));

    if (totalPaid > total) {
      alert(`Total paid cannot exceed ${formatCurrency(total)}`);
      return;
    }

    setCashAmount(value);
    const remainingDue = roundToTwoDecimals(total - totalPaid);
    setDueAmount(remainingDue);
  }, [upiAmount, total]);

  const handleUpiAmountChange = useCallback((e) => {
    const value = e.target.value;
    const upiVal = value === '' ? 0 : parseFloat(value);
    const cashVal = cashAmount === '' ? 0 : parseFloat(cashAmount);
    const totalPaid = roundToTwoDecimals((cashVal || 0) + (upiVal || 0));

    if (totalPaid > total) {
      alert(`Total paid cannot exceed ${formatCurrency(total)}`);
      return;
    }

    setUpiAmount(value);
    const remainingDue = roundToTwoDecimals(total - totalPaid);
    setDueAmount(remainingDue);
  }, [cashAmount, total]);

  const incrementDiscount = useCallback(() => {
    setDiscount(prev => Math.min(100, prev + 5));
  }, []);

  const decrementDiscount = useCallback(() => {
    setDiscount(prev => Math.max(0, prev - 1));
  }, []);

  const handleDiscountChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '') {
      setDiscount(0);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setDiscount(Math.min(100, Math.max(0, numValue)));
      }
    }
  }, []);

  // Fetch functions
  const fetchCustomers = useCallback(async () => {
    if (!companyId) return;
    setCustomerLoading(true);
    try {
      const res = await axios.get(`${API}/customers?companyId=${companyId}`, { timeout: 8000 });
      setCustomers(res.data);
    } catch (error) {
      console.error("Fetch customers error:", error);
    } finally {
      setCustomerLoading(false);
    }
  }, [companyId]);

  const fetchProducts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products?companyId=${companyId}`, { timeout: 8000 });
      const activeProducts = res.data.filter(product => product.isActive === true);
      setProducts(activeProducts);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to fetch products. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Effects
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const now = new Date();
    setBillDate(formatForInput(now));
    setCurrentDateTime(formatDateTime(now));
  }, []);

  useEffect(() => {
    if (billDate) {
      setCurrentDateTime(formatDateTime(billDate));
    }
  }, [billDate]);

  useEffect(() => {
    if (!companyId) {
      alert("No company associated. Please login again.");
      navigate('/login');
      return;
    }
    fetchProducts();
    fetchCustomers();
  }, [companyId, fetchProducts, fetchCustomers, navigate]);

  // Focus effects
  useEffect(() => {
    if (showCustomerModal) {
      setTimeout(() => {
        customerSearchRef.current?.focus();
      }, 50);
    }
  }, [showCustomerModal]);

  useEffect(() => {
    if (showCreditModal) {
      setTimeout(() => {
        if (creditType === 'split') {
          creditCashInputRef.current?.focus();
        } else {
          creditConfirmBtnRef.current?.focus();
        }
      }, 50);
    }
  }, [showCreditModal, creditType]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if (e.key === 'Escape') {
        if (showEditPriceModal) {
          setShowEditPriceModal(false);
          setSelectedEditItem(null);
          setEditPriceValue("");
          return;
        }
        if (showCreditModal) {
          setShowCreditModal(false);
          setActivePaymentMethod(null);
          return;
        }
        if (showCustomerModal) {
          setShowCustomerModal(false);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCashPayment();
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        handleUPIPayment();
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'r' && isRegisteredCustomer) {
        e.preventDefault();
        handleCreditPayment();
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCustomerModal(true);
      }
      else if (e.key === 'F1') {
        e.preventDefault();
        alert("Keyboard Shortcuts:\n\n" +
          "Ctrl/Cmd + C: Cash Payment\n" +
          "Ctrl/Cmd + U: UPI Payment\n" +
          "Ctrl/Cmd + R: Credit Payment (registered customers only)\n" +
          "Ctrl/Cmd + K: Open Customer Selection\n" +
          "Escape: Close any open modal\n" +
          "F1: Show this help");
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [isRegisteredCustomer, handleCashPayment, handleUPIPayment, handleCreditPayment,
      showEditPriceModal, showCreditModal, showCustomerModal]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setBillDate(newDate);
    if (newDate) {
      setCurrentDateTime(formatDateTime(newDate));
    }
  };

  const handleEditDateClick = () => {
    setIsEditingDate(true);
    setTimeout(() => {
      if (dateInputRef.current) {
        if (dateInputRef.current.showPicker) {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
        }
      }
    }, 100);
  };

  const handleDateBlur = () => {
    setIsEditingDate(false);
  };

  const handleEditPrice = useCallback((item) => {
    if (!item) return;
    setSelectedEditItem(item);
    setEditPriceValue(item.price ? item.price.toString() : "0");
    setShowEditPriceModal(true);
  }, []);

  const handleUpdatePrice = useCallback(() => {
    if (!selectedEditItem) return;

    const newPrice = roundToTwoDecimals(parseFloat(editPriceValue));
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setCart(prevCart => prevCart.map(item => {
      if (item.product === selectedEditItem.product) {
        const newTotal = roundToTwoDecimals(item.qty * newPrice);
        return {
          ...item,
          price: newPrice,
          total: newTotal
        };
      }
      return item;
    }));

    setShowEditPriceModal(false);
    setSelectedEditItem(null);
    setEditPriceValue("");
  }, [selectedEditItem, editPriceValue]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.phone && customer.phone.includes(customerSearch)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  }, [customers, customerSearch]);

  useEffect(() => {
    if (showCustomerModal && filteredCustomers.length > 0) {
      setSelectedCustomerIndex(0);
    } else {
      setSelectedCustomerIndex(-1);
    }
  }, [customerSearch, filteredCustomers, showCustomerModal]);

  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearch("");
    setActivePaymentMethod(null);
    setSelectedCustomerIndex(-1);
  }, []);

  const handleRemoveCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setActivePaymentMethod(null);
  }, []);

  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomer.name.trim()) {
      alert("Please enter customer name");
      return;
    }

    if (!companyId) {
      alert("No company associated");
      return;
    }

    try {
      const res = await axios.post(`${API}/customers`, {
        companyId: companyId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address
      });
      if (res.data.success || res.data._id) {
        const createdCustomer = res.data;
        setCustomers(prev => [...prev, createdCustomer]);
        setSelectedCustomer(createdCustomer);
        setNewCustomer({ name: "", phone: "", email: "", address: "" });
        setShowCustomerModal(false);
        alert("Customer added successfully!");
        setActivePaymentMethod(null);
      }
    } catch (error) {
      console.error("Create customer error:", error);
      alert("Failed to create customer. Please try again.");
    }
  }, [newCustomer, companyId]);

  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Company Associated</h2>
          <p className="text-gray-500 mb-6">Please login again to access the POS system.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mainContainerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              RETAIL POS
            </h1>
            {isEditMode && (
              <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                Editing Bill #{billNumber}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Bill Date */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200">
              {isEditingDate ? (
                <input
                  ref={dateInputRef}
                  type="datetime-local"
                  value={billDate}
                  onChange={handleDateChange}
                  onBlur={handleDateBlur}
                  className="text-xs text-gray-700 font-mono border border-gray-300 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none"
                  autoFocus
                />
              ) : (
                <div
                  className="text-xs text-gray-600 font-mono cursor-pointer hover:text-indigo-600 flex items-center gap-1"
                  onClick={handleEditDateClick}
                >
                  📅 {currentDateTime || formatDateTime(new Date())}
                  <span className="text-indigo-500 text-xs">✎</span>
                </div>
              )}
            </div>
            
            {/* Customer Button with Shortcut */}
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 transition-colors"
              title="Ctrl+K to open"
            >
              👤 {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
              <span className="text-indigo-500 text-xs">(Ctrl+K)</span>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Bar */}
        <div className="mb-4 p-2 bg-gray-100 rounded-lg flex flex-wrap justify-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">C</kbd>
            <span>CASH</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">U</kbd>
            <span>UPI</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">K</kbd>
            <span>Customer</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">Esc</kbd>
            <span>Close modal</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">F1</kbd>
            <span>Help</span>
          </span>
          {isRegisteredCustomer && (
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono shadow-sm">R</kbd>
              <span>CREDIT</span>
            </span>
          )}
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Search & Add */}
          <div className="lg:col-span-1">
            <ProductSearchInput 
              products={products}
              onAddToCart={handleAddToCart}
              isLoading={loading}
            />
          </div>

          {/* Right Column - Cart Items Grid & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items Grid */}
            <CartGrid 
              items={cart}
              onUpdateQuantity={updateQty}
              onRemoveItem={removeItem}
              onEditPrice={handleEditPrice}
            />

            {/* Bill Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Bill Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold text-gray-900">{formatQuantityDisplay(totalItemCount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                
                {/* Discount Section */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600">Discount</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={decrementDiscount}
                      disabled={discount <= 0}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold"
                    >
                      -
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-20 p-1.5 text-center border border-gray-300 rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-indigo-500"
                        value={discount}
                        onChange={handleDiscountChange}
                        step="1"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                    </div>
                    <button
                      onClick={incrementDiscount}
                      disabled={discount >= 100}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount Amount</span>
                  <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-indigo-700 text-xl">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Action Buttons - Direct Checkout */}
              <div className="mt-5 pt-3 border-t border-gray-200">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-3">Complete Sale</span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleCashPayment}
                    disabled={checkoutLoading || !cart || cart.length === 0}
                    className={`py-3 px-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
                      activePaymentMethod === 'cash' 
                        ? 'bg-emerald-700 ring-2 ring-emerald-300' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    {activePaymentMethod === 'cash' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "💵"
                    )}
                    CASH
                    <span className="text-xs opacity-80">(Ctrl+C)</span>
                  </button>
                  
                  <button
                    onClick={handleUPIPayment}
                    disabled={checkoutLoading || !cart || cart.length === 0}
                    className={`py-3 px-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
                      activePaymentMethod === 'upi' 
                        ? 'bg-blue-700 ring-2 ring-blue-300' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    {activePaymentMethod === 'upi' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "📱"
                    )}
                    UPI
                    <span className="text-xs opacity-80">(Ctrl+U)</span>
                  </button>
                  
                  <button
                    onClick={handleCreditPayment}
                    disabled={checkoutLoading || !cart || cart.length === 0 || (!isRegisteredCustomer)}
                    className={`py-3 px-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
                      activePaymentMethod === 'credit' 
                        ? 'bg-amber-700 ring-2 ring-amber-300' 
                        : 'bg-amber-600 hover:bg-amber-700'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                    title={!isRegisteredCustomer ? "Add customer to use credit" : "Credit payment (Ctrl+R)"}
                  >
                    {activePaymentMethod === 'credit' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "📝"
                    )}
                    CREDIT
                    {isRegisteredCustomer && <span className="text-xs opacity-80">(Ctrl+R)</span>}
                  </button>
                </div>
                {!isRegisteredCustomer && (
                  <p className="text-xs text-amber-600 mt-2 text-center">
                    ⚠️ Add a customer to enable Credit payment
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Select Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b">
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  ref={customerSearchRef}
                  type="text"
                  placeholder="Search by name, phone or email... (↑ ↓ to navigate, Enter to select)"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm text-gray-900"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    if (filteredCustomers.length > 0) {
                      setSelectedCustomerIndex(0);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (filteredCustomers.length === 0) return;
                    
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedCustomerIndex(prev => 
                        prev < filteredCustomers.length - 1 ? prev + 1 : prev
                      );
                    } 
                    else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedCustomerIndex(prev => prev > 0 ? prev - 1 : prev);
                    }
                    else if (e.key === 'Enter' && selectedCustomerIndex >= 0) {
                      e.preventDefault();
                      handleSelectCustomer(filteredCustomers[selectedCustomerIndex]);
                    }
                    else if (e.key === 'Enter' && filteredCustomers.length === 1) {
                      e.preventDefault();
                      handleSelectCustomer(filteredCustomers[0]);
                    }
                  }}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  name="customer-search-field"
                />
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {customerLoading ? (
                <div className="text-center py-8 text-gray-500">Loading customers...</div>
              ) : filteredCustomers.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {filteredCustomers.map((customer, idx) => (
                      <button
                        key={customer._id}
                        onClick={() => handleSelectCustomer(customer)}
                        onMouseEnter={() => setSelectedCustomerIndex(idx)}
                        className={`w-full text-left p-3 border rounded-xl transition-all ${
                          idx === selectedCustomerIndex
                            ? 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-200' 
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-900">{customer.name}</div>
                        {customer.phone && <div className="text-xs text-gray-600 mt-1">📞 {customer.phone}</div>}
                        {customer.email && <div className="text-xs text-gray-600">✉️ {customer.email}</div>}
                      </button>
                    ))}
                  </div>
                  {customerSearch && filteredCustomers.length > 0 && (
                    <div className="mt-3 text-center text-xs text-indigo-600">
                      Use ↑ ↓ arrows to navigate, Enter to select
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-6">No customers found</p>
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-4">Add New Customer</h4>
                    <input
                      type="text"
                      placeholder="Name *"
                      className="w-full p-2.5 border border-gray-300 rounded-xl mb-3 text-sm text-gray-900"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      className="w-full p-2.5 border border-gray-300 rounded-xl mb-3 text-sm text-gray-900"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full p-2.5 border border-gray-300 rounded-xl mb-3 text-sm text-gray-900"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <textarea
                      placeholder="Address"
                      className="w-full p-2.5 border border-gray-300 rounded-xl mb-3 text-sm text-gray-900"
                      rows="2"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <button
                      onClick={handleCreateCustomer}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
                    >
                      Create Customer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credit Payment Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">
                {creditType === "full" ? "Full Credit Payment" : "Split Credit Payment"}
              </h3>
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setActivePaymentMethod(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-indigo-700">{formatCurrency(total)}</div>
              </div>

              {creditType === "split" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cash Amount Paid 💵
                    </label>
                    <input
                      ref={creditCashInputRef}
                      type="number"
                      placeholder="Enter cash amount"
                      className="w-full p-2.5 border border-gray-300 rounded-xl focus:border-indigo-500 outline-none text-sm text-gray-900"
                      value={cashAmount}
                      onChange={handleCashAmountChange}
                      step="0.01"
                      min="0"
                      max={total}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      UPI Amount Paid 📱
                    </label>
                    <input
                      type="number"
                      placeholder="Enter UPI amount"
                      className="w-full p-2.5 border border-gray-300 rounded-xl focus:border-indigo-500 outline-none text-sm text-gray-900"
                      value={upiAmount}
                      onChange={handleUpiAmountChange}
                      step="0.01"
                      min="0"
                      max={total}
                    />
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-xl">
                    <div className="text-sm text-gray-600">Total Paid</div>
                    <div className="text-xl font-bold text-emerald-700">
                      {formatCurrency((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-600">Credit Amount</div>
                  <div className="text-2xl font-bold text-amber-700">{formatCurrency(total)}</div>
                  <div className="text-xs text-gray-500 mt-2">Full credit - No payment required now</div>
                </div>
              )}

              <div className="bg-amber-50 p-4 rounded-xl">
                <div className="text-sm text-gray-600">Due Amount</div>
                <div className="text-2xl font-bold text-amber-700">
                  {formatCurrency(creditType === "full" ? total : dueAmount)}
                </div>
              </div>

              <button
                ref={creditConfirmBtnRef}
                onClick={handleCreditConfirm}
                disabled={creditType === "split" && ((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0)) === 0}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-amber-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
              >
                {creditType === "full" ? "Confirm Full Credit" : "Confirm Split Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Edit Modal */}
      {showEditPriceModal && selectedEditItem && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowEditPriceModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">Edit Item Price</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedEditItem.name}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="text-xs text-gray-600 mb-1">Current Price</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(selectedEditItem.price)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Price (₹)
                </label>
                <input
                  type="number"
                  value={editPriceValue}
                  onChange={(e) => setEditPriceValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUpdatePrice();
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-white"
                  placeholder="Enter new price"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>

              {selectedEditItem && editPriceValue && parseFloat(editPriceValue) > 0 && (
                <div className="bg-indigo-50 p-3 rounded-xl">
                  <div className="text-xs text-indigo-700 mb-1">New Total</div>
                  <div className="text-xl font-bold text-indigo-800">
                    {formatCurrency(roundToTwoDecimals(selectedEditItem.qty * parseFloat(editPriceValue)))}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Qty: {formatQuantityDisplay(selectedEditItem.qty)} {selectedEditItem.uom || 'NOS'} × New Price: {formatCurrency(roundToTwoDecimals(parseFloat(editPriceValue)))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex gap-3">
              <button
                onClick={() => setShowEditPriceModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePrice}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
              >
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailPos;