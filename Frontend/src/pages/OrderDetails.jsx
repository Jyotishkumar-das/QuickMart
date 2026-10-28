
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./OrderDetails.css";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const money = (value) =>
    `₹${Number(value ?? 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const getStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
        case "delivered":
        case "paid":
            return "od-status-green";
        case "cancelled":
        case "failed":
            return "od-status-red";
        case "out for delivery":
            return "od-status-blue";
        case "refunded":
            return "od-status-purple";
        case "preparing":
            return "od-status-orange";
        default:
            return "od-status-yellow";
    }
};

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchOrder = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await axios.get(`${API_URL}/orders/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (cancelled) return;

                const data = response.data;
                setOrder(data.order || data.data || data);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load order details."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (id) fetchOrder();

        return () => {
            cancelled = true;
        };
    }, [id, navigate]);

    if (loading) {
        return (
            <main className="od-page od-centered">
                <div className="od-loading-card">
                    <div className="od-spinner" />
                    <h2>Loading your order</h2>
                    <p>Please wait while we fetch your order details.</p>
                </div>
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="od-page od-centered">
                <div className="od-loading-card od-error-card">
                    <div className="od-empty-icon">!</div>
                    <h2>Order details unavailable</h2>
                    <p>{error || "Order not found."}</p>
                    <Link to="/orders" className="od-primary-btn">
                        ← Back to My Orders
                    </Link>
                </div>
            </main>
        );
    }

    const address = order.shippingAddress || {};
    const orderStatus = order.orderStatus || "Confirmed";
    const paymentStatus = order.paymentStatus || "Pending";
    const items = order.items || [];

    const formatDate = (value) => {
        if (!value) return "Unavailable";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "Unavailable"
            : date.toLocaleString("en-IN");
    };

    return (
        <main className="od-page">
            <div className="od-container">
                <Link to="/orders" className="od-back-link">
                    <span>←</span> Back to My Orders
                </Link>

                <header className="od-header">
                    <div className="od-header-title">
                        <div className="od-eyebrow">QUICKMART · ORDER INFORMATION</div>
                        <h1>Order Details</h1>
                        <p className="od-order-id">
                            Order ID: <span>{order._id}</span>
                        </p>
                        <p className="od-date">
                            Placed on {formatDate(order.createdAt)}
                        </p>
                    </div>

                    <div className="od-header-badges">
                        <span className={`od-badge ${getStatusClass(orderStatus)}`}>
                            <span className="od-badge-dot" />
                            {orderStatus}
                        </span>
                        <span className={`od-badge ${getStatusClass(paymentStatus)}`}>
                            Payment: {paymentStatus}
                        </span>
                    </div>
                </header>

                <div className="od-layout">
                    <div className="od-main-column">
                        <section className="od-card">
                            <div className="od-card-heading">
                                <div className="od-heading-icon">▦</div>
                                <div>
                                    <h2>Ordered Products</h2>
                                    <p>{items.length} product{items.length === 1 ? "" : "s"} in this order</p>
                                </div>
                            </div>

                            {items.length === 0 ? (
                                <p className="od-muted">No product details available.</p>
                            ) : (
                                <div className="od-product-list">
                                    {items.map((item, index) => (
                                        <article
                                            className="od-product"
                                            key={item._id || `${order._id}-${index}`}
                                        >
                                            <img
                                                src={
                                                    item.image ||
                                                    "https://placehold.co/120x120?text=Product"
                                                }
                                                alt={item.name || "Product"}
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src =
                                                        "https://placehold.co/120x120?text=Product";
                                                }}
                                            />

                                            <div className="od-product-info">
                                                <h3>{item.name || "Product"}</h3>
                                                <p>{money(item.price)} / {item.unit || "item"}</p>
                                                <span>Quantity: {item.quantity ?? 0}</span>
                                            </div>

                                            <strong className="od-product-total">
                                                {money(item.subtotal)}
                                            </strong>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="od-card">
                            <div className="od-card-heading">
                                <div className="od-heading-icon od-icon-orange">⌖</div>
                                <div>
                                    <h2>Delivery Address</h2>
                                    <p>Where your order will be delivered</p>
                                </div>
                            </div>

                            <div className="od-address-box">
                                <div className="od-address-avatar">
                                    {(address.name || "?").trim().charAt(0).toUpperCase()}
                                </div>
                                <div className="od-address-details">
                                    <h3>{address.name || "Name unavailable"}</h3>
                                    <p className="od-phone">{address.phone || "Phone unavailable"}</p>
                                    <p className="od-address-text">
                                        {[
                                            address.addressLine,
                                            address.city,
                                            address.state,
                                            address.pincode,
                                        ]
                                            .filter(Boolean)
                                            .join(", ") || "Address unavailable"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="od-card">
                            <div className="od-card-heading">
                                <div className="od-heading-icon od-icon-blue">↗</div>
                                <div>
                                    <h2>Delivery Information</h2>
                                    <p>Current progress of your order</p>
                                </div>
                            </div>

                            <div className="od-delivery-status">
                                <span className="od-status-indicator" />
                                <div>
                                    <span>Current status</span>
                                    <strong>{orderStatus}</strong>
                                </div>
                            </div>

                            <div className="od-delivery-dates">
                                {order.estimatedDeliveryTime && (
                                    <div className="od-date-row">
                                        <span className="od-date-symbol">◷</span>
                                        <div>
                                            <span>Estimated delivery</span>
                                            <strong>{formatDate(order.estimatedDeliveryTime)}</strong>
                                        </div>
                                    </div>
                                )}

                                {order.deliveredAt && (
                                    <div className="od-date-row">
                                        <span className="od-date-symbol">✓</span>
                                        <div>
                                            <span>Delivered on</span>
                                            <strong>{formatDate(order.deliveredAt)}</strong>
                                        </div>
                                    </div>
                                )}

                                {order.cancelledAt && (
                                    <div className="od-date-row">
                                        <span className="od-date-symbol">×</span>
                                        <div>
                                            <span>Cancelled on</span>
                                            <strong>{formatDate(order.cancelledAt)}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {order.cancellationReason && (
                                <div className="od-cancellation">
                                    <strong>Cancellation reason</strong>
                                    <p>{order.cancellationReason}</p>
                                </div>
                            )}

                            {orderStatus.toLowerCase() !== "cancelled" && (
                                <Link
                                    to={`/track-order/${order._id}`}
                                    className="od-track-btn"
                                >
                                    <span>⌖</span> Track My Order <span>→</span>
                                </Link>
                            )}
                        </section>
                    </div>

                    <aside className="od-summary">
                        <div className="od-summary-heading">
                            <div className="od-heading-icon">₹</div>
                            <div>
                                <h2>Order Summary</h2>
                                <p>Payment and price breakdown</p>
                            </div>
                        </div>

                        <div className="od-summary-lines">
                            <div>
                                <span>Subtotal</span>
                                <strong>{money(order.subtotal)}</strong>
                            </div>
                            <div>
                                <span>Delivery Fee</span>
                                <strong>{money(order.deliveryFee)}</strong>
                            </div>
                            <div className="od-discount-line">
                                <span>Discount</span>
                                <strong>-{money(order.discount)}</strong>
                            </div>
                        </div>

                        <div className="od-total-row">
                            <span>Total Amount</span>
                            <strong>{money(order.totalAmount)}</strong>
                        </div>

                        <div className="od-payment-details">
                            <div>
                                <span>Payment Method</span>
                                <strong>{order.paymentMethod || "N/A"}</strong>
                            </div>
                            <div>
                                <span>Payment Status</span>
                                <strong
                                    className={`od-badge ${getStatusClass(paymentStatus)}`}
                                >
                                    {paymentStatus}
                                </strong>
                            </div>
                        </div>

                        <div className="od-summary-note">
                            <span>✓</span>
                            <p>Your order details are available here for reference.</p>
                        </div>

                        <Link to="/orders" className="od-secondary-btn">
                            View My Orders
                        </Link>
                    </aside>
                </div>

                <footer className="od-footer">
                    QuickMart · Fresh groceries, delivered with care.
                </footer>
            </div>
        </main>
    );
};

export default OrderDetails;
