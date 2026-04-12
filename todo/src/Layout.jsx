import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

/**
 * Android PWA-compatible Layout
 *
 * Key changes from original:
 * 1. Safe area insets via env() — handles notch, status bar, gesture nav bar
 * 2. Touch targets ≥ 48px (Google Material / Android requirement)
 * 3. Removed tap highlight, added active:scale feedback instead
 * 4. overscroll-behavior: none — prevents pull-to-refresh & bounce on Android WebView
 * 5. touch-action: manipulation — removes 300ms click delay without needing FastClick
 * 6. Bottom padding accounts for Android gesture navigation bar
 * 7. Sidebar uses translateX animation (GPU-composited, no jank on Android)
 * 8. Will-change hints for animated elements
 * 9. Backdrop on overlay is pointer-events safe
 */

// ─── Inject global Android-safe styles once ──────────────────────────────────
const GLOBAL_STYLE = `
  :root {
    --sat: env(safe-area-inset-top, 0px);
    --sar: env(safe-area-inset-right, 0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left, 0px);
    --topbar-h: calc(52px + var(--sat));
  }

  * {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    box-sizing: border-box;
  }

  html, body {
    overscroll-behavior: none;
    overflow-x: hidden;
    height: 100%;
  }

  #root {
    min-height: 100%;
    min-height: 100dvh; /* dynamic viewport height — accounts for Android chrome bar */
  }
`;

function useGlobalStyle(css) {
  useEffect(() => {
    const el = document.createElement("style");
    el.innerHTML = css;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
}

// ─── Shared class helpers ─────────────────────────────────────────────────────
const menuItemClass = (isActive) =>
  [
    "flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium",
    "min-h-[48px] active:scale-[0.97] transition-all duration-150 select-none",
    isActive
      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
      : "text-slate-300 hover:bg-slate-700/70 active:bg-slate-700",
  ].join(" ");

const subItemClass = (isActive) =>
  [
    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium",
    "min-h-[44px] active:scale-[0.97] transition-all duration-150 select-none",
    isActive
      ? "bg-blue-600 text-white"
      : "text-slate-400 hover:bg-slate-700/60 active:bg-slate-700",
  ].join(" ");

const toggleBtnClass =
  "w-full text-left px-3 py-3 rounded-xl min-h-[48px] select-none " +
  "flex justify-between items-center text-[15px] font-medium text-slate-300 " +
  "hover:bg-slate-700/70 active:bg-slate-700 active:scale-[0.97] transition-all duration-150";

// ─── Collapsible menus ────────────────────────────────────────────────────────
const ReportsMenu = ({ open, toggle, onNavigate }) => (
  <div>
    <button onClick={toggle} className={toggleBtnClass}>
      <span className="flex items-center gap-3">📊 Reports</span>
      <span className="text-xs text-slate-500 transition-transform duration-200"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
    </button>

    <div
      className="overflow-hidden transition-all duration-200"
      style={{ maxHeight: open ? "300px" : "0px" }}
    >
      <div className="ml-4 mt-1 flex flex-col gap-1 pb-1">
        <NavLink to="/reports" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          🧾 Sales Report
        </NavLink>
        <NavLink to="/items-report" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          📦 Items Report
        </NavLink>
        <NavLink to="/payment-report" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          💳 Payment Report
        </NavLink>
      </div>
    </div>
  </div>
);

const ProductsMenu = ({ open, toggle, onNavigate, isSuperAdmin }) => (
  <div>
    <button onClick={toggle} className={toggleBtnClass}>
      <span className="flex items-center gap-3">📦 Products</span>
      <span className="text-xs text-slate-500 transition-transform duration-200"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
    </button>

    <div
      className="overflow-hidden transition-all duration-200"
      style={{ maxHeight: open ? "300px" : "0px" }}
    >
      <div className="ml-4 mt-1 flex flex-col gap-1 pb-1">
        <NavLink to="/products/category" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          🗂 Category
        </NavLink>
        <NavLink to="/products/brand" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          🏷 Brand
        </NavLink>
        {/* UOM - Only show for Super Admin */}
        {isSuperAdmin && (
          <NavLink to="/products/uom" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
            📐 UOM
          </NavLink>
        )}
        <NavLink to="/products/product" className={({ isActive }) => subItemClass(isActive)} onClick={onNavigate}>
          🛒 Product
        </NavLink>
      </div>
    </div>
  </div>
);

// ─── Sidebar content with conditional rendering ──────────────────────────────
const SidebarContent = ({ openProducts, setOpenProducts, openReports, setOpenReports, closeSidebar, isSuperAdmin, userRole }) => {
  const closeAll = () => {
    setOpenProducts(false);
    setOpenReports(false);
    closeSidebar();
  };

  return (
    <nav className="flex flex-col gap-1">
      {/* Company - Only show for Super Admin */}
      {isSuperAdmin && (
        <NavLink to="/company" className={({ isActive }) => menuItemClass(isActive)} onClick={closeAll}>
          🏢 Company
        </NavLink>
      )}

      <NavLink to="/" className={({ isActive }) => menuItemClass(isActive)} onClick={closeAll}>
        🏠 Dashboard
      </NavLink>

      <ProductsMenu
        open={openProducts}
        toggle={() => setOpenProducts((p) => !p)}
        onNavigate={closeSidebar}
        isSuperAdmin={isSuperAdmin}
      />

      <NavLink to="/customer" className={({ isActive }) => menuItemClass(isActive)} onClick={closeAll}>
        📝 Customer
      </NavLink>

      {/* Users - Show for Super Admin and Company Admin (not for regular company users) */}
      {(isSuperAdmin || userRole === 'admin') && (
        <NavLink to="/users" className={({ isActive }) => menuItemClass(isActive)} onClick={closeAll}>
          👥 Users
        </NavLink>
      )}

      <NavLink to="/pos" className={({ isActive }) => menuItemClass(isActive)} onClick={closeAll}>
        🧾 POS
      </NavLink>

      <ReportsMenu
        open={openReports}
        toggle={() => setOpenReports((p) => !p)}
        onNavigate={closeSidebar}
      />
    </nav>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const Layout = ({ onLogout, user, isSuperAdmin }) => {
  useGlobalStyle(GLOBAL_STYLE);

  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [openProducts, setOpenProducts] = useState(false);
  const [openReports, setOpenReports] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  
  // Get user role from localStorage or user object
  const userRole = localStorage.getItem("userType") || user?.role || "user";

  // Lock body scroll when sidebar is open (prevents background scroll on Android)
  useEffect(() => {
    document.body.style.overflow = openSidebar ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openSidebar]);

  const closeSidebar = () => setOpenSidebar(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-slate-900 text-white">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      {/* paddingTop accounts for Android status bar via safe-area-inset-top */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm
                   flex items-end justify-between px-4 pb-3 border-b border-slate-700/50"
        style={{
          paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
          paddingLeft: "calc(16px + env(safe-area-inset-left, 0px))",
          paddingRight: "calc(16px + env(safe-area-inset-right, 0px))",
        }}
      >
        {/* Hamburger — 48×48 touch target */}
        <button
          onClick={() => setOpenSidebar(true)}
          className="flex items-center justify-center w-12 h-12 -ml-2 rounded-xl
                     text-slate-300 hover:bg-slate-700 active:bg-slate-600
                     active:scale-95 transition-all duration-150"
          aria-label="Open menu"
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <rect width="22" height="2.5" rx="1.25" fill="currentColor"/>
            <rect y="6.75" width="16" height="2.5" rx="1.25" fill="currentColor"/>
            <rect y="13.5" width="22" height="2.5" rx="1.25" fill="currentColor"/>
          </svg>
        </button>

        <NavLink
          to="/"
          onClick={() => { setOpenProducts(false); setOpenReports(false); setOpenSidebar(false); }}
          className="font-bold text-lg tracking-wide active:opacity-70 transition-opacity"
        >
          Bill Mate 
        </NavLink>

        {/* Right side - User Info & Logout */}
        <div className="flex items-center gap-2">
          {/* User Info - Different for Super Admin vs Company Admin vs Company User */}
          {user && (
            <div className="hidden sm:block text-right mr-1">
              {isSuperAdmin ? (
                <>
                  <span className="text-sm text-purple-300">Super Admin</span>
                  <div className="text-xs text-purple-400">👑 {user.username}</div>
                </>
              ) : userRole === 'admin' ? (
                <>
                  <span className="text-sm text-slate-300">{user.companyName}</span>
                  <div className="text-xs text-slate-400">👨‍💼 Admin: {user.username}</div>
                </>
              ) : (
                <>
                  <span className="text-sm text-slate-300">{user.companyName}</span>
                  <div className="text-xs text-slate-400">👤 User: {user.name || user.username}</div>
                </>
              )}
            </div>
          )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-12 h-12 -mr-2 rounded-xl
                       text-slate-300 hover:bg-slate-700 active:bg-slate-600
                       active:scale-95 transition-all duration-150"
            aria-label="Logout"
            title="Logout"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 4L17 10L13 16M7 10H17M3 4H5V16H3V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Sidebar Drawer ───────────────────────────────────────────────── */}
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          opacity: openSidebar ? 1 : 0,
          pointerEvents: openSidebar ? "auto" : "none",
        }}
        aria-hidden={!openSidebar}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={closeSidebar}
        />

        {/* Drawer panel — translateX for GPU-composited animation (no jank on Android) */}
        <div
          className="absolute top-0 left-0 h-full bg-slate-800 flex flex-col
                     will-change-transform transition-transform duration-300 ease-out"
          style={{
            width: "min(80vw, 300px)",
            transform: openSidebar ? "translateX(0)" : "translateX(-100%)",
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Drawer header with user info */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/60">
            <div className="flex flex-col">
              <span className="font-bold text-base text-white">Menu</span>
              {user && (
                <span className="text-xs text-slate-400 mt-1">
                  {isSuperAdmin ? 'Super Admin' : user.companyName}
                </span>
              )}
            </div>
            <button
              onClick={closeSidebar}
              className="flex items-center justify-center w-10 h-10 rounded-xl
                         text-slate-400 hover:bg-slate-700 active:bg-slate-600
                         active:scale-95 transition-all duration-150"
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Nav items — scrollable if content overflows */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3">
            <SidebarContent
              openProducts={openProducts}
              setOpenProducts={setOpenProducts}
              openReports={openReports}
              setOpenReports={setOpenReports}
              closeSidebar={closeSidebar}
              isSuperAdmin={isSuperAdmin}
              userRole={userRole}
            />
          </div>
          
          {/* Footer in sidebar - optional */}
          <div className="p-4 border-t border-slate-700/60 text-xs text-slate-500">
            <p>Bill Mate POS System</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      {/* paddingTop = topbar height + status bar; paddingBottom = gesture nav bar */}
      <div
        className="p-3"
        style={{
          paddingTop: "calc(64px + env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          paddingLeft: "calc(12px + env(safe-area-inset-left, 0px))",
          paddingRight: "calc(12px + env(safe-area-inset-right, 0px))",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;