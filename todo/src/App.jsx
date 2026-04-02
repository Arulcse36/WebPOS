import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Category from "./pages/Category";
import Brand from "./pages/Brand";
import Uom from "./pages/Uom";
import Product from "./pages/Product";
import POS from "./pages/POS";
import Customer from "./pages/Customer";
import Report from "./pages/Report";
import ItemsReport from './pages/ItemsReport';


const App = () => {
  return (
  <BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout />}>

      <Route index element={<Dashboard />} />
      <Route path="products/category" element={<Category />} />
      <Route path="products/brand" element={<Brand />} />
      <Route path="products/uom" element={<Uom />} />
      <Route path="products/product" element={<Product />} />

      <Route path="pos" element={<POS />} />
      <Route path="pos/edit/:id" element={<POS />} />  {/* ✅ FIXED */}

      <Route path="customer" element={<Customer />} />
      <Route path="reports" element={<Report />} />
      <Route path="/items-report" element={<ItemsReport />} />
      

    </Route>
  </Routes>
</BrowserRouter>
  );
};

export default App;