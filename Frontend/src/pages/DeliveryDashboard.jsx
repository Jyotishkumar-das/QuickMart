
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";
import "./DeliveryDashboard.css";

const API = "https://quickmart-api-b27r.onrender.com/api";
const SOCKET_URL = "https://quickmart-api-b27r.onrender.com";

const DeliveryDashboard = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [latitude, setLatitude] = useState("20.3000");
    const [longitude, setLongitude] = useState("85.8300");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [updatingOrder, setUpdatingOrder] = useState("");
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [socketStatus, setSocketStatus] = useState("Connecting");

    const token = localStorage.getItem("token");

    const handleLogout = () => {
        logout(navigate, "/delivery-login");
    };

    const authHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const loadOrders = useCallback(async () => {
        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            setLoading(false);
            setError("Delivery partner login required.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API}/delivery/assigned-orders`,
                { headers: { Authorization: `Bearer ${currentToken}` } }
            );

            const data = response.data;
            setOrders(
                Array.isArray(data)
                    ? data
                    : data.orders || data.assignedOrders || data.data || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load assigned orders."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    useEffect(() => {
        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            setSocketStatus("Login required");
            return;
        }

        const socket = io(SOCKET_URL, {
            auth: { token: currentToken },
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => setSocketStatus("Connected"));
        socket.on("connect_error", (err) => {
            setSocketStatus("Connection failed");
            console.error("Tracking socket error:", err.message);
        });
        socket.on("disconnect", () => setSocketStatus("Disconnected"));

        socket.on("locationUpdateSuccess", (data) => {
            if (data?.success) {
                setMessage("Live location updated successfully.");
                setError("");
            }
        });

        socket.on("locationError", (data) => {
            setError(data?.message || "Live location update failed.");
        });

        return () => socket.disconnect();
    }, []);

    const updateLocation = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const lat = Number(latitude);
        const lng = Number(longitude);
        const currentToken = localStorage.getItem("token");

        if (
            latitude.trim() === "" ||
            longitude.trim() === "" ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            setError("Please enter valid latitude and longitude.");
            return;
        }

        if (!currentToken) {
            setError("Delivery partner login required.");
            return;
        }

        try {
            setUpdatingLocation(true);

            const response = await axios.put(
                `${API}/delivery/location`,
                { latitude: lat, longitude: lng },
                { headers: { Authorization: `Bearer ${currentToken}` } }
            );

            setMessage(
                response.data?.message ||
                "Delivery location saved successfully."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Location update failed. Check the delivery API."
            );
        } finally {
            setUpdatingLocation(false);
        }
    };

    const updateStatus = async (orderId, status) => {
        setError("");
        setMessage("");
        setUpdatingOrder(orderId);

        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            setError("Delivery partner login required.");
            setUpdatingOrder("");
            return;
        }

        try {
            await axios.put(
                `${API}/delivery/orders/${orderId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${currentToken}` } }
            );

            setMessage(`Order status updated to ${status}.`);
            await loadOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Status update failed. Check backend status rules."
            );
        } finally {
            setUpdatingOrder("");
        }
    };

    const confirmCODPayment = async (orderId) => {
        const confirmed = window.confirm(
            "Have you actually received the full COD cash from the customer?"
        );

        if (!confirmed) return;

        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            setError("Delivery partner login required.");
            return;
        }

        setError("");
        setMessage("");
        setUpdatingOrder(orderId);

        try {
            const response = await axios.put(
                `${API}/delivery/orders/${orderId}/confirm-cod-payment`,
                {},
                { headers: { Authorization: `Bearer ${currentToken}` } }
            );

            setMessage(
                response.data?.message || "COD payment confirmed."
            );
            await loadOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to confirm COD payment."
            );
        } finally {
            setUpdatingOrder("");
        }
    };

    const formatCurrency = (amount) =>
        `₹${Number(amount || 0).toLocaleString("en-IN")}`;

    const getStatusClass = (status) => {
        const value = String(status || "").toLowerCase();

        if (value === "delivered") return "delivery-status-delivered";
        if (value === "cancelled") return "delivery-status-cancelled";
        if (value === "out for delivery") return "delivery-status-transit";
        if (value === "preparing") return "delivery-status-preparing";

        return "delivery-status-confirmed";
    };

    if (!token) {
        return (
            <main className="delivery-login-required">
                <div className="delivery-login-card">
                    <span className="delivery-empty-icon">🔐</span>
                    <h2>Delivery Partner Login Required</h2>
                    <p>Please log in with an authorized delivery partner account.</p>
                    <button
                        type="button"
                        className="delivery-btn delivery-btn-primary"
                        onClick={() =>
                            navigate("/delivery-login", { replace: true })
                        }
                    >
                        Go to Login
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="delivery-app">
            <aside className="delivery-sidebar">
                <a className="delivery-brand" href="/delivery-dashboard">
                    <span className="delivery-brand-icon">🛒</span>
                    <span>
                        <strong>QuickMart</strong>
                        <small>DELIVERY PARTNER</small>
                    </span>
                </a>

                <div className="delivery-profile">
                    <div className="delivery-avatar">🚴</div>
                    <div>
                        <strong>Delivery Partner</strong>
                        <span>Partner dashboard</span>
                    </div>
                </div>

                <nav className="delivery-nav">
                    <a href="#overview" className="delivery-nav-link active">
                        <span>▦</span> Overview
                    </a>
                    <a href="#location" className="delivery-nav-link">
                        <span>⌖</span> My Location
                    </a>
                    <a href="#assigned-orders" className="delivery-nav-link">
                        <span>▤</span> Assigned Orders
                        <span className="delivery-nav-count">{orders.length}</span>
                    </a>
                </nav>

                <div className="delivery-sidebar-bottom">
                    <div className="delivery-help-card">
                        <span>💡</span>
                        <strong>Delivery tip</strong>
                        <p>Keep your location updated for accurate tracking.</p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="delivery-logout"
                    >
                        <span>↪</span> Logout
                    </button>
                </div>
            </aside>

            <section className="delivery-main" id="overview">
                <header className="delivery-topbar">
                    <div>
                        <span className="delivery-eyebrow">DELIVERY CENTER</span>
                        <h1>Delivery Dashboard</h1>
                        <p>Manage your deliveries and keep customers updated.</p>
                    </div>

                    <div className="delivery-topbar-right">
                        <div className="delivery-live-indicator">
                            <span
                                className={
                                    socketStatus === "Connected"
                                        ? "delivery-live-dot"
                                        : "delivery-live-dot offline"
                                }
                            />
                            <span>
                                {socketStatus === "Connected"
                                    ? "Live connection"
                                    : socketStatus}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={loadOrders}
                            disabled={loading}
                            className="delivery-btn delivery-btn-light"
                        >
                            ↻ Refresh
                        </button>
                    </div>
                </header>

                <div className="delivery-stats">
                    <article className="delivery-stat-card">
                        <div className="delivery-stat-icon green">▤</div>
                        <div>
                            <span>Assigned orders</span>
                            <strong>{orders.length}</strong>
                        </div>
                    </article>

                    <article className="delivery-stat-card">
                        <div className="delivery-stat-icon orange">⌁</div>
                        <div>
                            <span>In progress</span>
                            <strong>
                                {
                                    orders.filter((order) =>
                                        ["Confirmed", "Preparing", "Out for Delivery"].includes(
                                            order.orderStatus || order.status
                                        )
                                    ).length
                                }
                            </strong>
                        </div>
                    </article>

                    <article className="delivery-stat-card">
                        <div className="delivery-stat-icon blue">✓</div>
                        <div>
                            <span>Delivered</span>
                            <strong>
                                {
                                    orders.filter(
                                        (order) =>
                                            (order.orderStatus || order.status) ===
                                            "Delivered"
                                    ).length
                                }
                            </strong>
                        </div>
                    </article>
                </div>

                {message && (
                    <div className="delivery-alert success" role="status">
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

                {error && (
                    <div className="delivery-alert error" role="alert">
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

                <section className="delivery-panel" id="location">
                    <div className="delivery-panel-heading">
                        <div className="delivery-heading-icon">⌖</div>
                        <div>
                            <h2>Update My Location</h2>
                            <p>Share your current coordinates for live delivery tracking.</p>
                        </div>
                    </div>

                    <form className="delivery-location-form" onSubmit={updateLocation}>
                        <label className="delivery-field">
                            <span>Latitude</span>
                            <input
                                type="number"
                                step="any"
                                min="-90"
                                max="90"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="e.g. 20.3000"
                                required
                            />
                        </label>

                        <label className="delivery-field">
                            <span>Longitude</span>
                            <input
                                type="number"
                                step="any"
                                min="-180"
                                max="180"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="e.g. 85.8300"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={updatingLocation}
                            className="delivery-btn delivery-btn-primary location-submit"
                        >
                            {updatingLocation ? "Saving..." : "⌖ Update Location"}
                        </button>
                    </form>

                    <p className="delivery-location-note">
                        <span>ⓘ</span> Demo coordinates are prefilled. Replace them
                        with actual GPS coordinates for real tracking.
                    </p>
                </section>

                <section className="delivery-orders-section" id="assigned-orders">
                    <div className="delivery-section-heading">
                        <div>
                            <span className="delivery-eyebrow">YOUR WORKSPACE</span>
                            <h2>My Assigned Orders</h2>
                            <p>View order details and update delivery progress.</p>
                        </div>

                        <span className="delivery-order-count">
                            {orders.length} {orders.length === 1 ? "order" : "orders"}
                        </span>
                    </div>

                    {loading ? (
                        <div className="delivery-empty-state">
                            <div className="delivery-spinner" />
                            <p>Loading assigned orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="delivery-empty-state">
                            <span className="delivery-empty-icon">📦</span>
                            <h3>No assigned orders yet</h3>
                            <p>New delivery assignments will appear here.</p>
                            <button
                                type="button"
                                onClick={loadOrders}
                                className="delivery-btn delivery-btn-light"
                            >
                                Refresh Orders
                            </button>
                        </div>
                    ) : (
                        <div className="delivery-order-list">
                            {orders.map((order) => {
                                const orderId = order._id || order.id;
                                const address = order.shippingAddress || {};
                                const status = order.orderStatus || order.status;
                                const paymentMethod = String(
                                    order.paymentMethod || ""
                                ).toUpperCase();
                                const paymentStatus = String(
                                    order.paymentStatus || "Pending"
                                );
                                const busy = updatingOrder === orderId;

                                const canConfirmCOD =
                                    status === "Delivered" &&
                                    paymentMethod === "COD" &&
                                    paymentStatus === "Pending";

                                return (
                                    <article className="delivery-order-card" key={orderId}>
                                        <div className="delivery-order-card-top">
                                            <div>
                                                <span className="delivery-card-label">
                                                    ORDER REFERENCE
                                                </span>
                                                <h3>#{String(orderId).slice(-10)}</h3>
                                                <p className="delivery-order-full-id">
                                                    ID: {orderId}
                                                </p>
                                            </div>

                                            <span
                                                className={`delivery-status-badge ${getStatusClass(
                                                    status
                                                )}`}
                                            >
                                                <span className="delivery-status-dot" />
                                                {status || "Unknown"}
                                            </span>
                                        </div>

                                        <div className="delivery-order-details">
                                            <div className="delivery-detail">
                                                <span className="delivery-detail-icon">♙</span>
                                                <div>
                                                    <small>Customer</small>
                                                    <strong>{address.name || "Customer"}</strong>
                                                </div>
                                            </div>

                                            <div className="delivery-detail">
                                                <span className="delivery-detail-icon">☎</span>
                                                <div>
                                                    <small>Phone number</small>
                                                    <strong>{address.phone || "N/A"}</strong>
                                                </div>
                                            </div>

                                            <div className="delivery-detail address-detail">
                                                <span className="delivery-detail-icon">⌖</span>
                                                <div>
                                                    <small>Delivery address</small>
                                                    <strong>
                                                        {[
                                                            address.addressLine,
                                                            address.city,
                                                            address.state,
                                                            address.pincode,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(", ") ||
                                                            "Address not available"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="delivery-order-summary">
                                            <div>
                                                <span>Total amount</span>
                                                <strong>{formatCurrency(order.totalAmount)}</strong>
                                            </div>
                                            <div>
                                                <span>Payment method</span>
                                                <strong>{paymentMethod || "N/A"}</strong>
                                            </div>
                                            <div>
                                                <span>Payment status</span>
                                                <strong
                                                    className={
                                                        paymentStatus.toLowerCase() === "paid"
                                                            ? "payment-paid"
                                                            : "payment-pending"
                                                    }
                                                >
                                                    {paymentStatus}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="delivery-order-actions">
                                            {status === "Confirmed" && (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        updateStatus(orderId, "Preparing")
                                                    }
                                                    className="delivery-btn delivery-btn-blue"
                                                >
                                                    {busy ? "Updating..." : "✓ Accept Order"}
                                                </button>
                                            )}

                                            {status === "Preparing" && (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        updateStatus(
                                                            orderId,
                                                            "Out for Delivery"
                                                        )
                                                    }
                                                    className="delivery-btn delivery-btn-orange"
                                                >
                                                    {busy ? "Updating..." : "↗ Start Delivery"}
                                                </button>
                                            )}

                                            {status === "Out for Delivery" && (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        updateStatus(orderId, "Delivered")
                                                    }
                                                    className="delivery-btn delivery-btn-primary"
                                                >
                                                    {busy ? "Updating..." : "✓ Mark as Delivered"}
                                                </button>
                                            )}

                                            {canConfirmCOD && (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => confirmCODPayment(orderId)}
                                                    className="delivery-btn delivery-btn-purple"
                                                >
                                                    {busy
                                                        ? "Confirming..."
                                                        : "₹ Confirm COD Payment"}
                                                </button>
                                            )}

                                            {status === "Delivered" &&
                                                paymentMethod === "COD" &&
                                                paymentStatus === "Paid" && (
                                                    <span className="delivery-payment-confirmed">
                                                        ✓ COD payment received and confirmed
                                                    </span>
                                                )}

                                            {status === "Delivered" &&
                                                paymentMethod !== "COD" && (
                                                    <span className="delivery-payment-confirmed">
                                                        ✓ Delivery completed
                                                    </span>
                                                )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <footer className="delivery-footer">
                    <span>🛒 QuickMart Delivery</span>
                    <span>Delivering freshness, one order at a time.</span>
                </footer>
            </section>
        </main>
    );
};

export default DeliveryDashboard;
