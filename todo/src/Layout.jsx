import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const Layout = () => {
  const [openProducts, setOpenProducts] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const location = useLocation();

  // Auto open Products submenu
  useEffect(() => {
    if (location.pathname.includes("products")) {
      setOpenProducts(true);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex bg-slate-900 text-white">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="w-60 bg-slate-800 p-4 hidden sm:block">

        <h2 className="text-xl font-bold mb-6">My App</h2>

        <nav className="flex flex-col gap-2">

          {/* Dashboard */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `p-2 rounded flex items-center gap-2 ${isActive ? "bg-blue-500" : "hover:bg-slate-700"
              }`
            }
          >
            🏠 Dashboard
          </NavLink>

          {/* PRODUCTS */}
          <div>
            <button
              onClick={() => setOpenProducts(!openProducts)}
              className="w-full text-left p-2 rounded hover:bg-slate-700 flex justify-between items-center"
            >
              <span className="flex items-center gap-2">
                📦 Products
              </span>
              <span>{openProducts ? "▲" : "▼"}</span>
            </button>

            {openProducts && (
              <div className="ml-4 mt-1 flex flex-col gap-1">

                <NavLink
                  to="/products/category"
                  className={({ isActive }) =>
                    `p-2 rounded text-sm ${isActive ? "bg-blue-500" : "hover:bg-slate-700"
                    }`
                  }
                >
                  🗂 Category
                </NavLink>

                <NavLink
                  to="/products/brand"
                  className={({ isActive }) =>
                    `p-2 rounded text-sm ${isActive ? "bg-blue-500" : "hover:bg-slate-700"
                    }`
                  }
                >
                  🏷 Brand
                </NavLink>


                 <NavLink
                  to="/products/uom"
                  className={({ isActive }) =>
                    `p-2 rounded text-sm ${isActive ? "bg-blue-500" : "hover:bg-slate-700"
                    }`
                  }
                >
                  🏷 UOM
                </NavLink>


                   <NavLink
                  to="/products/Product"
                  className={({ isActive }) =>
                    `p-2 rounded text-sm ${isActive ? "bg-blue-500" : "hover:bg-slate-700"
                    }`
                  }
                >
                  🏷 Product
                </NavLink>

              </div>
            )}
          </div>

       
             <NavLink
            to="/Customer"
            className={({ isActive }) =>
              `p-2 rounded flex items-center gap-2 ${isActive ? "bg-blue-500" : "hover:bg-slate-700"
              }`
            }
          >
            📝 Customer
          </NavLink>

          <NavLink to="/pos">🧾 POS</NavLink>

            <NavLink to="/reports">🧾 Report</NavLink>

        </nav>
      </div>

      {/* ================= MOBILE TOP BAR ================= */}
      <div className="sm:hidden fixed top-0 left-0 w-full bg-slate-800 p-3 flex justify-between items-center z-50">

        <button onClick={() => setOpenSidebar(true)}>
          ☰
        </button>

        <h2 className="font-bold">My App</h2>

      </div>

      {/* ================= MOBILE SIDEBAR ================= */}
      {openSidebar && (
        <div className="fixed inset-0 z-50 flex">

          {/* Overlay */}
          <div
            className="flex-1 bg-black/50"
            onClick={() => setOpenSidebar(false)}
          />

          {/* Sidebar */}
          <div className="w-60 bg-slate-800 p-4">

            <button
              onClick={() => setOpenSidebar(false)}
              className="mb-4"
            >
              ❌ Close
            </button>

            <nav className="flex flex-col gap-2">

              <NavLink to="/" onClick={() => setOpenSidebar(false)}>
                🏠 Dashboard
              </NavLink>

              {/* Products (mobile submenu) */}
              <button
                onClick={() => setOpenProducts(!openProducts)}
                className="text-left p-2 rounded hover:bg-slate-700 flex justify-between"
              >
                📦 Products
                <span>{openProducts ? "▲" : "▼"}</span>
              </button>

              {openProducts && (
                <div className="ml-4 flex flex-col gap-1">

                  <NavLink
                    to="/products/category"
                    onClick={() => setOpenSidebar(false)}
                  >
                    🗂 Category
                  </NavLink>

                  <NavLink
                    to="/products/brand"
                    onClick={() => setOpenSidebar(false)}
                  >
                    🏷 Brand
                  </NavLink>

                  <NavLink
                    to="/products/uom"
                    onClick={() => setOpenSidebar(false)}
                  >
                    🏷 UOM
                  </NavLink>


                   <NavLink
                    to="/products/product"
                    onClick={() => setOpenSidebar(false)}
                  >
                    🏷 Product
                  </NavLink>
                </div>
              )}

              <NavLink to="/todo" onClick={() => setOpenSidebar(false)}>
                📝 Todo
              </NavLink>


                 <NavLink to="/Customer" onClick={() => setOpenSidebar(false)}>
                📝 Customer
              </NavLink>


              
                 <NavLink to="/reports" onClick={() => setOpenSidebar(false)}>
                📝 Report
              </NavLink>

            </nav>
          </div>
        </div>
      )}

      {/* ================= PAGE CONTENT ================= */}
      <div className="flex-1 p-2 sm:p-6 mt-12 sm:mt-0 overflow-hidden">
        <Outlet />
      </div>

    </div>
  );
};

export default Layout;