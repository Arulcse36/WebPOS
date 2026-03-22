import React, { useState, useEffect, useMemo, useCallback } from "react";
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

// --- Sub-Components ---

const ProductCard = React.memo(({ product, onAdd, onIncrement, onDecrement, cartQuantity, formatCurrency }) => {
  const qty = cartQuantity || 0;
  const isOutOfStock = product.stock <= 0;
  const categoryName = getSafeString(product.category);
  const brandName = getSafeString(product.brand);

  return (
    <div className={`p-3 rounded-lg transition-all border ${
      isOutOfStock ? 'bg-gray-200 opacity-60 border-transparent' : 'bg-white shadow-sm hover:shadow-md border-gray-200 hover:border-blue-400'
    }`}>
      <div className="mb-2">
        <div className="font-bold text-gray-900 text-sm leading-tight h-10 overflow-hidden">{product.name}</div>
        <div className="text-base font-black text-blue-700 mt-1">{formatCurrency(product.retailRate)}</div>
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
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  
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
  
  // Mobile UI State
  const [isCartOpen, setIsCartOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);

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
    const saved = localStorage.getItem('pos_cart');
    if (saved) setCart(JSON.parse(saved));
    const savedCustomer = localStorage.getItem('pos_selected_customer');
    if (savedCustomer) setSelectedCustomer(JSON.parse(savedCustomer));
  }, []);

  useEffect(() => { 
    localStorage.setItem('pos_cart', JSON.stringify(cart));
    if (selectedCustomer) {
      localStorage.setItem('pos_selected_customer', JSON.stringify(selectedCustomer));
    } else {
      localStorage.removeItem('pos_selected_customer');
    }
  }, [cart, selectedCustomer]);

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

  // --- Calculations ---
  const totalItemCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.total, 0), [cart]);
  const discountAmount = useMemo(() => subtotal * (discount / 100), [subtotal, discount]);
  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

  const removeItem = useCallback((id) => setCart(prev => prev.filter(i => i.product !== id)), []);

  const updateQty = useCallback((id, newQty, stock) => {
    if (newQty < 1) return removeItem(id);
    if (newQty > stock) return;
    setCart(prev => prev.map(item => item.product === id ? { ...item, qty: newQty, total: newQty * item.price } : item));
  }, [removeItem]);

  const handleAddToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product === product._id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(i => i.product === product._id ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.price } : i);
      }
      return [...prev, { product: product._id, name: product.name, price: product.retailRate, qty: 1, total: product.retailRate }];
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
  }, []);

  const handleRemoveCustomer = useCallback(() => {
    setSelectedCustomer(null);
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
      }
    } catch (error) {
      console.error("Create customer error:", error);
      alert("Failed to create customer. Please try again.");
    }
  }, [newCustomer]);

  // Payment method handlers
  const paymentMethods = [
    { id: 'cash', label: '💵 CASH', color: 'bg-green-600 hover:bg-green-700' },
    { id: 'card', label: '💳 CARD', color: 'bg-purple-600 hover:bg-purple-700' },
    { id: 'upi', label: '📱 UPI', color: 'bg-blue-600 hover:bg-blue-700' }
  ];

  const checkout = useCallback(async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    setCheckoutLoading(true);
    try {
      const payload = { 
        items: cart.map(i => ({ productId: i.product, quantity: i.qty, price: i.price })), 
        discount: discountAmount, 
        paymentMethod, 
        total, 
        customerId: selectedCustomer?._id || null,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        timestamp: new Date().toISOString() 
      };
      const res = await axios.post(`${API}/billing`, payload);
      if (res.data.success) {
        alert(`Transaction Successful! ${selectedCustomer ? `Customer: ${selectedCustomer.name}` : "Walk-in Customer"}`);
        setCart([]);
        setDiscount(0);
        setSelectedCustomer(null);
        closeCart(); // Close cart after successful checkout
        fetchProducts();
      }
    } catch (err) { 
      alert("Checkout failed. Please try again."); 
      console.error("Checkout error:", err);
    } finally { 
      setCheckoutLoading(false); 
    }
  }, [cart, discountAmount, paymentMethod, total, selectedCustomer, fetchProducts, closeCart]);

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  // Clear filters
  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearch("");
  };

  return (
    <div className="relative flex flex-col md:flex-row h-screen bg-gray-50 text-black overflow-hidden">
      
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
      
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-3 bg-white border-b shadow-sm z-20">
        <h1 className="font-bold text-base">POS SYSTEM</h1>
        <button 
          onClick={openCart}
          className="relative px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md"
        >
          CART ({totalItemCount})
        </button>
      </div>

      {/* Product Area */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto">
        {/* Search and Filters Section */}
        <div className="space-y-3 mb-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <input 
              className="w-full p-2 pl-8 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm text-black"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                  formatCurrency={formatCurrency}
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

      {/* Mobile Overlay - Click to close */}
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
          {/* Cart Header with Always Visible Close Button */}
          <div className="bg-gray-50 border-b">
            <div className="flex justify-between items-center p-4 gap-3">
              <h2 className="text-sm md:text-base font-bold text-black uppercase tracking-wider flex-1 min-w-0">
                🧾 Bill Summary
              </h2>
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
                <div className="grid grid-cols-3 gap-1.5">
                  {paymentMethods.map(method => (
                    <button
                      key={`payment-${method.id}`}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold text-white transition-all ${
                        paymentMethod === method.id 
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
              
              {/* Checkout Button */}
              <button 
                disabled={checkoutLoading || cart.length === 0} 
                onClick={checkout} 
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-bold text-sm shadow-md active:scale-95 disabled:bg-gray-400 transition-all"
              >
                {checkoutLoading ? "PROCESSING..." : "FINISH ORDER"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;