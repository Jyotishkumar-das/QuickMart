// Orders.jsx
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Orders.css";

const API_URL = "http://localhost:5000/api";

const orderStatusClass = (status = "") => {
    switch (status.toLowerCase()) {
        case "delivered":
            return "qm-status delivered";
        case "cancelled":
            return "qm-status cancelled";
        case "out for delivery":
            return "qm-status delivery";
        case "confirmed":
        case "preparing":
        case "processing":
            return "qm-status progress";
        default:
            return "qm-status pending";
    }
};

const paymentStatusClass = (status = "") => {
    switch (status.toLowerCase()) {
        case "paid":
            return "qm-payment paid";
        case "failed":
            return "qm-payment failed";
        case "refunded":
            return "qm-payment refunded";
        default:
            return "qm-payment pending";
    }
};

const money = (value) =>
    `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

const dateText = (value) => {
    if (!value || Number.isNaN(Date.parse(value))) {
        return "Date unavailable";
    }

    return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [cancellingOrderId, setCancellingOrderId] = useState(null);

    const navigate = useNavigate();

    const fetchOrders = useCallback(async (isRefresh = false) => {
        const token = localStorage.getItem("token");

        if (!token) {
            setOrders([]);
            setError("Please log in to view your orders.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await axios.get(
                `${API_URL}/orders/my-orders`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;

            setOrders(
                Array.isArray(data)
                    ? data
                    : data.orders || data.data || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load orders. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleCancelOrder = async (orderId) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed) return;

        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please log in to cancel your order.");
            return;
        }

        try {
            setCancellingOrderId(orderId);
            setError("");

            const response = await axios.put(
                `${API_URL}/orders/${orderId}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setOrders((current) =>
                current.map((order) =>
                    order._id === orderId
                        ? {
                            ...order,
                            ...(response.data.order || {}),
                            orderStatus:
                                response.data.order?.orderStatus ||
                                "Cancelled",
                        }
                        : order
                )
            );

            window.alert("Order cancelled successfully!");
        } catch (err) {
            window.alert(
                err.response?.data?.message ||
                "Unable to cancel order. Please try again."
            );
        } finally {
            setCancellingOrderId(null);
        }
    };

    if (loading) {
        return (
            <main className="qm-orders-page">
                <div className="qm-state" role="status">
                    <span className="qm-spinner" />
                    Loading your orders...
                </div>
            </main>
        );
    }

    if (error && orders.length === 0) {
        return (
            <main className="qm-orders-page">
                <div className="qm-state qm-error-state">
                    <span className="qm-state-symbol">!</span>

                    <h1>We couldn't load your orders</h1>

                    <p role="alert">{error}</p>

                    <div className="qm-actions">
                        <button
                            className="qm-btn qm-btn-primary"
                            onClick={() => navigate("/login")}
                        >
                            Go to Login
                        </button>

                        <button
                            className="qm-btn qm-btn-outline"
                            onClick={() => fetchOrders()}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const activeCount = orders.filter(
        (order) =>
            !["cancelled", "delivered"].includes(
                (order.orderStatus || "").toLowerCase()
            )
    ).length;

    const deliveredCount = orders.filter(
        (order) =>
            (order.orderStatus || "").toLowerCase() === "delivered"
    ).length;

    return (
        <main className="qm-orders-page">
            <div className="qm-orders-container">
                <header className="qm-orders-header">
                    <div>
                        <span className="qm-eyebrow">
                            QUICKMART · YOUR ACCOUNT
                        </span>

                        <h1>My Orders</h1>

                        <p>
                            Track deliveries, review payments, and revisit your
                            purchases.
                        </p>
                    </div>

                    <div className="qm-header-actions">
                        <button
                            className="qm-btn qm-btn-outline"
                            onClick={() => fetchOrders(true)}
                            disabled={refreshing}
                        >
                            <span
                                className={
                                    refreshing
                                        ? "qm-refresh-icon spinning"
                                        : "qm-refresh-icon"
                                }
                            >
                                ↻
                            </span>

                            {refreshing ? "Refreshing..." : "Refresh Orders"}
                        </button>

                        <Link to="/" className="qm-btn qm-btn-primary">
                            Continue Shopping <span>→</span>
                        </Link>
                    </div>
                </header>

                {error && (
                    <div className="qm-inline-error" role="alert">
                        {error}
                    </div>
                )}

                <section className="qm-stats" aria-label="Order summary">
                    <div className="qm-stat-card">
                        <span className="qm-stat-icon">▤</span>
                        <div>
                            <span>Total orders</span>
                            <strong>{orders.length}</strong>
                        </div>
                    </div>

                    <div className="qm-stat-card">
                        <span className="qm-stat-icon warm">◷</span>
                        <div>
                            <span>Active orders</span>
                            <strong>{activeCount}</strong>
                        </div>
                    </div>

                    <div className="qm-stat-card">
                        <span className="qm-stat-icon blue">✓</span>
                        <div>
                            <span>Delivered</span>
                            <strong>{deliveredCount}</strong>
                        </div>
                    </div>
                </section>

                <div className="qm-section-heading">
                    <div>
                        <h2>Your order history</h2>
                        <p>
                            {orders.length === 1
                                ? "1 order"
                                : `${orders.length} orders`}{" "}
                            in your account
                        </p>
                    </div>

                    <span className="qm-count">
                        {orders.length} total
                    </span>
                </div>

                {orders.length === 0 ? (
                    <section className="qm-empty-state">
                        <div className="qm-empty-icon">🛍️</div>

                        <h2>No orders yet</h2>

                        <p>
                            Your purchases will appear here after you place an
                            order.
                        </p>

                        <Link to="/" className="qm-btn qm-btn-primary">
                            Start Shopping →
                        </Link>
                    </section>
                ) : (
                    <section
                        className="qm-orders-list"
                        aria-label="Your orders"
                    >
                        {orders.map((order) => {
                            const status = (
                                order.orderStatus || ""
                            ).toLowerCase();

                            const canCancel = ![
                                "cancelled",
                                "delivered",
                                "out for delivery",
                            ].includes(status);

                            const items = Array.isArray(order.items)
                                ? order.items
                                : [];

                            return (
                                <article
                                    className="qm-order-card"
                                    key={order._id}
                                >
                                    <div className="qm-order-card-header">
                                        <div className="qm-order-reference">
                                            <span className="qm-label">
                                                ORDER REFERENCE
                                            </span>

                                            <strong>
                                                #{order._id || "Unavailable"}
                                            </strong>

                                            <span className="qm-order-date">
                                                Ordered {dateText(order.createdAt)}
                                            </span>
                                        </div>

                                        <div className="qm-status-block">
                                            <span className="qm-label">
                                                ORDER STATUS
                                            </span>

                                            <span
                                                className={orderStatusClass(
                                                    order.orderStatus
                                                )}
                                            >
                                                <i />
                                                {order.orderStatus || "Processing"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="qm-items">
                                        {items.map((item, index) => {
                                            const product = item.product || {};

                                            const name =
                                                item.name || product.name || "Product";

                                            const image =
                                                item.image ||
                                                product.image ||
                                                "https://placehold.co/100x100?text=Product";

                                            return (
                                                <div
                                                    className="qm-item"
                                                    key={
                                                        item._id ||
                                                        `${order._id}-${index}`
                                                    }
                                                >
                                                    <img
                                                        src={image}
                                                        alt={name}
                                                        loading="lazy"
                                                        onError={(event) => {
                                                            event.currentTarget.onerror = null;
                                                            event.currentTarget.src =
                                                                "https://placehold.co/100x100?text=Product";
                                                        }}
                                                    />

                                                    <div className="qm-item-info">
                                                        <h3>{name}</h3>

                                                        <p>
                                                            {item.unit || "Item"}{" "}
                                                            <span>·</span> Qty:{" "}
                                                            {item.quantity ?? 0}
                                                        </p>
                                                    </div>

                                                    <strong className="qm-item-price">
                                                        {money(item.subtotal)}
                                                    </strong>
                                                </div>
                                            );
                                        })}

                                        {items.length === 0 && (
                                            <p className="qm-muted">
                                                No item details are available for this
                                                order.
                                            </p>
                                        )}
                                    </div>

                                    <div className="qm-order-details">
                                        <div className="qm-payment-details">
                                            <div className="qm-detail-group">
                                                <span className="qm-label">
                                                    PAYMENT METHOD
                                                </span>

                                                <strong>
                                                    {order.paymentMethod || "N/A"}
                                                </strong>
                                            </div>

                                            <div className="qm-detail-group">
                                                <span className="qm-label">
                                                    PAYMENT STATUS
                                                </span>

                                                <span
                                                    className={paymentStatusClass(
                                                        order.paymentStatus
                                                    )}
                                                >
                                                    {order.paymentStatus || "Pending"}
                                                </span>
                                            </div>

                                            {String(
                                                order.paymentMethod || ""
                                            ).toUpperCase() === "COD" &&
                                                String(
                                                    order.paymentStatus || ""
                                                ).toLowerCase() === "pending" && (
                                                    <p className="qm-cod-note">
                                                        Cash is due to the delivery partner.
                                                        Payment status updates after
                                                        confirmation.
                                                    </p>
                                                )}
                                        </div>

                                        <div className="qm-total-details">
                                            <span className="qm-label">
                                                TOTAL AMOUNT
                                            </span>

                                            <strong className="qm-total-amount">
                                                {money(order.totalAmount)}
                                            </strong>

                                            {order.deliveryPartner && (
                                                <p className="qm-partner">
                                                    🚚 Delivery partner:{" "}
                                                    <strong>
                                                        {order.deliveryPartner.name ||
                                                            "Assigned"}
                                                    </strong>
                                                </p>
                                            )}

                                            {order.deliveredAt && (
                                                <p className="qm-delivered-date">
                                                    Delivered {dateText(order.deliveredAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="qm-order-actions">
                                        <Link
                                            to={`/track-order/${order._id}`}
                                            className="qm-btn qm-btn-primary"
                                        >
                                            Track Order →
                                        </Link>

                                        {canCancel && (
                                            <button
                                                className="qm-btn qm-btn-danger"
                                                disabled={
                                                    cancellingOrderId === order._id
                                                }
                                                onClick={() =>
                                                    handleCancelOrder(order._id)
                                                }
                                            >
                                                {cancellingOrderId === order._id
                                                    ? "Cancelling..."
                                                    : "Cancel Order"}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}

                <footer className="qm-footer">
                    Need help with an order? Keep your order reference handy
                    when contacting support.
                </footer>
            </div>
        </main>
    );
}