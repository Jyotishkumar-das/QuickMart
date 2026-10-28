
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Categories.css";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const getHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(`${API_URL}/categories`);
            const data = response.data;

            const list = Array.isArray(data)
                ? data
                : data.categories || data.data || [];

            setCategories(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load categories."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const filteredCategories = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return categories;

        return categories.filter((category) => {
            return (
                (category.name || "").toLowerCase().includes(term) ||
                (category.description || "").toLowerCase().includes(term)
            );
        });
    }, [categories, search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!name.trim()) {
            setError("Please enter a category name.");
            return;
        }

        if (!localStorage.getItem("token")) {
            setError("Please log in as an admin.");
            return;
        }

        try {
            setSaving(true);

            const response = await axios.post(
                `${API_URL}/categories`,
                {
                    name: name.trim(),
                    description: description.trim(),
                },
                { headers: getHeaders() }
            );

            setMessage(
                response.data.message || "Category created successfully."
            );
            setName("");
            setDescription("");

            await fetchCategories();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create category. Check admin permissions and API."
            );
        } finally {
            setSaving(false);
        }
    };

    const getInitial = (categoryName) =>
        (categoryName || "?").trim().charAt(0).toUpperCase() || "?";

    const palette = [
        "category-green",
        "category-orange",
        "category-blue",
        "category-purple",
        "category-pink",
        "category-teal",
    ];

    return (
        <main className="categories-page">
            <div className="categories-container">
                <Link to="/admin" className="categories-back-link">
                    <span>←</span> Back to Dashboard
                </Link>

                <header className="categories-header">
                    <div>
                        <span className="categories-eyebrow">QUICKMART ADMIN</span>
                        <h1>Category Management</h1>
                        <p>Organize your grocery products into categories.</p>
                    </div>

                    <button
                        type="button"
                        className="categories-refresh-btn"
                        onClick={fetchCategories}
                        disabled={loading}
                    >
                        <span className={loading ? "categories-spinning" : ""}>↻</span>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </header>

                {error && (
                    <div className="categories-alert categories-alert-error">
                        <span>!</span>
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {message && (
                    <div className="categories-alert categories-alert-success">
                        <span>✓</span>
                        <p>{message}</p>
                        <button
                            type="button"
                            onClick={() => setMessage("")}
                            aria-label="Dismiss message"
                        >
                            ×
                        </button>
                    </div>
                )}

                <section className="categories-overview">
                    <div className="categories-overview-icon">▦</div>
                    <div>
                        <p>Total Categories</p>
                        <h2>{categories.length}</h2>
                        <span>Categories in your catalog</span>
                    </div>
                    <div className="categories-overview-decoration">Q</div>
                </section>

                <div className="categories-layout">
                    <section className="categories-form-panel">
                        <div className="categories-section-heading">
                            <div className="categories-heading-icon">＋</div>
                            <div>
                                <h2>Add New Category</h2>
                                <p>Create a category for your products.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="categories-form">
                            <div className="categories-field">
                                <label htmlFor="categoryName">Category Name</label>
                                <input
                                    id="categoryName"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Fruits & Vegetables"
                                    maxLength={100}
                                    required
                                />
                                <span>Choose a clear, easy-to-understand name.</span>
                            </div>

                            <div className="categories-field">
                                <label htmlFor="categoryDescription">
                                    Description <span>(Optional)</span>
                                </label>
                                <textarea
                                    id="categoryDescription"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the products in this category..."
                                    rows={5}
                                    maxLength={500}
                                />
                                <span>Help customers understand this category.</span>
                            </div>

                            <button
                                type="submit"
                                className="categories-submit-btn"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="categories-spinning">↻</span>
                                        Creating...
                                    </>
                                ) : (
                                    <>＋ Create Category</>
                                )}
                            </button>
                        </form>
                    </section>

                    <section className="categories-list-panel">
                        <div className="categories-list-heading">
                            <div>
                                <h2>All Categories</h2>
                                <p>Browse your existing categories.</p>
                            </div>
                            <span className="categories-count">
                                {filteredCategories.length}
                            </span>
                        </div>

                        <label className="categories-search">
                            <span>⌕</span>
                            <input
                                type="search"
                                placeholder="Search categories..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>

                        {loading ? (
                            <div className="categories-state">
                                <div className="categories-loader" />
                                <h3>Loading categories...</h3>
                                <p>Please wait while your categories load.</p>
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="categories-state">
                                <div className="categories-empty-icon">▦</div>
                                <h3>
                                    {categories.length === 0
                                        ? "No categories yet"
                                        : "No matching categories"}
                                </h3>
                                <p>
                                    {categories.length === 0
                                        ? "Create your first category using the form."
                                        : "Try another search term."}
                                </p>
                                {search && (
                                    <button
                                        type="button"
                                        className="categories-clear-btn"
                                        onClick={() => setSearch("")}
                                    >
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="categories-grid">
                                {filteredCategories.map((category, index) => (
                                    <article
                                        key={category._id}
                                        className="category-card"
                                    >
                                        <div className="category-card-top">
                                            <div
                                                className={`category-avatar ${palette[index % palette.length]
                                                    }`}
                                            >
                                                {getInitial(category.name)}
                                            </div>
                                            <span className="category-number">
                                                #{String(index + 1).padStart(2, "0")}
                                            </span>
                                        </div>

                                        <h3>{category.name}</h3>

                                        <p className="category-description">
                                            {category.description ||
                                                "No description available."}
                                        </p>

                                        <div className="category-card-footer">
                                            <span className="category-created-label">
                                                <span className="category-status-dot" />
                                                Category
                                            </span>
                                            <span className="category-card-arrow">↗</span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        {!loading && filteredCategories.length > 0 && (
                            <div className="categories-list-footer">
                                Showing {filteredCategories.length} of {categories.length}{" "}
                                categories
                            </div>
                        )}
                    </section>
                </div>

                <footer className="categories-footer">
                    QuickMart Admin Panel · Category Management
                </footer>
            </div>
        </main>
    );
};

export default Categories;
