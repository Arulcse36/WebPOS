import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Category from "./pages/Category";
import Brand from "./pages/Brand";
import Uom from "./pages/Uom";
import Product from "./pages/Product";
import POS from "./pages/POS";
import RetailPOS from "./pages/RetailPos";
import ProductBulk from "./pages/ProductBulk";
import Customer from "./pages/Customer";
import Report from "./pages/Report";
import ItemsReport from './pages/ItemsReport';
import Company from './pages/Company';
import Users from './pages/Users';
import PaymentReport from './pages/PaymentReport';
import SuperAdminLogin from './pages/SuperAdminLogin';
import CompanyLogin from './pages/CompanyLogin';
import ExpenseMaster from './pages/ExpenseMaster'; // or './components/ExpenseMaster'

// In your App.jsx or routing file
import SeedDatabase from './pages/SeedDatabase';



import ExpenseTransaction from './pages/ExpenseTransaction';

// Add this to your app initialization
const preloadTamilFonts = async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = "24px 'Noto Sans Tamil'";
  ctx.fillText("அ", 0, 0);
  await document.fonts.ready;
  console.log("Tamil fonts preloaded");
};

preloadTamilFonts();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const userData = localStorage.getItem("user");
    const superAdmin = localStorage.getItem("isSuperAdmin");

    if (loggedIn === "true" && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      setIsSuperAdmin(superAdmin === "true");
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setIsSuperAdmin(userData.isSuperAdmin || false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("isSuperAdmin");
    localStorage.removeItem("userType");
    localStorage.removeItem("companyId");
    localStorage.removeItem("companyName");
    setIsAuthenticated(false);
    setUser(null);
    setIsSuperAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">🏢</div>
          <p>Loading...</p>

          
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - No Layout */}
        <Route path="/login" element={<CompanyLogin onLogin={handleLogin} />} />
        <Route path="/admin" element={<SuperAdminLogin onLogin={handleLogin} />} />

        {/* Protected Routes - With Layout */}
        <Route path="/" element={
          isAuthenticated ? (
            <Layout onLogout={handleLogout} user={user} isSuperAdmin={isSuperAdmin} />
          ) : (
            <Navigate to="/login" replace />
          )
        }>
          {/* Super Admin Routes */}
          {isSuperAdmin && (
            <>
              <Route path="admin/dashboard" element={<Dashboard user={user} isSuperAdmin={isSuperAdmin} />} />
              <Route path="company" element={<Company isSuperAdmin={isSuperAdmin} />} />
            </>
          )}

          {/* Company Routes - Accessible by both */}
          <Route index element={<Dashboard user={user} isSuperAdmin={isSuperAdmin} />} />
          <Route path="dashboard" element={<Dashboard user={user} isSuperAdmin={isSuperAdmin} />} />
          <Route path="products/category" element={<Category />} />
          <Route path="products/brand" element={<Brand />} />
          <Route path="products/uom" element={<Uom />} />
          <Route path="products/product" element={<Product />} />
                 <Route path="products/ProductBulk" element={<ProductBulk />} />
          <Route path="pos" element={<POS />} />
          <Route path="RetailPos" element={<RetailPOS />} />
          <Route path="pos/edit/:id" element={<POS />} />
             <Route path="RetailPos/edit/:id" element={<RetailPOS />} />
          <Route path="customer" element={<Customer />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Report />} />
          <Route path="items-report" element={<ItemsReport />} />
          <Route path="payment-report" element={<PaymentReport />} />
          <Route path="/masters/expense" element={<ExpenseMaster />} />
          <Route path="/masters/expense-transaction" element={<ExpenseTransaction />} />
          // Add this route
<Route path="/seed-database" element={<SeedDatabase />} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;