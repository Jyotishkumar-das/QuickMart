import React, { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";

import ProductCard from "./components/ProductCard";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import TrackOrder from "./pages/TrackOrder";
import Cart from "./pages/Cart";
import { useCart } from "./context/CartContext";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
const API_URL = "http://localhost:5000/api";

const Home = () => {
  const { cartCount } = useCart();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      const categoryList = Array.isArray(data)
        ? data
        : data.categories || data.data || [];

      setCategories(categoryList);
    } catch (err) {
      console.error("Category Error:", err);
      setError("Unable to load categories.");
    }
  };

  // Fetch products with search and category filters
  const fetchProducts = async (category = "all", search = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (category && category !== "all") {
        params.set("category", category);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const queryString = params.toString();
      const url = `${API_URL}/products${queryString ? `?${queryString}` : ""
        }`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to fetch products"
        );
      }

      const data = await response.json();

      setProducts(
        Array.isArray(data)
          ? data
          : data.products || data.data || []
      );
    } catch (err) {
      console.error("Product Error:", err);
      setError(err.message || "Unable to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Search products
  const handleSearch = (value) => {
    setSearchQuery(value);
    fetchProducts(selectedCategory, value);
  };

  // Select category
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery("");
    fetchProducts(categoryId);
  };

  // Initial data loading
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0">
            <h1 className="text-xl font-bold text-green-600 sm:text-2xl">
              🛒 QuickMart
            </h1>
          </Link>

          <div className="hidden lg:block">
            <p className="text-xs text-gray-500">Deliver to</p>
            <p className="font-semibold text-gray-800">
              📍 Your Location
            </p>
          </div>

          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for products..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <Link
            to="/orders"
            className="rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100"
          >
            Orders
          </Link>

          <Link
            to="/login"
            className="hidden rounded-lg px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 sm:block"
          >
            Login
          </Link>

          <Link
            to="/cart"
            className="whitespace-nowrap rounded-lg bg-green-600 px-3 py-2 font-medium text-white hover:bg-green-700 sm:px-4"
          >
            🛒 <span className="hidden sm:inline">Cart</span>
            <span className="ml-1">({cartCount})</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-green-100 px-6 py-12 sm:px-10 lg:px-16">
          <div className="max-w-2xl">
            <p className="mb-3 font-semibold text-green-600">
              QUICK DELIVERY ⚡
            </p>

            <h2 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
              Groceries delivered fast
            </h2>

            <p className="mt-4 text-base text-gray-600 sm:text-lg">
              Fresh groceries and daily essentials delivered to your
              doorstep in minutes.
            </p>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-6 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Shop Now
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Shop by Category
          </h2>

          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => handleCategoryClick("all")}
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              View All
            </button>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3">
          <button
            type="button"
            onClick={() => handleCategoryClick("all")}
            className={`min-w-28 rounded-xl p-4 shadow-sm transition ${selectedCategory === "all"
              ? "bg-green-600 text-white"
              : "bg-white hover:shadow-md"
              }`}
          >
            <div className="text-3xl">🛒</div>
            <p className="mt-2 text-sm font-medium">All</p>
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
              className={`min-w-36 rounded-xl p-4 shadow-sm transition ${selectedCategory === category._id
                ? "bg-green-600 text-white"
                : "bg-white hover:shadow-md"
                }`}
            >
              <div className="text-3xl">🛍️</div>
              <p className="mt-2 text-sm font-medium">
                {category.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : selectedCategory === "all"
                ? "Popular Products"
                : "Products"}
          </h2>

          {!loading && (
            <p className="shrink-0 text-sm text-gray-500">
              {products.length} products
            </p>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {loading && (
          <div className="py-10 text-center">
            <p className="text-gray-500">Loading products...</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="py-10 text-center">
            <div className="text-5xl">😕</div>
            <p className="mt-3 text-gray-500">
              No products found.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

// Application routes
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/track-order/:id" element={<TrackOrder />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
    </Routes>
  );
};

export default App;