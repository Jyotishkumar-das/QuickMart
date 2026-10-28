import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import ProductCard from "./components/ProductCard";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import TrackOrder from "./pages/TrackOrder";
import Cart from "./pages/Cart";
import { useCart } from "./context/CartContext";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import OrderDetails from "./pages/OrderDetails";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import DeliveryPartners from "./pages/admin/DeliveryPartners";
import { logout } from "./utils/auth";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const categoryImages = {
  "Fruits & Vegetables":
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500",
  "Dairy & Breakfast":
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500",
  "Snacks & Munchies":
    "https://images.unsplash.com/photo-1621939514649-280e2aa9f2e4?w=500",
  Beverages:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500",
  Staples:
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500",
  "Personal Care":
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500",
  "Household Care":
    "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500",
  "Baby Care":
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500",
  "Bakery & Biscuits":
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
  "Meat & Seafood":
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500",
};

const Home = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const handleLogout = () => {
    logout(navigate, "/login");
    setUser(null);
  };

  const { cartCount } = useCart();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);

      if (!response.ok) {
        throw new Error("Unable to load categories");
      }

      const data = await response.json();
      setCategories(
        Array.isArray(data)
          ? data
          : data.categories || data.data || []
      );
    } catch (err) {
      console.error("Category error:", err);
    }
  }, []);

  const fetchProducts = useCallback(async (category = "all", search = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (category !== "all") {
        params.set("category", category);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();
      const url = `${API_URL}/products${query ? `?${query}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Unable to load products. Please try again.");
      }

      const data = await response.json();
      setProducts(
        Array.isArray(data)
          ? data
          : data.products || data.data || []
      );
    } catch (err) {
      console.error("Product error:", err);
      setError(err.message || "Unable to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery("");
    fetchProducts(categoryId);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    fetchProducts(selectedCategory, value);
  };

  const isFiltered = selectedCategory !== "all" || searchQuery.trim() !== "";
  const featuredProducts = products.slice(0, 8);

  const scrollToProducts = () => {
    document.getElementById("all-products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8faf7] text-gray-800">
      {/* Announcement bar */}
      <div className="bg-green-800 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
        Fresh groceries delivered to your doorstep 🚚
      </div>

      {/* Main navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-4 sm:px-6 lg:px-10">
          <Link to="/" className="shrink-0">
            <span className="text-2xl font-extrabold tracking-tight text-green-700 sm:text-3xl">
              🛒 QuickMart
            </span>
          </Link>

          <div className="hidden shrink-0 lg:block">
            <p className="text-xs text-gray-500">Deliver to</p>
            <p className="text-sm font-bold text-gray-800">
              📍 Your Location
            </p>
          </div>

          <div className="relative ml-auto flex-1 lg:ml-4">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search fruits, vegetables, groceries..."
              aria-label="Search products"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
            />
          </div>

          <Link
            to="/orders"
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold hover:bg-green-50 hover:text-green-700 sm:block"
          >
            My Orders
          </Link>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-green-50 hover:text-green-700"
            >
              Login
            </Link>
          )}

          <Link
            to="/cart"
            className="relative shrink-0 rounded-xl bg-green-700 px-3 py-3 text-sm font-bold text-white transition hover:bg-green-800 sm:px-5"
          >
            🛒 <span className="hidden sm:inline">Cart</span>
            <span className="ml-1">({cartCount})</span>
          </Link>
        </div>

        {/* Category navigation */}
        <div className="border-t border-gray-100">
          <div className="mx-auto flex max-w-[1440px] gap-6 overflow-x-auto px-4 py-3 text-sm sm:px-6 lg:px-10">
            <button
              onClick={() => handleCategoryClick("all")}
              className={`shrink-0 font-semibold ${selectedCategory === "all"
                ? "text-green-700"
                : "text-gray-600 hover:text-green-700"
                }`}
            >
              All Products
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryClick(category._id)}
                className={`shrink-0 font-medium transition ${selectedCategory === category._id
                  ? "text-green-700"
                  : "text-gray-600 hover:text-green-700"
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Hero banner */}
        {!isFiltered && (
          <section className="py-6 sm:py-9">
            <div className="relative isolate overflow-hidden rounded-3xl bg-green-50">
              <div className="absolute inset-y-0 right-0 -z-10 w-full bg-gradient-to-r from-green-50 via-green-50/95 to-transparent sm:w-3/4" />

              <div className="grid min-h-[360px] items-center sm:min-h-[400px] lg:grid-cols-2">
                <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
                  <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-800 shadow-sm sm:text-sm">
                    🌿 Freshness at your doorstep
                  </span>

                  <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                    Fresh groceries,
                    <span className="block text-green-700">
                      happier living.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-lg text-sm leading-7 text-gray-600 sm:text-base">
                    Shop your everyday essentials, fresh produce and
                    pantry favourites—all in one place with QuickMart.
                  </p>

                  <button
                    onClick={scrollToProducts}
                    className="mt-7 rounded-xl bg-green-700 px-7 py-3.5 font-bold text-white shadow-lg shadow-green-900/10 transition hover:-translate-y-0.5 hover:bg-green-800"
                  >
                    Shop Now <span className="ml-2">→</span>
                  </button>

                  <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-gray-600 sm:text-sm">
                    <span>✓ Everyday essentials</span>
                    <span>✓ Easy ordering</span>
                    <span>✓ Order tracking</span>
                  </div>
                </div>

                <div className="relative hidden h-full min-h-[400px] lg:block">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1100&auto=format&fit=crop"
                    alt="Fresh fruits and vegetables"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50 via-green-50/20 to-transparent" />
                  <div className="absolute bottom-8 right-8 rounded-2xl bg-white/95 p-4 shadow-xl">
                    <p className="text-sm font-bold text-gray-900">
                      Fresh picks, every day
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Your daily shopping made simple
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Benefits strip */}
        {!isFiltered && (
          <section className="grid grid-cols-2 gap-3 pb-8 md:grid-cols-4">
            {[
              ["🥬", "Fresh Products", "Everyday essentials"],
              ["🚚", "Easy Delivery", "Track your order"],
              ["🛒", "Easy Shopping", "Simple cart and checkout"],
              ["🔒", "Secure Access", "OTP-based login"],
            ].map(([icon, title, subtitle]) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4"
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">{title}</p>
                  <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Category cards */}
        {!isFiltered && (
          <section className="pb-10">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                  Explore the store
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  Shop by Category
                </h2>
              </div>
              <span className="text-sm text-gray-500">
                {categories.length} categories
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => {
                    handleCategoryClick(category._id);
                    scrollToProducts();
                  }}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
                >
                  <div className="h-28 overflow-hidden bg-green-50 sm:h-36">
                    <img
                      src={
                        categoryImages[category.name] ||
                        category.image ||
                        "https://placehold.co/400x300/f0fdf4/166534?text=QuickMart"
                      }
                      alt={category.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://placehold.co/400x300/f0fdf4/166534?text=QuickMart";
                      }}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex min-h-16 items-center justify-between gap-2 p-3">
                    <span className="text-sm font-bold text-gray-800">
                      {category.name}
                    </span>
                    <span className="text-green-700 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Featured products */}
        {!isFiltered && !loading && !error && featuredProducts.length > 0 && (
          <section className="pb-10">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                  Customer favourites
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  Popular Picks
                </h2>
              </div>

              <button
                onClick={scrollToProducts}
                className="text-sm font-bold text-green-700 hover:text-green-900"
              >
                View all products →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={`featured-${product._id}`} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* All products */}
        <section id="all-products" className="scroll-mt-40 pb-14">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                {isFiltered ? "Your selection" : "Everything you need"}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : selectedCategory !== "all"
                    ? categories.find((c) => c._id === selectedCategory)?.name ||
                    "Category Products"
                    : "All Products"}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {loading
                  ? "Loading products..."
                  : `${products.length} products available`}
              </p>
            </div>

            {isFiltered && (
              <button
                onClick={() => handleCategoryClick("all")}
                className="self-start rounded-lg border border-green-200 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-50 sm:self-auto"
              >
                Clear filters ✕
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
              <p className="font-bold">Could not load products</p>
              <p className="mt-1">{error}</p>
              <button
                onClick={() => fetchProducts(selectedCategory, searchQuery)}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white p-3"
                >
                  <div className="h-36 rounded-xl bg-gray-100 sm:h-44" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-gray-100" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-gray-100" />
                  <div className="mt-4 h-10 rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-5 py-16 text-center">
              <div className="text-5xl">🛍️</div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">
                No products found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Try another search or browse all categories.
              </p>
              <button
                onClick={() => handleCategoryClick("all")}
                className="mt-5 rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800"
              >
                View all products
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 text-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
          <div>
            <Link to="/" className="text-2xl font-extrabold text-green-400">
              🛒 QuickMart
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-gray-400">
              Your everyday grocery shopping, made simple and convenient.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Shop</h3>
            <button
              onClick={() => {
                handleCategoryClick("all");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-3 block text-sm text-gray-400 hover:text-white"
            >
              All Products
            </button>
          </div>

          <div>
            <h3 className="font-bold">Your Account</h3>
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 block text-sm text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="mt-3 block text-sm text-gray-400 hover:text-white"
              >
                Login
              </Link>
            )}
            <Link to="/orders" className="mt-2 block text-sm text-gray-400 hover:text-white">
              My Orders
            </Link>
            <Link to="/cart" className="mt-2 block text-sm text-gray-400 hover:text-white">
              Shopping Cart
            </Link>
          </div>

          <div>
            <h3 className="font-bold">QuickMart</h3>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Fresh picks. Easy shopping. Convenient delivery.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 px-4 py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} QuickMart. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

const App = () => (
  <Routes>
    {/* Home and role-specific login pages */}
    <Route path="/" element={<Home />} />

    <Route
      path="/login"
      element={<Login expectedRole="customer" />}
    />

    <Route
      path="/admin-login"
      element={<Login expectedRole="admin" />}
    />

    <Route
      path="/delivery-login"
      element={<Login expectedRole="delivery" />}
    />

    {/* Customer pages */}
    <Route path="/orders" element={<Orders />} />
    <Route path="/my-orders" element={<Orders />} />
    <Route path="/orders/:id" element={<OrderDetails />} />
    <Route path="/track-order/:id" element={<TrackOrder />} />
    <Route path="/cart" element={<Cart />} />

    {/* Admin pages */}
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/orders" element={<AdminOrders />} />
    <Route path="/admin/products" element={<AdminProducts />} />
    <Route path="/admin/categories" element={<AdminCategories />} />
    <Route
      path="/admin/delivery-partners"
      element={<DeliveryPartners />}
    />

    {/* Delivery partner page */}
    <Route
      path="/delivery-dashboard"
      element={<DeliveryDashboard />}
    />

    {/* Fallback */}
    <Route path="*" element={<Home />} />
  </Routes>
);

export default App;