
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Products.css";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [updatingId, setUpdatingId] = useState(null);

    const getToken = () => localStorage.getItem("token");

    const fetchProducts = useCallback(async () => {
        const token = getToken();

        if (!token) {
            setError("Please log in as an admin.");
            setProducts([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(`${API_URL}/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = response.data;
            const list = Array.isArray(data)
                ? data
                : data.products || data.data || [];

            setProducts(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load products."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const categories = useMemo(() => {
        return [
            ...new Set(
                products
                    .map((product) => product.category?.name || product.categoryName)
                    .filter(Boolean)
            ),
        ].sort((a, b) => a.localeCompare(b));
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const term = search.trim().toLowerCase();
            const name = (product.name || "").toLowerCase();
            const brand = (product.brand || "").toLowerCase();
            const category =
                product.category?.name || product.categoryName || "";

            const matchesSearch =
                !term ||
                name.includes(term) ||
                brand.includes(term) ||
                category.toLowerCase().includes(term);

            const matchesCategory =
                categoryFilter === "All" || category === categoryFilter;

            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Active" && product.isActive) ||
                (statusFilter === "Inactive" && !product.isActive);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [products, search, categoryFilter, statusFilter]);

    const activeCount = products.filter((p) => p.isActive).length;
    const inactiveCount = products.length - activeCount;
    const lowStockCount = products.filter(
        (p) => Number(p.stock ?? 0) <= 5
    ).length;

    const toggleProduct = async (product) => {
        const token = getToken();
        if (!token) {
            setError("Please log in as an admin.");
            return;
        }

        try {
            setUpdatingId(product._id);
            setError("");
            setMessage("");

            await axios.put(
                `${API_URL}/products/${product._id}`,
                { isActive: !product.isActive },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setProducts((current) =>
                current.map((item) =>
                    item._id === product._id
                        ? { ...item, isActive: !product.isActive }
                        : item
                )
            );

            setMessage(
                `${product.name} ${product.isActive ? "deactivated" : "activated"
                } successfully.`
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not update product. Check the backend update route."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <main className="products-page">
            <div className="products-container">
                <Link to="/admin" className="products-back-link">
                    <span>←</span> Back to Dashboard
                </Link>

                <header className="products-header">
                    <div>
                        <span className="products-eyebrow">QUICKMART ADMIN</span>
                        <h1>Products Management</h1>
                        <p>Manage your grocery inventory and product availability.</p>
                    </div>

                    <button
                        className="products-refresh-btn"
                        onClick={fetchProducts}
                        disabled={loading}
                    >
                        <span className={loading ? "products-spinning" : ""}>↻</span>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </header>

                {message && (
                    <div className="products-alert products-alert-success">
                        <span>✓</span> {message}
                        <button onClick={() => setMessage("")} aria-label="Dismiss">
                            ×
                        </button>
                    </div>
                )}

                {error && (
                    <div className="products-alert products-alert-error">
                        <span>!</span> {error}
                        <button onClick={() => setError("")} aria-label="Dismiss">
                            ×
                        </button>
                    </div>
                )}

                <section className="products-stats">
                    <article className="products-stat-card">
                        <div className="products-stat-icon products-icon-green">▦</div>
                        <div>
                            <p>Total Products</p>
                            <h2>{products.length}</h2>
                            <span>Products in inventory</span>
                        </div>
                    </article>

                    <article className="products-stat-card">
                        <div className="products-stat-icon products-icon-blue">✓</div>
                        <div>
                            <p>Active Products</p>
                            <h2>{activeCount}</h2>
                            <span>Currently available</span>
                        </div>
                    </article>

                    <article className="products-stat-card">
                        <div className="products-stat-icon products-icon-orange">◷</div>
                        <div>
                            <p>Inactive Products</p>
                            <h2>{inactiveCount}</h2>
                            <span>Currently unavailable</span>
                        </div>
                    </article>

                    <article className="products-stat-card">
                        <div className="products-stat-icon products-icon-red">!</div>
                        <div>
                            <p>Low Stock</p>
                            <h2>{lowStockCount}</h2>
                            <span>5 or fewer units</span>
                        </div>
                    </article>
                </section>

                <section className="products-panel">
                    <div className="products-panel-heading">
                        <div>
                            <h2>All Products</h2>
                            <p>Search and manage your product catalog.</p>
                        </div>
                        <span className="products-result-count">
                            {filteredProducts.length} products
                        </span>
                    </div>

                    <div className="products-filters">
                        <label className="products-search">
                            <span>⌕</span>
                            <input
                                type="search"
                                placeholder="Search product, brand, category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>

                        <select
                            aria-label="Filter by category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>

                        <select
                            aria-label="Filter by availability"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="products-state">
                            <div className="products-loader" />
                            <h3>Loading products...</h3>
                            <p>Please wait while your inventory loads.</p>
                        </div>
                    ) : error && products.length === 0 ? (
                        <div className="products-state">
                            <div className="products-state-icon">!</div>
                            <h3>Unable to load products</h3>
                            <p>{error}</p>
                            <button
                                className="products-primary-btn"
                                onClick={fetchProducts}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="products-state">
                            <div className="products-state-icon">⌕</div>
                            <h3>No products found</h3>
                            <p>Try another search term or change your filters.</p>
                            <button
                                className="products-secondary-btn"
                                onClick={() => {
                                    setSearch("");
                                    setCategoryFilter("All");
                                    setStatusFilter("All");
                                }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="products-table-wrap">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>PRODUCT</th>
                                        <th>CATEGORY</th>
                                        <th>PRICE</th>
                                        <th>STOCK</th>
                                        <th>STATUS</th>
                                        <th className="products-action-heading">ACTION</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredProducts.map((product) => {
                                        const stock = Number(product.stock ?? 0);
                                        const category =
                                            product.category?.name ||
                                            product.categoryName ||
                                            "Uncategorized";
                                        const price = Number(
                                            product.discountPrice ?? product.price ?? 0
                                        );
                                        const hasDiscount =
                                            product.discountPrice != null &&
                                            Number(product.discountPrice) < Number(product.price);

                                        return (
                                            <tr key={product._id}>
                                                <td>
                                                    <div className="products-product-cell">
                                                        {product.image ? (
                                                            <img
                                                                className="products-image"
                                                                src={product.image}
                                                                alt={product.name || "Product"}
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="products-image-placeholder">
                                                                ▧
                                                            </div>
                                                        )}

                                                        <div className="products-product-info">
                                                            <strong>{product.name || "Unnamed Product"}</strong>
                                                            <span>
                                                                {product.brand || "QuickMart Product"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="products-category-pill">
                                                        {category}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="products-price">
                                                        <strong>₹{price.toLocaleString("en-IN")}</strong>
                                                        {hasDiscount && (
                                                            <span>
                                                                ₹
                                                                {Number(product.price).toLocaleString("en-IN")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="products-stock">
                                                        <strong>{stock}</strong>
                                                        <span>{product.unit || "units"}</span>
                                                    </div>
                                                    {stock <= 5 && (
                                                        <span className="products-low-stock">
                                                            Low stock
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`products-status ${product.isActive
                                                            ? "products-status-active"
                                                            : "products-status-inactive"
                                                            }`}
                                                    >
                                                        <span />
                                                        {product.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <button
                                                        className={`products-toggle-btn ${product.isActive
                                                            ? "products-deactivate-btn"
                                                            : "products-activate-btn"
                                                            }`}
                                                        onClick={() => toggleProduct(product)}
                                                        disabled={updatingId === product._id}
                                                    >
                                                        {updatingId === product._id
                                                            ? "Updating..."
                                                            : product.isActive
                                                                ? "Deactivate"
                                                                : "Activate"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filteredProducts.length > 0 && (
                        <footer className="products-panel-footer">
                            Showing {filteredProducts.length} of {products.length} products
                        </footer>
                    )}
                </section>

                <footer className="products-page-footer">
                    QuickMart Admin Panel · Product Inventory
                </footer>
            </div>
        </main>
    );
};

export default Products;
