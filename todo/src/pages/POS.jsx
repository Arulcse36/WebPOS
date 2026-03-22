import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// --- Custom Hooks ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const API = `${import.meta.env.VITE_API_URL}`;

// Helper function to safely get string value from category/brand
const getSafeString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.name) return value.name;
    if (value._id) return value.name || '';
    return '';
  }
  return String(value);
};

// Format date and time
const formatDateTime = (date = null) => {
  const now = date ? new Date(date) : new Date();
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  return now.toLocaleString('en-IN', options);
};

// Format currency function with 2 decimal places
const formatCurrency = (amt) => {
  const num = Number(amt);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Round to 2 decimal places helper
const roundToTwoDecimals = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// --- Sub-Components ---

const ProductCard = React.memo(({ product, onAdd, onIncrement, onDecrement, cartQuantity }) => {
  const qty = cartQuantity || 0;
  const isOutOfStock = product.stock <= 0;
  const categoryName = getSafeString(product.category);
  const brandName = getSafeString(product.brand);
  const price = roundToTwoDecimals(product.retailRate);

  return (
    <div className={`p-3 rounded-lg transition-all border ${isOutOfStock ? 'bg-gray-200 opacity-60 border-transparent' : 'bg-white shadow-sm hover:shadow-md border-gray-200 hover:border-blue-400'
      }`}>
      <div className="mb-2">
        <div className="font-bold text-gray-900 text-sm leading-tight h-10 overflow-hidden">{product.name}</div>
        <div className="text-base font-black text-blue-700 mt-1">{formatCurrency(price)}</div>
        <div className={`text-xs mt-1 font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-gray-500'}`}>
          STOCK: {product.stock}
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
              <button onClick={() => onDecrement(product._id, qty)} className="bg-red-500 hover:bg-red-600 text-white font-black w-8 h-8 rounded-lg text-lg shadow-sm">-</button>
              <div className="flex-1 text-center"><span className="text-xl font-black text-black">{qty}</span></div>
              <button onClick={() => onIncrement(product._id, qty, product.stock)} className="bg-green-500 hover:bg-green-600 text-white font-black w-8 h-8 rounded-lg text-lg shadow-sm" disabled={qty >= product.stock}>+</button>
            </>
          ) : (
            <button onClick={() => onAdd(product)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold shadow-md transition-transform active:scale-95 text-xs uppercase">ADD TO CART</button>
          )}
        </div>
      )}
    </div>
  );
});

// --- Main POS Component ---

const POS = () => {
  const { id: billId } = useParams(); // Get bill ID from URL if editing
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Bill date state
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 16));
  const [isEditingDate, setIsEditingDate] = useState(false);
  const dateInputRef = useRef(null);

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
  const [creditAmount, setCreditAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [dueAmount, setDueAmount] = useState(0);
  const [creditType, setCreditType] = useState("full");

  // Mobile UI State
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Current date and time display (editable)
  const [currentDateTime, setCurrentDateTime] = useState(formatDateTime(billDate));

  const debouncedSearch = useDebounce(search, 300);
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);

  // Check if customer is registered (not walk-in)
  const isRegisteredCustomer = useMemo(() => {
    return selectedCustomer !== null && selectedCustomer._id;
  }, [selectedCustomer]);

  // Update displayed date/time when billDate changes
  useEffect(() => {
    setCurrentDateTime(formatDateTime(billDate));
  }, [billDate]);

  // Load bill data if in edit mode
  useEffect(() => {
    const loadBillForEdit = async () => {
      if (billId) {
        setIsEditMode(true);
        try {
          const response = await axios.get(`${API}/bills/${billId}`);
          const bill = response.data;
          
          // Populate cart items
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
          setBillDate(bill.billDate ? new Date(bill.billDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
          
          // Set customer if exists
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

  // Handle date change
  const handleDateChange = (e) => {
    setBillDate(e.target.value);
  };

  // Handle date edit click
  const handleEditDateClick = () => {
    setIsEditingDate(true);
    setTimeout(() => {
      if (dateInputRef.current) {
        dateInputRef.current.showPicker();
      }
    }, 100);
  };

  // Handle date blur
  const handleDateBlur = () => {
    setIsEditingDate(false);
  };

  // Function to close cart (works for both mobile and desktop)
  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  // Function to open cart
  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  // Extract unique categories and brands from products with proper handling
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

  // Fetch customers
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

  // Filter customers based on search
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
    // Only load from localStorage if not in edit mode
    if (!isEditMode) {
      const saved = localStorage.getItem('pos_cart');
      if (saved) setCart(JSON.parse(saved));
      const savedCustomer = localStorage.getItem('pos_selected_customer');
      if (savedCustomer) setSelectedCustomer(JSON.parse(savedCustomer));
      const savedBillDate = localStorage.getItem('pos_bill_date');
      if (savedBillDate) setBillDate(savedBillDate);
    }
  }, [isEditMode]);

  useEffect(() => {
    // Only save to localStorage if not in edit mode
    if (!isEditMode) {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
      localStorage.setItem('pos_bill_date', billDate);
      if (selectedCustomer) {
        localStorage.setItem('pos_selected_customer', JSON.stringify(selectedCustomer));
      } else {
        localStorage.removeItem('pos_selected_customer');
      }
    }
  }, [cart, selectedCustomer, billDate, isEditMode]);

  // Handle product code/search input to add to cart
  const handleSearchKeyPress = useCallback(async (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const searchTerm = search.trim();

      let product = null;

      // First try to find by productCode
      product = products.find(p =>
        (p.productCode && p.productCode.toString() === searchTerm) ||
        (p.sku && p.sku.toString() === searchTerm) ||
        (p.code && p.code.toString() === searchTerm) ||
        (p.barcode && p.barcode.toString() === searchTerm)
      );

      // If not found by code, try to find by ID
      if (!product && searchTerm.match(/^[0-9a-fA-F]{24}$/)) {
        product = products.find(p => p._id === searchTerm);
      }

      // If not found, try exact name match
      if (!product) {
        product = products.find(p => p.name.toLowerCase() === searchTerm.toLowerCase());
      }

      // If still not found, try partial name match
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
            const updatedCart = prev.map(i => i.product === product._id ? { ...i, qty: newQty, total: newTotal } : i);
            return updatedCart;
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
        alert(`Product "${searchTerm}" not found. Please check the product code or name.`);
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

  // --- Calculations with 2 decimal precision ---
  const totalItemCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);

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
    if (newQty < 1) return removeItem(id);
    if (stock !== 0 && newQty > stock) return;
    setCart(prev => prev.map(item => {
      if (item.product === id) {
        const newTotal = roundToTwoDecimals(newQty * item.price);
        return { ...item, qty: newQty, total: newTotal };
      }
      return item;
    }));
  }, [removeItem]);

  const handleAddToCart = useCallback((product) => {
    const price = roundToTwoDecimals(product.retailRate);
    setCart(prev => {
      const existing = prev.find(i => i.product === product._id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
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
  }, []);

  // Discount handlers
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

  // Customer handlers
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

  // Process checkout or update function
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
        // Update existing bill
        res = await axios.put(`${API}/bills/${billId}`, payload);
      } else {
        // Create new bill
        res = await axios.post(`${API}/bills`, payload);
      }

      if (res.data.success) {
        let message = isEditMode ? `Bill Updated Successfully!\n` : `Transaction Successful!\n`;
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
        }
        closeCart();
        fetchProducts();
        
        // Navigate back to reports after successful update
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
  }, [cart, discountAmount, paymentMethod, total, selectedCustomer, fetchProducts, closeCart, billDate, isEditMode, billId, navigate]);

  // Credit payment handlers
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
    const totalPaid = (cashVal || 0) + (upiVal || 0);

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
    const totalPaid = (cashVal || 0) + (upiVal || 0);

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
      const totalPaid = cashPaid + upiPaid;

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

  // Payment method handlers
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

  // Clear filters
  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearch("");
  };

  return (
    <div className="relative flex flex-col md:flex-row h-screen bg-gray-50 text-black overflow-hidden">
      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 font-bold z-50">
          ✏️ EDITING BILL #{billId} - Make your changes and click "UPDATE BILL"
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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

      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-3 bg-white border-b shadow-sm z-20">
        <h1 className="font-bold text-base">POS SYSTEM {isEditMode && '(EDIT MODE)'}</h1>
        <button
          onClick={openCart}
          className="relative px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md"
        >
          CART ({totalItemCount})
        </button>
      </div>

      {/* Product Area */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto mt-0 md:mt-0">
        {isEditMode && (
          <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800">
            Editing bill #{billId} - Modify items, discount, or customer details
          </div>
        )}
        
        {/* Search and Filters Section */}
        <div className="space-y-3 mb-4">
          {/* Search Bar with Enter key support */}
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

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2">
            {categories.length > 0 && (
              <select
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white focus:border-blue-500 outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={`category-${cat}`} value={cat}>{cat}</option>
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
                  <option key={`brand-${brand}`} value={brand}>{brand}</option>
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
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={`skeleton-${i}`} className="h-32 bg-gray-200 rounded-lg"></div>)}
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-500 mb-2">
              Showing {filteredProducts.length} of {products.length} products
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(p => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onAdd={handleAddToCart}
                  onIncrement={(id, q, s) => updateQty(id, q + 1, s)}
                  onDecrement={(id, q) => updateQty(id, q - 1, 0)}
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

      {/* Mobile Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Cart Sidebar / Drawer */}
      <div className={`
        fixed top-0 right-0 bottom-0 z-40 w-[90%] max-w-[380px] bg-white shadow-2xl transition-transform duration-300 transform overflow-hidden
        md:relative md:translate-x-0 md:w-2/5 md:z-auto md:border-l md:flex
        ${isCartOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
      `}>
        <div className="flex flex-col h-full w-full">
          {/* Cart Header with Editable Date/Time */}
          <div className="bg-gray-50 border-b">
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
                      📅 {currentDateTime}
                      <span className="text-blue-500 text-xs">✎</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={closeCart}
                className="bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors shadow-md active:scale-95 whitespace-nowrap flex-shrink-0 px-4 py-2 text-sm"
                aria-label="Close cart"
              >
                ✕ CLOSE
              </button>
            </div>
          </div>

          {/* Cart Items List */}
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
                    <button onClick={() => removeItem(item.product)} className="text-red-500 font-bold text-sm hover:text-red-700 flex-shrink-0">✕</button>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-xs">x{item.qty}</span>
                      <span className="text-gray-600 text-xs">@ {formatCurrency(item.price)}</span>
                    </div>
                    <div className="text-base font-bold text-black">{formatCurrency(item.total)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Billing Footer */}
          <div className="p-4 bg-gray-50 border-t space-y-3">
            {/* Customer Selection Section */}
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

            <div className="space-y-2">
              <div className="flex justify-between text-gray-600 text-xs font-bold uppercase">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount with +/- buttons */}
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

              {/* Payment Method as Buttons */}
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

            <div className="pt-3 border-t border-gray-300">
              {/* Total Items */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Items</span>
                <span className="text-sm font-bold text-black">{totalItemCount}</span>
              </div>

              {/* Net Amount */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Net Amount</span>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(total)}</span>
              </div>

              {/* Checkout/Update Button */}
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