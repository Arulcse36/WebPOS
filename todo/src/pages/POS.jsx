import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import useDebounce from '../hooks/useDebounce';
import { formatDateTime, formatForInput, formatCurrency, formatQuantityDisplay } from '../utils/formatters';
import { roundToTwoDecimals } from '../utils/mathHelpers';
import { getSafeString } from '../utils/productHelpers';
import { handlePrintBill } from '../utils/printBill';

const API = `${import.meta.env.VITE_API_URL}`;

// --- Sub-Components ---
const ProductCard = React.memo(({ product, onAdd, onUpdateQty, cartQuantity }) => {
  const [showQtyModal, setShowQtyModal] = useState(false);
  const qty = cartQuantity || 0;
  const isOutOfStock = product.stock <= 0;
  const categoryName = getSafeString(product.category);
  const brandName = getSafeString(product.brand);
  const price = roundToTwoDecimals(product.retailRate);

  const stock = product.stock !== undefined ? product.stock : Infinity;
  const quantityOptions = [0.05, 0.10, 0.15, 0.20, 0.25, 0.50, 0.75];

  const handleQuantitySelect = (selectedQty) => {
    if (selectedQty <= stock) {
      onUpdateQty(product._id, selectedQty, stock);
    } else {
      alert(`Cannot add more than ${stock} units of this product`);
    }
    setShowQtyModal(false);
  };

  const handleIncrement = () => {
    const newQty = Math.round((qty + 1) * 1000) / 1000;
    if (newQty <= stock) {
      onUpdateQty(product._id, newQty, stock);
    } else {
      alert(`Cannot exceed stock limit of ${stock}`);
    }
  };

  const handleDecrement = () => {
    const newQty = Math.round((qty - 1) * 1000) / 1000;
    if (newQty < 0.05) {
      onUpdateQty(product._id, 0, stock);
    } else if (newQty >= 0) {
      onUpdateQty(product._id, newQty, stock);
    }
  };

  return (
    <>
      <div className={`p-3 rounded-lg transition-all border ${isOutOfStock ? 'bg-gray-200 opacity-60 border-transparent' : 'bg-white shadow-sm hover:shadow-md border-gray-200 hover:border-blue-400'
        }`}>
        <div className="mb-2">
          <div className="font-bold text-gray-900 text-sm leading-tight h-10 overflow-hidden">{product.name}</div>
          <div className="text-base font-black text-blue-700 mt-1">{formatCurrency(price)}</div>
          <div className={`text-xs mt-1 font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-gray-500'}`}>
            STOCK: {product.stock !== undefined ? product.stock : 'Unlimited'}
          </div>
          {categoryName && (
            <div className="text-xs text-gray-400 mt-1">📁 {categoryName}</div>
          )}
          {brandName && (
            <div className="text-xs text-gray-400">🏷️ {brandName}</div>
          )}
        </div>

        {isOutOfStock ? (
          <button disabled className="w-full bg-gray-400 text-white py-2 rounded-lg font-bold cursor-not-allowed uppercase text-xs">Out of Stock</button>
        ) : (
          <div className="flex items-center justify-between gap-2 mt-2">
            {qty > 0 ? (
              <>
                <button
                  onClick={handleDecrement}
                  className="bg-red-500 hover:bg-red-600 text-white font-black rounded-lg text-lg shadow-sm flex-shrink-0 w-8 h-8 min-w-[2rem] min-h-[2rem]"
                >
                  -
                </button>

                <div className="flex-1 text-center min-w-[70px]">
                  <button
                    onClick={() => setShowQtyModal(true)}
                    className="text-xl font-black text-black hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors w-full"
                  >
                    {formatQuantityDisplay(qty)}
                  </button>
                </div>

                <button
                  onClick={handleIncrement}
                  className="bg-green-500 hover:bg-green-600 text-white font-black rounded-lg text-lg shadow-sm flex-shrink-0 w-8 h-8 min-w-[2rem] min-h-[2rem]"
                  disabled={qty >= stock}
                >
                  +
                </button>
              </>
            ) : (
              <button
                onClick={() => onAdd(product)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold shadow-md transition-transform active:scale-95 text-xs uppercase"
              >
                ADD TO CART
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quantity Selection Modal */}
      {showQtyModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowQtyModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Select Quantity</h3>
                <p className="text-xs text-gray-500 mt-1">{product.name}</p>
              </div>
              <button
                onClick={() => setShowQtyModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4 text-center">
                <div className="text-xs text-blue-600 font-bold mb-1">CURRENT QUANTITY</div>
                <div className="text-3xl font-black text-blue-700">{formatQuantityDisplay(qty)}</div>
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Quick Select</div>
                <div className="grid grid-cols-3 gap-2">
                  {quantityOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleQuantitySelect(option)}
                      disabled={option > stock}
                      className={`
                        py-3 px-2 rounded-lg font-bold text-sm transition-all
                        ${option > stock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700'
                        }
                        ${Math.abs(option - qty) < 0.001 ? 'ring-2 ring-blue-500 bg-blue-100 text-blue-700' : ''}
                      `}
                    >
                      {option.toFixed(3)}
                      {option > stock && (
                        <span className="block text-[10px]">Out of stock</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Custom Quantity</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="customQty"
                    step="0.001"
                    min="0"
                    max={stock}
                    placeholder="Enter quantity"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      const customQty = parseFloat(document.getElementById('customQty').value);
                      if (!isNaN(customQty) && customQty > 0) {
                        if (customQty <= stock) {
                          onUpdateQty(product._id, customQty, stock);
                          setShowQtyModal(false);
                        } else {
                          alert(`Cannot add more than ${stock} units`);
                        }
                      } else if (customQty === 0) {
                        onUpdateQty(product._id, 0, stock);
                        setShowQtyModal(false);
                      } else {
                        alert('Please enter a valid quantity');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => {
                  onUpdateQty(product._id, 0, stock);
                  setShowQtyModal(false);
                }}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600 transition-colors"
              >
                Remove Item
              </button>
              <button
                onClick={() => setShowQtyModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

// --- Main POS Component ---

const POS = () => {
  const { id: billId } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [billNumber, setBillNumber] = useState("");

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

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

  // Add this state near other state declarations (around line 100-120)
  const [showSearchBox, setShowSearchBox] = useState(false);

  // Mobile UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Sidebar state for desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);

  const isRegisteredCustomer = useMemo(() => {
    return selectedCustomer !== null && selectedCustomer._id;
  }, [selectedCustomer]);

  // Initialize date/time
  useEffect(() => {
    const now = new Date();
    setBillDate(formatForInput(now));
    setCurrentDateTime(formatDateTime(now));
  }, []);

  // Update displayed date/time when billDate changes
  useEffect(() => {
    if (billDate) {
      setCurrentDateTime(formatDateTime(billDate));
    }
  }, [billDate]);

  // Load bill data if in edit mode
  useEffect(() => {
    const loadBillForEdit = async () => {
      if (billId) {
        setIsEditMode(true);
        try {
          const response = await axios.get(`${API}/bills/${billId}`);
          const bill = response.data;

          setBillNumber(bill.billNumber || bill.id || "N/A");

          const cartItems = bill.items.map(item => ({
            product: item.productId,
            name: item.name || item.productName,
            price: roundToTwoDecimals(item.price),
            qty: item.quantity,
            total: roundToTwoDecimals(item.quantity * item.price)
          }));

          setCart(cartItems);
          setDiscount(bill.discount || 0);
          setPaymentMethod(bill.paymentMethod || "cash");

          if (bill.billDate) {
            const billDateObj = new Date(bill.billDate);
            setBillDate(formatForInput(billDateObj));
            setCurrentDateTime(formatDateTime(billDateObj));
          } else {
            const now = new Date();
            setBillDate(formatForInput(now));
            setCurrentDateTime(formatDateTime(now));
          }

          if (bill.customerId) {
            setSelectedCustomer({
              _id: bill.customerId,
              name: bill.customerName || "Customer",
              phone: bill.customerPhone,
              email: bill.customerEmail,
              address: bill.customerAddress
            });
          }
        } catch (error) {
          console.error("Error loading bill:", error);
          alert("Failed to load bill for editing");
          navigate('/reports');
        }
      }
    };

    loadBillForEdit();
  }, [billId, navigate]);

  // Reset date when cart opens for new bill
  useEffect(() => {
    if (isCartOpen && !isEditMode && !billId) {
      const now = new Date();
      setBillDate(formatForInput(now));
      setCurrentDateTime(formatDateTime(now));
    }
  }, [isCartOpen, isEditMode, billId]);

  // Add this function to toggle search box visibility
  const toggleSearchBox = useCallback(() => {
    setShowSearchBox(prev => !prev);
  }, []);

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

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  // Price editing handlers
  const handleEditPrice = useCallback((item) => {
    setSelectedEditItem(item);
    setEditPriceValue(item.price.toString());
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

  const { categories, brands } = useMemo(() => {
    const cats = new Set();
    const brnds = new Set();
    products.forEach(product => {
      const category = getSafeString(product.category);
      if (category) cats.add(category);
      const brand = getSafeString(product.brand);
      if (brand) brnds.add(brand);
    });
    return {
      categories: Array.from(cats).sort(),
      brands: Array.from(brnds).sort()
    };
  }, [products]);

  const fetchCustomers = useCallback(async () => {
    setCustomerLoading(true);
    try {
      const res = await axios.get(`${API}/customers`, { timeout: 8000 });
      setCustomers(res.data);
    } catch (error) {
      console.error("Fetch customers error:", error);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!debouncedCustomerSearch) return customers;
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(debouncedCustomerSearch.toLowerCase()) ||
      (customer.phone && customer.phone.includes(debouncedCustomerSearch)) ||
      (customer.email && customer.email.toLowerCase().includes(debouncedCustomerSearch.toLowerCase()))
    );
  }, [customers, debouncedCustomerSearch]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products`, { timeout: 8000 });
      setProducts(res.data);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to fetch products. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    if (!isEditMode && !billId) {
      const saved = localStorage.getItem('pos_cart');
      if (saved) setCart(JSON.parse(saved));
      const savedCustomer = localStorage.getItem('pos_selected_customer');
      if (savedCustomer) setSelectedCustomer(JSON.parse(savedCustomer));
      const savedBillDate = localStorage.getItem('pos_bill_date');
      if (savedBillDate) {
        setBillDate(savedBillDate);
        setCurrentDateTime(formatDateTime(savedBillDate));
      }
    }
  }, [isEditMode, billId]);

  useEffect(() => {
    if (!isEditMode && !billId) {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
      localStorage.setItem('pos_bill_date', billDate);
      if (selectedCustomer) {
        localStorage.setItem('pos_selected_customer', JSON.stringify(selectedCustomer));
      } else {
        localStorage.removeItem('pos_selected_customer');
      }
    }
  }, [cart, selectedCustomer, billDate, isEditMode, billId]);

  const handleSearchKeyPress = useCallback(async (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const searchTerm = search.trim();
      let product = null;

      product = products.find(p =>
        (p.productCode && p.productCode.toString() === searchTerm) ||
        (p.sku && p.sku.toString() === searchTerm) ||
        (p.code && p.code.toString() === searchTerm) ||
        (p.barcode && p.barcode.toString() === searchTerm)
      );

      if (!product && searchTerm.match(/^[0-9a-fA-F]{24}$/)) {
        product = products.find(p => p._id === searchTerm);
      }

      if (!product) {
        product = products.find(p => p.name.toLowerCase() === searchTerm.toLowerCase());
      }

      if (!product) {
        const matchingProducts = products.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (matchingProducts.length === 1) {
          product = matchingProducts[0];
        } else if (matchingProducts.length > 1) {
          const productList = matchingProducts.map((p, idx) =>
            `${idx + 1}. ${p.name}`
          ).join('\n');
          const selected = prompt(`Multiple products found:\n${productList}\n\nEnter the number of the product you want:`);
          const selectedIndex = parseInt(selected) - 1;
          if (!isNaN(selectedIndex) && matchingProducts[selectedIndex]) {
            product = matchingProducts[selectedIndex];
          } else {
            alert('Invalid selection');
            return;
          }
        }
      }

      if (product) {
        if (product.stock <= 0) {
          alert(`${product.name} is out of stock!`);
          return;
        }

        const price = roundToTwoDecimals(product.retailRate);
        setCart(prev => {
          const existing = prev.find(i => i.product === product._id);
          if (existing) {
            if (existing.qty >= product.stock) {
              alert(`Cannot add more ${product.name}. Only ${product.stock} in stock.`);
              return prev;
            }
            const newQty = existing.qty + 1;
            const newTotal = roundToTwoDecimals(newQty * price);
            return prev.map(i => i.product === product._id ? { ...i, qty: newQty, total: newTotal } : i);
          }
          return [...prev, {
            product: product._id,
            name: product.name,
            price: price,
            qty: 1,
            total: price
          }];
        });

        setSearch("");
      } else {
        alert(`Product "${searchTerm}" not found.`);
      }
    }
  }, [search, products]);

  const filteredProducts = useMemo(() =>
    products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const productCategory = getSafeString(p.category);
      const productBrand = getSafeString(p.brand);
      const matchesCategory = !selectedCategory || productCategory === selectedCategory;
      const matchesBrand = !selectedBrand || productBrand === selectedBrand;
      return matchesSearch && matchesCategory && matchesBrand;
    }),
    [products, debouncedSearch, selectedCategory, selectedBrand]
  );

  const totalItemCount = useMemo(() => {
    const sum = cart.reduce((sum, i) => {
      const qty = typeof i.qty === 'number' ? i.qty : parseFloat(i.qty) || 0;
      return sum + qty;
    }, 0);
    return parseFloat(sum.toFixed(3));
  }, [cart]);

  const subtotal = useMemo(() => {
    const sum = cart.reduce((sum, i) => sum + i.total, 0);
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

  const removeItem = useCallback((id) => setCart(prev => prev.filter(i => i.product !== id)), []);

  const updateQty = useCallback((id, newQty, stock) => {
    const roundedQty = Math.round(newQty * 1000) / 1000;

    if (roundedQty <= 0) {
      return removeItem(id);
    }

    if (stock !== undefined && stock !== null && roundedQty > stock) {
      alert(`Cannot add more than ${stock} units of this product`);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.product === id) {
        const newTotal = roundToTwoDecimals(roundedQty * item.price);
        return { ...item, qty: roundedQty, total: newTotal };
      }
      return item;
    }));
  }, [removeItem]);

  const handleAddToCart = useCallback((product) => {
    const price = roundToTwoDecimals(product.retailRate);
    const incrementValue = 1;

    setCart(prev => {
      const existing = prev.find(i => i.product === product._id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`Cannot add more ${product.name}. Only ${product.stock} in stock.`);
          return prev;
        }
        const newQty = roundToTwoDecimals(existing.qty + incrementValue);
        if (newQty > product.stock) {
          alert(`Cannot exceed stock limit of ${product.stock}`);
          return prev;
        }
        const newTotal = roundToTwoDecimals(newQty * price);
        return prev.map(i => i.product === product._id ? { ...i, qty: newQty, total: newTotal } : i);
      }
      return [...prev, {
        product: product._id,
        name: product.name,
        price: price,
        qty: incrementValue,
        total: roundToTwoDecimals(price * incrementValue)
      }];
    });
  }, []);

  const incrementDiscount = useCallback(() => {
    setDiscount(prev => Math.min(100, prev + 1));
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

  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearch("");
    setPaymentMethod("cash");
  }, []);

  const handleRemoveCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setPaymentMethod("cash");
  }, []);

  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomer.name.trim()) {
      alert("Please enter customer name");
      return;
    }

    try {
      const res = await axios.post(`${API}/customers`, newCustomer);
      if (res.data.success || res.data._id) {
        const createdCustomer = res.data;
        setCustomers(prev => [...prev, createdCustomer]);
        setSelectedCustomer(createdCustomer);
        setNewCustomer({ name: "", phone: "", email: "", address: "" });
        setShowCustomerModal(false);
        alert("Customer added successfully!");
        setPaymentMethod("cash");
      }
    } catch (error) {
      console.error("Create customer error:", error);
      alert("Failed to create customer. Please try again.");
    }
  }, [newCustomer]);

  const processCheckout = useCallback(async (paymentData = null) => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return false;
    }

    setCheckoutLoading(true);
    try {
      const finalPaymentMethod = paymentData ? paymentData.paymentMethod : paymentMethod;
      const finalPaidAmount = paymentData ? roundToTwoDecimals(paymentData.paidAmount) : total;
      const finalDueAmount = paymentData ? roundToTwoDecimals(paymentData.dueAmount) : 0;
      const finalCashPaid = paymentData ? roundToTwoDecimals(paymentData.cashPaid || 0) : (finalPaymentMethod === 'cash' ? total : 0);
      const finalUpiPaid = paymentData ? roundToTwoDecimals(paymentData.upiPaid || 0) : (finalPaymentMethod === 'upi' ? total : 0);

      const payload = {
        items: cart.map(i => ({
          productId: i.product,
          productName: i.name,
          quantity: i.qty,
          price: roundToTwoDecimals(i.price)
        })),
        discount: roundToTwoDecimals(discount),
        discountAmount: roundToTwoDecimals(discountAmount),
        paymentMethod: finalPaymentMethod,
        paidAmount: finalPaidAmount,
        dueAmount: finalDueAmount,
        cashPaid: finalCashPaid,
        upiPaid: finalUpiPaid,
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
        res = await axios.put(`${API}/bills/${billId}`, payload);
      } else {
        res = await axios.post(`${API}/bills`, payload);
      }

      if (res.data.success) {
        // Build the bill object for printing from the saved response
        const savedBill = res.data.bill || res.data.data || {};

        const billForPrint = {
          billNumber: savedBill.billNumber || billNumber,
          date: new Date(billDate).toISOString(),
          customer: selectedCustomer?.name || "Walk-in Customer",
          customerPhone: selectedCustomer?.phone || "",
          items: cart.map(i => ({
            name: i.name,
            productName: i.name,
            quantity: i.qty,
            price: roundToTwoDecimals(i.price),
          })),
          discount: roundToTwoDecimals(discount),
          discountAmount: roundToTwoDecimals(discountAmount),
          subtotal: cart.reduce((sum, i) => sum + i.price * i.qty, 0),
          total: total,
          paymentMethod: finalPaymentMethod,
          paid: finalPaidAmount,
          due: finalDueAmount,
        };

        // 🖨️ Trigger print preview after successful save/update
        handlePrintBill(billForPrint);

        let message = isEditMode ? `Bill Updated Successfully!\n` : `Transaction Successful!\n`;
        if (isEditMode) {
          message += `Bill #${billNumber}\n`;
        }
        message += `Bill Date: ${formatDateTime(billDate)}\n`;
        message += `Payment Method: ${finalPaymentMethod.toUpperCase()}\n`;
        if (finalPaymentMethod === 'credit') {
          if (finalPaidAmount === 0) {
            message += `Full Credit: ${formatCurrency(finalDueAmount)}\n`;
          } else {
            message += `Cash Paid: ${formatCurrency(finalCashPaid)}\n`;
            message += `UPI Paid: ${formatCurrency(finalUpiPaid)}\n`;
            message += `Total Paid: ${formatCurrency(finalPaidAmount)}\n`;
            if (finalDueAmount > 0) {
              message += `Due Amount: ${formatCurrency(finalDueAmount)}\n`;
            }
          }
        } else {
          message += `Total: ${formatCurrency(total)}\n`;
        }
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
        closeCart();
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
  }, [cart, discountAmount, paymentMethod, total, selectedCustomer, fetchProducts, closeCart, billDate, isEditMode, billId, navigate, billNumber]);

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

  const handleCreditPayment = useCallback(() => {
    if (!isRegisteredCustomer) {
      alert("Credit option is only available for registered customers. Please add a customer first.");
      return;
    }
    if (total <= 0) {
      alert("Bill amount is zero!");
      return;
    }
    const creditOption = window.confirm("Choose Credit Option:\n\nOK: Full Credit (No payment now)\nCancel: Split Payment (Partial payment)");
    if (creditOption) {
      handleFullCredit();
    } else {
      handleSplitCredit();
    }
  }, [total, isRegisteredCustomer, handleFullCredit, handleSplitCredit]);

  const handleCreditConfirm = useCallback(async () => {
    if (creditType === "full") {
      await processCheckout({
        paymentMethod: 'credit',
        paidAmount: 0,
        dueAmount: total,
        cashPaid: 0,
        upiPaid: 0
      });
      setShowCreditModal(false);
      setCashAmount("");
      setUpiAmount("");
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
      setDueAmount(newDueAmount);

      await processCheckout({
        paymentMethod: 'credit',
        paidAmount: totalPaid,
        dueAmount: newDueAmount,
        cashPaid: cashPaid,
        upiPaid: upiPaid
      });

      setShowCreditModal(false);
      setCashAmount("");
      setUpiAmount("");
    }
  }, [creditType, cashAmount, upiAmount, total, processCheckout]);

  const getAvailablePaymentMethods = useMemo(() => {
    const allMethods = [
      { id: 'cash', label: '💵 CASH', color: 'bg-green-600 hover:bg-green-700' },
      { id: 'upi', label: '📱 UPI', color: 'bg-blue-600 hover:bg-blue-700' }
    ];

    if (isRegisteredCustomer) {
      allMethods.push({ id: 'credit', label: '📝 CREDIT', color: 'bg-orange-600 hover:bg-orange-700' });
    }

    return allMethods;
  }, [isRegisteredCustomer]);

  const checkout = useCallback(async () => {
    if (paymentMethod === 'credit') {
      if (!isRegisteredCustomer) {
        alert("Credit option is only available for registered customers. Please add a customer or select another payment method.");
        setPaymentMethod("cash");
        return;
      }
      handleCreditPayment();
    } else {
      await processCheckout();
    }
  }, [paymentMethod, handleCreditPayment, processCheckout, isRegisteredCustomer]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearch("");
  };

  // Get category counts for sidebar display
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(product => {
      const category = getSafeString(product.category);
      if (category) {
        counts[category] = (counts[category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  return (
    <div className="relative flex flex-col h-screen bg-gray-50 text-black overflow-hidden">
     

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Select Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {customerLoading ? (
                <div className="text-center py-4">Loading customers...</div>
              ) : filteredCustomers.length > 0 ? (
                <div className="space-y-2">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer._id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full text-left p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="font-bold text-sm">{customer.name}</div>
                      {customer.phone && <div className="text-xs text-gray-600">📞 {customer.phone}</div>}
                      {customer.email && <div className="text-xs text-gray-600">✉️ {customer.email}</div>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No customers found</p>
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-sm mb-3">Add New Customer</h4>
                    <input
                      type="text"
                      placeholder="Name *"
                      className="w-full p-2 border border-gray-200 rounded-lg mb-2"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      className="w-full p-2 border border-gray-200 rounded-lg mb-2"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full p-2 border border-gray-200 rounded-lg mb-2"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <textarea
                      placeholder="Address"
                      className="w-full p-2 border border-gray-200 rounded-lg mb-2"
                      rows="2"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                    />
                    <button
                      onClick={handleCreateCustomer}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm"
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
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {creditType === "full" ? "Full Credit Payment" : "Split Credit Payment"}
              </h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</div>
              </div>

              {creditType === "split" ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Cash Amount Paid 💵
                    </label>
                    <input
                      type="number"
                      placeholder="Enter cash amount"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                      value={cashAmount}
                      onChange={handleCashAmountChange}
                      step="0.01"
                      min="0"
                      max={total}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      UPI Amount Paid 📱
                    </label>
                    <input
                      type="number"
                      placeholder="Enter UPI amount"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                      value={upiAmount}
                      onChange={handleUpiAmountChange}
                      step="0.01"
                      min="0"
                      max={total}
                    />
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Total Paid</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Credit Amount</div>
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(total)}</div>
                  <div className="text-xs text-gray-500 mt-2">Full credit - No payment required now</div>
                </div>
              )}

              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Due Amount</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(creditType === "full" ? total : dueAmount)}
                </div>
              </div>

              <button
                onClick={handleCreditConfirm}
                disabled={creditType === "split" && ((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0)) === 0}
                className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowEditPriceModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Edit Item Price</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedEditItem.name}</p>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Current Price</div>
                <div className="text-xl font-bold text-gray-700">{formatCurrency(selectedEditItem.price)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Price (₹)
                </label>
                <input
                  type="number"
                  value={editPriceValue}
                  onChange={(e) => setEditPriceValue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white"
                  placeholder="Enter new price"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>

              {selectedEditItem && editPriceValue && parseFloat(editPriceValue) > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1">New Total</div>
                  <div className="text-xl font-bold text-blue-700">
                    {formatCurrency(roundToTwoDecimals(selectedEditItem.qty * parseFloat(editPriceValue)))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Quantity: {formatQuantityDisplay(selectedEditItem.qty)} × New Price: {formatCurrency(roundToTwoDecimals(parseFloat(editPriceValue)))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setShowEditPriceModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePrice}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-3 bg-white border-b shadow-sm z-20">
        <h1 className="font-bold text-base">POS SYSTEM {isEditMode && '(EDIT MODE)'}</h1>
        <button
          onClick={openCart}
          className="relative px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md"
        >
          CART ({formatQuantityDisplay(totalItemCount)})
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center p-4 bg-white border-b shadow-sm z-20">
        <h1 className="font-bold text-lg">POS SYSTEM {isEditMode && '(EDIT MODE)'}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
          >
            {isSidebarOpen ? '◀ Hide Categories' : '▶ Show Categories'}
          </button>
          <button
            onClick={openCart}
            className="relative px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors"
          >
            🛒 VIEW CART ({formatQuantityDisplay(totalItemCount)})
          </button>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar - Desktop */}
        {categories.length > 0 && (
          <div className={`
    hidden md:block bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto
    ${isSidebarOpen ? 'w-64' : 'w-0'}
  `}>
            {isSidebarOpen && (
              <div className="p-4">
                {/* All Categories Option */}
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`
            w-full text-left p-2 rounded-lg mb-1 transition-all
            ${!selectedCategory
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-gray-100 text-gray-700'
                    }
          `}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">All Categories</span>
                    <span className={`text-xs ${!selectedCategory ? 'text-white' : 'text-gray-500'}`}>
                      {products.length}
                    </span>
                  </div>
                </button>

                {/* Category List */}
                <div className="space-y-1 mt-2">
                  {categories.map(category => (
                    <button
                      key={`sidebar-category-${category}`}
                      onClick={() => setSelectedCategory(category)}
                      className={`
                w-full text-left p-2 rounded-lg transition-all
                ${selectedCategory === category
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'hover:bg-gray-100 text-gray-700'
                        }
              `}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm truncate flex-1">{category}</span>
                        <span className={`text-xs ml-2 ${selectedCategory === category ? 'text-white' : 'text-gray-500'}`}>
                          {categoryCounts[category] || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Brand Filter Section (optional) */}
                {brands.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide mb-2">Brands</h3>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium bg-white focus:border-blue-500 outline-none"
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      <option value="">All Brands</option>
                      {brands.map(brand => (
                        <option key={`brand-${brand}`} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Clear Filters Button */}
                {(selectedCategory || selectedBrand || search) && (
                  <button
                    onClick={clearFilters}
                    className="w-full mt-4 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    Clear All Filters ✕
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Products Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {isEditMode && (
            <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800">
              Editing bill #{billNumber} - Modify items, discount, or customer details
            </div>
          )}



          {/* Search Bar */}
          <div className="space-y-3 mb-4">
            {/* Search Box Toggle Button */}
            <div className="flex justify-between items-center">
              <button
                onClick={toggleSearchBox}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                {showSearchBox ? '🔍 Hide Search' : '🔍 Show Search'}
              </button>
              {showSearchBox && (
                <span className="text-xs text-gray-400">Press Enter to add to cart</span>
              )}
            </div>

            {/* Search Input - Conditionally Rendered */}
            {showSearchBox && (
              <div className="relative w-full">
                <input
                  className="w-full p-2 pl-8 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm text-black"
                  placeholder="Search products or enter product code and press Enter to add to cart..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <span className="absolute left-2 top-2.5 text-xs opacity-40">🔍</span>
              </div>
            )}
          </div>

          {/* Also update the mobile category filter section to maintain consistency */}
          {/* Mobile Category Filter - Visible only on mobile */}
          <div className="md:hidden flex flex-wrap gap-2 items-center">
            <button
              onClick={toggleSearchBox}
              className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              {showSearchBox ? '🔍' : '🔍 Hide'}
            </button>

            {categories.length > 0 && (
              <select
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white focus:border-blue-500 outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={`mobile-category-${cat}`} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {brands.length > 0 && (
              <select
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white focus:border-blue-500 outline-none"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={`mobile-brand-${brand}`} value={brand}>{brand}</option>
                ))}
              </select>
            )}

            {(selectedCategory || selectedBrand || search) && (
              <button
                onClick={clearFilters}
                className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium transition-colors"
              >
                Clear Filters ✕
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={`skeleton-${i}`} className="h-32 bg-gray-200 rounded-lg"></div>)}
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 mb-2">
                Showing {filteredProducts.length} of {products.length} products
                {selectedCategory && <span> • Category: {selectedCategory}</span>}
                {selectedBrand && <span> • Brand: {selectedBrand}</span>}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map(p => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    onAdd={handleAddToCart}
                    onUpdateQty={updateQty}
                    cartQuantity={cart.find(i => i.product === p._id)?.qty}
                  />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No products found
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cart Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Cart Drawer */}
      <div className={`
        fixed top-0 right-0 bottom-0 z-50 w-[90%] max-w-[380px] bg-white shadow-2xl transition-transform duration-300 transform overflow-hidden
        ${isCartOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="flex flex-col h-full w-full relative">
          {/* Cart Header */}
          <div className="bg-gray-50 border-b sticky top-0 z-10">
            <div className="flex justify-between items-center p-4 gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm md:text-base font-bold text-black uppercase tracking-wider">
                  {isEditMode ? '✏️ EDIT BILL' : '🧾 Bill Summary'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {isEditingDate ? (
                    <input
                      ref={dateInputRef}
                      type="datetime-local"
                      value={billDate}
                      onChange={handleDateChange}
                      onBlur={handleDateBlur}
                      className="text-xs text-gray-600 font-mono border border-gray-300 rounded px-1 py-0.5 focus:border-blue-500 outline-none"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="text-xs text-gray-600 font-mono cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1"
                      onClick={handleEditDateClick}
                    >
                      📅 {currentDateTime || formatDateTime(new Date())}
                      <span className="text-blue-500 text-xs">✎</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={closeCart}
                className="bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors shadow-md active:scale-95 whitespace-nowrap flex-shrink-0 px-4 py-2 text-sm z-20 relative"
                aria-label="Close cart"
              >
                ✕ CLOSE
              </button>
            </div>
          </div>

          {/* Cart Items List with Price Edit */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <span className="text-3xl mb-2">🛍️</span>
                <p className="font-bold text-sm text-black uppercase">No items in cart</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={`cart-${item.product}`} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-black leading-tight flex-1 pr-2">{item.name}</h3>
                    <button
                      onClick={() => removeItem(item.product)}
                      className="text-red-500 font-bold text-sm hover:text-red-700 flex-shrink-0 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-xs">x{formatQuantityDisplay(item.qty)}</span>
                      <button
                        onClick={() => handleEditPrice(item)}
                        className="text-gray-600 text-xs hover:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        @ {formatCurrency(item.price)}
                        <span className="text-blue-500 text-[10px]">✎</span>
                      </button>
                    </div>
                    <div className="text-base font-bold text-black">{formatCurrency(item.total)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Billing Footer */}
          <div className="p-4 bg-gray-50 border-t sticky bottom-0 z-10">
            {/* Customer Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-black">CUSTOMER</span>
                {!selectedCustomer && (
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold"
                  >
                    + ADD CUSTOMER
                  </button>
                )}
              </div>

              {selectedCustomer ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-blue-900">{selectedCustomer.name}</div>
                      {selectedCustomer.phone && (
                        <div className="text-xs text-blue-700">📞 {selectedCustomer.phone}</div>
                      )}
                      {selectedCustomer.email && (
                        <div className="text-xs text-blue-700">✉️ {selectedCustomer.email}</div>
                      )}
                      {selectedCustomer._id && (
                        <div className="text-xs text-green-600 mt-1">✓ Registered Customer</div>
                      )}
                    </div>
                    <button
                      onClick={handleRemoveCustomer}
                      className="text-red-500 text-xs font-bold hover:text-red-700"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-600">Walk-in Customer</span>
                  <div className="text-xs text-orange-500 mt-1">⚠️ Credit not available</div>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-gray-600 text-xs font-bold uppercase">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-black">DISCOUNT %</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={decrementDiscount}
                    disabled={discount <= 0}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold w-6 h-6 rounded text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="w-14 p-1 border border-gray-300 rounded text-center text-sm font-bold text-black outline-none focus:border-blue-500"
                    value={discount}
                    onChange={handleDiscountChange}
                    step="1"
                    min="0"
                    max="100"
                  />
                  <button
                    onClick={incrementDiscount}
                    disabled={discount >= 100}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold w-6 h-6 rounded text-sm"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-gray-600">%</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-black block">PAYMENT</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {getAvailablePaymentMethods.map(method => (
                    <button
                      key={`payment-${method.id}`}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold text-white transition-all ${paymentMethod === method.id
                        ? `${method.color} ring-1 ring-offset-1 ring-blue-500`
                        : 'bg-gray-400 hover:bg-gray-500'
                        }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-300">
              {/* Total Items */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Items</span>
                <span className="text-sm font-bold text-black">{formatQuantityDisplay(totalItemCount)}</span>
              </div>

              {/* Net Amount */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Net Amount</span>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(total)}</span>
              </div>

              {/* Checkout Button */}
              <button
                disabled={checkoutLoading || cart.length === 0 || (paymentMethod === 'credit' && !isRegisteredCustomer)}
                onClick={checkout}
                className={`w-full text-white py-2.5 rounded-xl font-bold text-sm shadow-md active:scale-95 disabled:bg-gray-400 transition-all ${paymentMethod === 'credit' && isRegisteredCustomer ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-700 hover:bg-blue-800'
                  }`}
              >
                {checkoutLoading ? "PROCESSING..." :
                  paymentMethod === 'credit' && !isRegisteredCustomer ? "ADD CUSTOMER FOR CREDIT" :
                    paymentMethod === 'credit' ? "PROCESS CREDIT PAYMENT" :
                      isEditMode ? "UPDATE BILL" : "FINISH ORDER"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;