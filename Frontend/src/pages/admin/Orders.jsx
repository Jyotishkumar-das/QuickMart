
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Orders.css";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const STATUS_OPTIONS = [
    "Confirmed",
    "Preparing",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
];

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [partnersLoading, setPartnersLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [updatingId, setUpdatingId] = useState("");
    const [assigningId, setAssigningId] = useState("");
    const [selectedPartners, setSelectedPartners] = useState({});
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");

    const getAuthConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    const fetchOrders = useCallback(async () => {
        if (!localStorage.getItem("token")) {
            setError("Please log in as an admin.");
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/orders`,
                getAuthConfig()
            );

            const data = response.data;
            const orderList = Array.isArray(data)
                ? data
                : data.orders || data.data || [];

            setOrders(orderList);

            const selections = {};
            orderList.forEach((order) => {
                const partner = order.deliveryPartner;
                if (partner) {
                    selections[order._id] =
                        typeof partner === "object" ? partner._id : partner;
                }
            });

            setSelectedPartners((previous) => ({
                ...selections,
                ...previous,
            }));
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load orders."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDeliveryPartners = useCallback(async () => {
        if (!localStorage.getItem("token")) {
            setPartnersLoading(false);
            return;
        }

        try {
            setPartnersLoading(true);

            const response = await axios.get(
                `${API_URL}/delivery-partners`,
                getAuthConfig()
            );

            const data = response.data;
            const partnerList = Array.isArray(data)
                ? data
                : data.deliveryPartners || data.data || [];

            setDeliveryPartners(
                partnerList.filter((partner) => partner.isActive !== false)
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load delivery partners. Check admin permissions."
            );
        } finally {
            setPartnersLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchDeliveryPartners();
    }, [fetchOrders, fetchDeliveryPartners]);

    const updateStatus = async (orderId, status) => {
        try {
            setUpdatingId(orderId);
            setError("");
            setSuccess("");

            await axios.put(
                `${API_URL}/orders/${orderId}/status`,
                { status },
                getAuthConfig()
            );

            setSuccess("Order status updated successfully.");
            await fetchOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update order status."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const assignDeliveryPartner = async (orderId) => {
        const deliveryPartnerId = selectedPartners[orderId];

        if (!deliveryPartnerId) {
            setError("Please select a delivery partner first.");
            return;
        }

        try {
            setAssigningId(orderId);
            setError("");
            setSuccess("");

            await axios.put(
                `${API_URL}/orders/${orderId}/assign-delivery`,
                { deliveryPartnerId },
                getAuthConfig()
            );

            setSuccess("Delivery partner assigned successfully.");
            await fetchOrders();
            await fetchDeliveryPartners();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to assign delivery partner. Check partner availability."
            );
        } finally {
            setAssigningId("");
        }
    };

    const getPartnerId = (order) => {
        const partner = order.deliveryPartner;
        if (!partner) return "";
        return typeof partner === "object" ? partner._id : partner;
    };

    const formatCurrency = (amount) =>
        `₹${Number(amount || 0).toLocaleString("en-IN")}`;

    const getStatusClass = (status) =>
        `orders-status-${String(status || "unknown")
            .toLowerCase()
            .replace(/\s+/g, "-")}`;

    const filteredOrders = useMemo(() => {
        const query = search.trim().toLowerCase();

        return orders.filter((order) => {
            const status = order.orderStatus || "Confirmed";
            const paymentStatus = order.paymentStatus || "Pending";
            const address = order.shippingAddress || {};
            const orderId = String(order._id || "").toLowerCase();
            const customer = String(
                address.name || order.user?.name || ""
            ).toLowerCase();
            const phone = String(
                address.phone || order.user?.phone || ""
            ).toLowerCase();

            const matchesSearch =
                !query ||
                orderId.includes(query) ||
                customer.includes(query) ||
                phone.includes(query);

            const matchesStatus =
                statusFilter === "All" || status === statusFilter;

            const matchesPayment =
                paymentFilter === "All" ||
                paymentStatus === paymentFilter;

            return matchesSearch && matchesStatus && matchesPayment;
        });
    }, [orders, search, statusFilter, paymentFilter]);

    const activeOrders = orders.filter(
        (order) =>
            !["Delivered", "Cancelled"].includes(order.orderStatus)
    ).length;

    const deliveredOrders = orders.filter(
        (order) => order.orderStatus === "Delivered"
    ).length;

    const paidOrders = orders.filter(
        (order) => order.paymentStatus === "Paid"
    ).length;

    return (
        <main className="orders-page">
            <header className="orders-topbar">
                <div className="orders-brand">
                    <span className="orders-brand-icon">🛒</span>
                    <div>
                        <strong>QuickMart</strong>
                        <span>ADMIN PANEL</span>
                    </div>
                </div>

                <Link to="/admin" className="orders-back-link">
                    <span>←</span> Dashboard
                </Link>
            </header>

            <div className="orders-content">
                <section className="orders-page-heading">
                    <div>
                        <span className="orders-eyebrow">
                            STORE MANAGEMENT / ORDERS
                        </span>
                        <h1>Order Management</h1>
                        <p>
                            Track orders, manage delivery status, and assign
                            delivery partners.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="orders-btn orders-btn-primary"
                        onClick={() => {
                            fetchOrders();
                            fetchDeliveryPartners();
                        }}
                        disabled={loading || partnersLoading}
                    >
                        <span>↻</span>
                        {loading || partnersLoading ? "Refreshing..." : "Refresh"}
                    </button>
                </section>

                {error && (
                    <div className="orders-alert orders-alert-error" role="alert">
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

                {success && (
                    <div
                        className="orders-alert orders-alert-success"
                        role="status"
                    >
                        <span>✓</span>
                        <p>{success}</p>
                        <button
                            type="button"
                            onClick={() => setSuccess("")}
                            aria-label="Dismiss message"
                        >
                            ×
                        </button>
                    </div>
                )}

                <section className="orders-stats">
                    <article className="orders-stat-card">
                        <div className="orders-stat-icon green">▤</div>
                        <div>
                            <span>Total Orders</span>
                            <strong>{loading ? "..." : orders.length}</strong>
                            <small>All loaded orders</small>
                        </div>
                    </article>

                    <article className="orders-stat-card">
                        <div className="orders-stat-icon orange">◷</div>
                        <div>
                            <span>In Progress</span>
                            <strong>{loading ? "..." : activeOrders}</strong>
                            <small>Not completed or cancelled</small>
                        </div>
                    </article>

                    <article className="orders-stat-card">
                        <div className="orders-stat-icon blue">✓</div>
                        <div>
                            <span>Delivered</span>
                            <strong>{loading ? "..." : deliveredOrders}</strong>
                            <small>Successfully delivered</small>
                        </div>
                    </article>

                    <article className="orders-stat-card">
                        <div className="orders-stat-icon purple">₹</div>
                        <div>
                            <span>Paid Orders</span>
                            <strong>{loading ? "..." : paidOrders}</strong>
                            <small>Payment marked as paid</small>
                        </div>
                    </article>
                </section>

                <section className="orders-list-panel">
                    <div className="orders-list-heading">
                        <div>
                            <h2>All Orders</h2>
                            <p>Search, filter, and manage customer orders.</p>
                        </div>
                        <span className="orders-count">
                            {filteredOrders.length} shown
                        </span>
                    </div>

                    <div className="orders-filters">
                        <label className="orders-search">
                            <span>⌕</span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search order ID, customer or phone..."
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </label>

                        <label className="orders-filter-field">
                            <span>Status</span>
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                            >
                                <option value="All">All statuses</option>
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="orders-filter-field">
                            <span>Payment</span>
                            <select
                                value={paymentFilter}
                                onChange={(event) =>
                                    setPaymentFilter(event.target.value)
                                }
                            >
                                <option value="All">All payments</option>
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Failed">Failed</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </label>
                    </div>

                    {loading ? (
                        <div className="orders-empty-state">
                            <div className="orders-spinner" />
                            <p>Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="orders-empty-state">
                            <span className="orders-empty-icon">📦</span>
                            <h3>
                                {orders.length
                                    ? "No matching orders"
                                    : "No orders found"}
                            </h3>
                            <p>
                                {orders.length
                                    ? "Try changing your search or filters."
                                    : "New customer orders will appear here."}
                            </p>
                            {(search ||
                                statusFilter !== "All" ||
                                paymentFilter !== "All") && (
                                    <button
                                        type="button"
                                        className="orders-btn orders-btn-light"
                                        onClick={() => {
                                            setSearch("");
                                            setStatusFilter("All");
                                            setPaymentFilter("All");
                                        }}
                                    >
                                        Clear filters
                                    </button>
                                )}
                        </div>
                    ) : (
                        <div className="orders-cards">
                            {filteredOrders.map((order) => {
                                const currentStatus =
                                    order.orderStatus || "Confirmed";
                                const isFinished = [
                                    "Delivered",
                                    "Cancelled",
                                ].includes(currentStatus);
                                const assignedPartnerId = getPartnerId(order);
                                const address = order.shippingAddress || {};
                                const orderId = order._id;

                                return (
                                    <article
                                        className="orders-card"
                                        key={orderId}
                                    >
                                        <div className="orders-card-header">
                                            <div>
                                                <span className="orders-card-label">
                                                    ORDER REFERENCE
                                                </span>
                                                <h3>
                                                    #{String(orderId).slice(-8)}
                                                </h3>
                                                <p>
                                                    {order.createdAt
                                                        ? new Date(
                                                            order.createdAt
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )
                                                        : "Date unavailable"}
                                                </p>
                                            </div>

                                            <span
                                                className={`orders-status-badge ${getStatusClass(
                                                    currentStatus
                                                )}`}
                                            >
                                                <span className="orders-status-dot" />
                                                {currentStatus}
                                            </span>
                                        </div>

                                        <div className="orders-card-details">
                                            <div className="orders-detail">
                                                <span className="orders-detail-icon">
                                                    ♙
                                                </span>
                                                <div>
                                                    <small>Customer</small>
                                                    <strong>
                                                        {address.name ||
                                                            order.user?.name ||
                                                            "Customer"}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="orders-detail">
                                                <span className="orders-detail-icon">
                                                    ☎
                                                </span>
                                                <div>
                                                    <small>Phone</small>
                                                    <strong>
                                                        {address.phone ||
                                                            order.user?.phone ||
                                                            "N/A"}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="orders-detail">
                                                <span className="orders-detail-icon">
                                                    ₹
                                                </span>
                                                <div>
                                                    <small>Total amount</small>
                                                    <strong className="orders-total">
                                                        {formatCurrency(
                                                            order.totalAmount
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="orders-detail">
                                                <span className="orders-detail-icon">
                                                    💳
                                                </span>
                                                <div>
                                                    <small>Payment</small>
                                                    <strong>
                                                        {order.paymentMethod ||
                                                            "N/A"}
                                                    </strong>
                                                    <span
                                                        className={`orders-payment-badge ${order.paymentStatus ===
                                                                "Paid"
                                                                ? "paid"
                                                                : "pending"
                                                            }`}
                                                    >
                                                        {order.paymentStatus ||
                                                            "Pending"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="orders-items">
                                            <h4>Order Items</h4>
                                            {(order.items || []).length ? (
                                                <ul>
                                                    {order.items.map(
                                                        (item, index) => (
                                                            <li
                                                                key={
                                                                    item._id ||
                                                                    `${orderId}-${index}`
                                                                }
                                                            >
                                                                <span>
                                                                    {item.name ||
                                                                        item
                                                                            .product
                                                                            ?.name ||
                                                                        "Product"}
                                                                    <small>
                                                                        {" "}
                                                                        ×{" "}
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                    </small>
                                                                </span>
                                                                <strong>
                                                                    {formatCurrency(
                                                                        item.subtotal ??
                                                                        Number(
                                                                            item.price ||
                                                                            0
                                                                        ) *
                                                                        Number(
                                                                            item.quantity ||
                                                                            0
                                                                        )
                                                                    )}
                                                                </strong>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="orders-muted">
                                                    Item details unavailable.
                                                </p>
                                            )}
                                        </div>

                                        <div className="orders-management-grid">
                                            <section className="orders-management-box">
                                                <h4>
                                                    <span>↻</span> Update Order
                                                    Status
                                                </h4>
                                                <p>
                                                    Choose the new status for
                                                    this order.
                                                </p>

                                                <label
                                                    className="orders-control-label"
                                                    htmlFor={`status-${orderId}`}
                                                >
                                                    Order status
                                                </label>

                                                <select
                                                    id={`status-${orderId}`}
                                                    value={currentStatus}
                                                    disabled={
                                                        updatingId === orderId ||
                                                        isFinished
                                                    }
                                                    onChange={(event) =>
                                                        updateStatus(
                                                            orderId,
                                                            event.target.value
                                                        )
                                                    }
                                                    className="orders-control"
                                                >
                                                    {STATUS_OPTIONS.map(
                                                        (status) => (
                                                            <option
                                                                key={status}
                                                                value={status}
                                                            >
                                                                {status}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                {updatingId === orderId && (
                                                    <span className="orders-inline-loading">
                                                        Updating...
                                                    </span>
                                                )}

                                                {isFinished && (
                                                    <small className="orders-muted">
                                                        Status changes are
                                                        disabled for finished
                                                        orders.
                                                    </small>
                                                )}
                                            </section>

                                            <section className="orders-management-box">
                                                <h4>
                                                    <span>🚚</span> Delivery
                                                    Partner
                                                </h4>
                                                <p>
                                                    {order.deliveryPartner?.name
                                                        ? `Assigned to ${order.deliveryPartner.name}`
                                                        : assignedPartnerId
                                                            ? "A delivery partner is assigned."
                                                            : "No delivery partner assigned yet."}
                                                </p>

                                                {!isFinished ? (
                                                    <>
                                                        <label
                                                            className="orders-control-label"
                                                            htmlFor={`partner-${orderId}`}
                                                        >
                                                            Select partner
                                                        </label>

                                                        <select
                                                            id={`partner-${orderId}`}
                                                            value={
                                                                selectedPartners[
                                                                orderId
                                                                ] || ""
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setSelectedPartners(
                                                                    (previous) => ({
                                                                        ...previous,
                                                                        [orderId]:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            disabled={
                                                                partnersLoading
                                                            }
                                                            className="orders-control"
                                                        >
                                                            <option value="">
                                                                {partnersLoading
                                                                    ? "Loading partners..."
                                                                    : "Select delivery partner"}
                                                            </option>

                                                            {deliveryPartners.map(
                                                                (partner) => (
                                                                    <option
                                                                        key={
                                                                            partner._id
                                                                        }
                                                                        value={
                                                                            partner._id
                                                                        }
                                                                    >
                                                                        {partner.name ||
                                                                            "Partner"}{" "}
                                                                        —{" "}
                                                                        {partner.phone ||
                                                                            "No phone"}{" "}
                                                                        (
                                                                        {partner.isAvailable
                                                                            ? "Available"
                                                                            : "Busy"}
                                                                        )
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>

                                                        <button
                                                            type="button"
                                                            className="orders-btn orders-btn-primary orders-assign-button"
                                                            disabled={
                                                                assigningId ===
                                                                orderId ||
                                                                partnersLoading ||
                                                                !selectedPartners[
                                                                orderId
                                                                ]
                                                            }
                                                            onClick={() =>
                                                                assignDeliveryPartner(
                                                                    orderId
                                                                )
                                                            }
                                                        >
                                                            {assigningId ===
                                                                orderId
                                                                ? "Assigning..."
                                                                : assignedPartnerId
                                                                    ? "Reassign Partner"
                                                                    : "Assign Partner"}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <p className="orders-muted">
                                                        Assignment is disabled
                                                        for completed or
                                                        cancelled orders.
                                                    </p>
                                                )}

                                                {!partnersLoading &&
                                                    deliveryPartners.length ===
                                                    0 && (
                                                        <p className="orders-no-partners">
                                                            No active delivery
                                                            partners found.
                                                        </p>
                                                    )}
                                            </section>
                                        </div>

                                        <div className="orders-card-footer">
                                            <span>
                                                Order ID:{" "}
                                                {String(orderId)}
                                            </span>
                                            <Link
                                                to={`/orders/${orderId}`}
                                                className="orders-details-link"
                                            >
                                                View order details →
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <footer className="orders-footer">
                    <span>🛒 QuickMart Admin</span>
                    <span>Order Management</span>
                </footer>
            </div>
        </main>
    );
};

export default Orders;
