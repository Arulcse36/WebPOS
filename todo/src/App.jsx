import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Todo from "./pages/Todo";
import Dashboard from "./pages/Dashboard";
import Category from "./pages/Category";
import Brand from "./pages/Brand";
import Uom from "./pages/Uom";
import Product from "./pages/Product";
import POS from "./pages/POS";
import Customer from "./pages/Customer";


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="todo" element={<Todo />} />
          <Route path="products/category" element={<Category />} />
          <Route path="products/brand" element={<Brand />} />
          <Route path="products/uom" element={<Uom />} />
          <Route path="products/product" element={<Product />} />
          <Route path="pos" element={<POS />} />
          <Route path="customer" element={<Customer />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;