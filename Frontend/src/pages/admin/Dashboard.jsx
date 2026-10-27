
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../utils/auth";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";

const Dashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    };

    const user = getUser();
    const isAdmin =
        Boolean(localStorage.getItem("token")) &&
        user?.role === "admin";

    const handleLogout = () => {
        logout(navigate, "/admin-login");
    };

    const fetchOrders = useCallback(async () => {
        const token = localStorage.getItem("token");

        let currentUser;
        try {
            currentUser = JSON.parse(
                localStorage.getItem("user") || "null"
            );
        } catch {
            currentUser = null;
        }

        if (!token || currentUser?.role !== "admin") {
            setError("Please log in as an admin.");
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(`${API_URL}/orders`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = response.data;
            const list = Array.isArray(data)
                ? data
                : data.orders || data.data || [];

            setOrders(list);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load orders. Please check the backend."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            setError("Please log in as an admin.");
            setOrders([]);
            setLoading(false);
            return;
        }

        fetchOrders();
    }, [isAdmin, fetchOrders]);

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(
        (order) => order.orderStatus === "Delivered"
    ).length;
    const pendingOrders = orders.filter(
        (order) =>
            !["Delivered", "Cancelled"].includes(order.orderStatus)
    ).length;

    const paidAmount = orders
        .filter((order) => order.paymentStatus === "Paid")
        .reduce(
            (sum, order) => sum + Number(order.totalAmount || 0),
            0
        );

    const cards = [
        {
            title: "Total Orders",
            value: loading ? "..." : totalOrders,
            description: "Orders received",
            icon: "📦",
            color: "green",
            path: "/admin/orders",
        },
        {
            title: "Products",
            value: "Manage",
            description: "Your grocery inventory",
            icon: "🛒",
            color: "blue",
            path: "/admin/products",
        },
        {
            title: "Categories",
            value: "Manage",
            description: "Organize your store",
            icon: "🗂️",
            color: "purple",
            path: "/admin/categories",
        },
        {
            title: "Delivery Partners",
            value: "Manage",
            description: "Manage your delivery team",
            icon: "🚚",
            color: "orange",
            path: "/admin/delivery-partners",
        },
    ];

    if (!isAdmin) {
        return (
            <main className="admin-login-required">
                <div className="admin-access-card">
                    <div className="admin-access-icon">🔐</div>
                    <h1>Admin Login Required</h1>
                    <p>
                        Please log in with an authorized QuickMart admin account
                        to access the dashboard.
                    </p>
                    <Link
                        to="/admin-login"
                        className="admin-btn admin-btn-primary"
                    >
                        Go to Admin Login →
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <Link to="/admin" className="admin-brand">
                    <span className="admin-brand-icon">🛒</span>
                    <span>
                        <strong>QuickMart</strong>
                        <small>ADMIN PANEL</small>
                    </span>
                </Link>

                <div className="admin-profile">
                    <div className="admin-avatar">👤</div>
                    <div>
                        <strong>{user?.name || "Administrator"}</strong>
                        <span>Store Administrator</span>
                    </div>
                </div>

                <p className="admin-nav-label">WORKSPACE</p>

                <nav className="admin-navigation">
                    <Link to="/admin" className="admin-nav-link active">
                        <span>▦</span> Dashboard
                    </Link>
                    <Link to="/admin/orders" className="admin-nav-link">
                        <span>📦</span> Orders
                    </Link>
                    <Link to="/admin/products" className="admin-nav-link">
                        <span>🛍️</span> Products
                    </Link>
                    <Link to="/admin/categories" className="admin-nav-link">
                        <span>🗂️</span> Categories
                    </Link>
                    <Link
                        to="/admin/delivery-partners"
                        className="admin-nav-link"
                    >
                        <span>🚚</span> Delivery Partners
                    </Link>
                </nav>

                <div className="admin-sidebar-bottom">
                    <div className="admin-help-card">
                        <span>🌿</span>
                        <strong>Freshness made easy</strong>
                        <p>Manage your QuickMart store in one place.</p>
                    </div>

                    <button
                        type="button"
                        className="admin-logout-sidebar"
                        onClick={handleLogout}
                    >
                        <span>↪</span> Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <span className="admin-eyebrow">
                            STORE MANAGEMENT
                        </span>
                        <h1>Dashboard Overview</h1>
                        <p>
                            Welcome back! Here is what is happening in your store.
                        </p>
                    </div>

                    <div className="admin-top-actions">
                        <span className="admin-date-badge">
                            🟢 Store Dashboard
                        </span>
                        <button
                            type="button"
                            onClick={fetchOrders}
                            disabled={loading}
                            className="admin-btn admin-btn-primary"
                        >
                            {loading ? "Refreshing..." : "↻ Refresh"}
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="admin-btn admin-btn-danger"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="admin-alert" role="alert">
                        <span>⚠️</span>
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={fetchOrders}
                            disabled={loading}
                        >
                            Retry
                        </button>
                    </div>
                )}

                <section className="admin-stats-grid">
                    {cards.map((card, index) => (
                        <Link
                            to={card.path}
                            key={card.path}
                            className={`admin-stat-card stat-${card.color}`}
                            style={{ animationDelay: `${index * 80}ms` }}
                        >
                            <div className="admin-stat-top">
                                <span className="admin-stat-icon">
                                    {card.icon}
                                </span>
                                <span className="admin-stat-arrow">↗</span>
                            </div>
                            <p>{card.title}</p>
                            <h2>{card.value}</h2>
                            <span className="admin-stat-description">
                                {card.description}
                            </span>
                            <span className="admin-stat-link">
                                Open page <span>→</span>
                            </span>
                        </Link>
                    ))}
                </section>

                <section className="admin-quick-overview">
                    <div className="admin-overview-heading">
                        <div>
                            <span className="admin-eyebrow">
                                ORDER PERFORMANCE
                            </span>
                            <h2>Order Overview</h2>
                        </div>
                        <Link
                            to="/admin/orders"
                            className="admin-btn admin-btn-light"
                        >
                            Manage Orders →
                        </Link>
                    </div>

                    <div className="admin-overview-grid">
                        <div className="admin-overview-item">
                            <span className="overview-icon green-bg">📋</span>
                            <div>
                                <p>Total Orders</p>
                                <strong>
                                    {loading ? "..." : totalOrders}
                                </strong>
                            </div>
                        </div>

                        <div className="admin-overview-item">
                            <span className="overview-icon orange-bg">⏳</span>
                            <div>
                                <p>In Progress</p>
                                <strong>
                                    {loading ? "..." : pendingOrders}
                                </strong>
                            </div>
                        </div>

                        <div className="admin-overview-item">
                            <span className="overview-icon blue-bg">✅</span>
                            <div>
                                <p>Delivered</p>
                                <strong>
                                    {loading ? "..." : deliveredOrders}
                                </strong>
                            </div>
                        </div>

                        <div className="admin-overview-item">
                            <span className="overview-icon purple-bg">₹</span>
                            <div>
                                <p>Paid Order Value</p>
                                <strong>
                                    {loading
                                        ? "..."
                                        : `₹${paidAmount.toLocaleString("en-IN")}`}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <p className="admin-data-note">
                        Summary values are calculated from the orders loaded
                        by this dashboard.
                    </p>
                </section>

                <section className="admin-recent-panel">
                    <div className="admin-overview-heading">
                        <div>
                            <span className="admin-eyebrow">
                                LATEST ACTIVITY
                            </span>
                            <h2>Recent Orders</h2>
                            <p>Review the latest orders placed in your store.</p>
                        </div>
                        <Link
                            to="/admin/orders"
                            className="admin-btn admin-btn-light"
                        >
                            View All Orders →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="admin-empty-state">
                            <div className="admin-spinner" />
                            <p>Loading your orders...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-empty-state">
                            <span className="admin-empty-icon">⚠️</span>
                            <p>Orders could not be loaded.</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="admin-empty-state">
                            <span className="admin-empty-icon">📦</span>
                            <h3>No orders yet</h3>
                            <p>New customer orders will appear here.</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-orders-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.slice(0, 10).map((order) => (
                                        <tr key={order._id}>
                                            <td>
                                                <span className="admin-order-id">
                                                    #{String(order._id || "").slice(-8)}
                                                </span>
                                            </td>
                                            <td className="admin-total-cell">
                                                ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                                            </td>
                                            <td>
                                                <span
                                                    className={`admin-payment-badge ${order.paymentStatus === "Paid"
                                                            ? "payment-success"
                                                            : "payment-pending"
                                                        }`}
                                                >
                                                    {order.paymentStatus || "Pending"}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={`admin-order-status status-${String(
                                                        order.orderStatus || "unknown"
                                                    )
                                                        .toLowerCase()
                                                        .replace(/\s+/g, "-")}`}
                                                >
                                                    {order.orderStatus || "Unknown"}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/orders/${order._id}`}
                                                    className="admin-view-link"
                                                >
                                                    View details →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <footer className="admin-footer">
                    <span>🛒 QuickMart Admin</span>
                    <span>Freshness. Convenience. Better shopping.</span>
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;
