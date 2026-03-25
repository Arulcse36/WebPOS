import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const menuItemClass = (isActive) =>
  `p-2 rounded flex items-center gap-2 ${
    isActive ? "bg-blue-500" : "hover:bg-slate-700"
  }`;

const subItemClass = (isActive) =>
  `p-2 rounded text-sm ${
    isActive ? "bg-blue-500" : "hover:bg-slate-700"
  }`;

// Products Menu
const ProductsMenu = ({ open, toggle, onNavigate }) => (
  <div>
    <button
      onClick={toggle}
      className="w-full text-left p-2 rounded hover:bg-slate-700 flex justify-between items-center"
    >
      <span className="flex items-center gap-2">📦 Products</span>
      <span>{open ? "▲" : "▼"}</span>
    </button>

    {open && (
      <div className="ml-4 mt-1 flex flex-col gap-1">
        <NavLink to="/products/category" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          🗂 Category
        </NavLink>
        <NavLink to="/products/brand" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          🏷 Brand
        </NavLink>
        <NavLink to="/products/uom" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          🏷 UOM
        </NavLink>
        <NavLink to="/products/product" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          🏷 Product
        </NavLink>
      </div>
    )}
  </div>
);

// Sidebar Content
const SidebarContent = ({
  openProducts,
  setOpenProducts,
  closeSidebar,
}) => (
  <nav className="flex flex-col gap-2">

    <NavLink
      to="/"
      className={({ isActive }) => menuItemClass(isActive)}
      onClick={() => {
        setOpenProducts(false);
        closeSidebar();
      }}
    >
      🏠 Dashboard
    </NavLink>

    <ProductsMenu
      open={openProducts}
      toggle={() => setOpenProducts((prev) => !prev)}
      onNavigate={closeSidebar}
    />

    <NavLink
      to="/customer"
      className={({ isActive }) => menuItemClass(isActive)}
      onClick={() => {
        setOpenProducts(false);
        closeSidebar();
      }}
    >
      📝 Customer
    </NavLink>

    <NavLink
      to="/pos"
      className={({ isActive }) => menuItemClass(isActive)}
      onClick={() => {
        setOpenProducts(false);
        closeSidebar();
      }}
    >
      🧾 POS
    </NavLink>

    <NavLink
      to="/reports"
      className={({ isActive }) => menuItemClass(isActive)}
      onClick={() => {
        setOpenProducts(false);
        closeSidebar();
      }}
    >
      📊 Reports
    </NavLink>

  </nav>
);

const Layout = () => {
  const [openProducts, setOpenProducts] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* 🔥 Top Bar */}
      <div className="fixed top-0 left-0 w-full bg-slate-800 p-3 flex justify-between items-center z-50">
        <button
          onClick={() => setOpenSidebar(true)}
          className="text-xl"
        >
          ☰
        </button>
        <h2 className="font-bold">My App</h2>
      </div>

      {/* 🔥 Sidebar Drawer (LEFT SIDE) */}
      {openSidebar && (
        <div className="fixed inset-0 z-50 flex">

          {/* Sidebar LEFT */}
          <div className="w-64 bg-slate-800 p-4 transform transition-transform duration-300">
            <button
              onClick={() => setOpenSidebar(false)}
              className="mb-4 text-red-400"
            >
              ❌ Close
            </button>

            <SidebarContent
              openProducts={openProducts}
              setOpenProducts={setOpenProducts}
              closeSidebar={() => setOpenSidebar(false)}
            />
          </div>

          {/* Overlay RIGHT */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setOpenSidebar(false)}
          />
        </div>
      )}

      {/* Page Content */}
      <div className="pt-14 p-3">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;