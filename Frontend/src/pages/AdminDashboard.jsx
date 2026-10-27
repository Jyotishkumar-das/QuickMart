import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://quickmart-api-b27r.onrender.com/api";

const AdminDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const loadDashboard = async () => {
        setLoading(true);
        setError("");

        try {
            const [ordersRes, partnersRes] = await Promise.all([
                axios.get(`${API}/orders`, { headers }),
                axios.get(`${API}/delivery-partners`, { headers }),
            ]);

            const orderData = ordersRes.data;
            const partnerData = partnersRes.data;

            setOrders(
                Array.isArray(orderData)
                    ? orderData
                    : orderData.orders || orderData.data || []
            );

            setPartners(
                Array.isArray(partnerData)
                    ? partnerData
                    : partnerData.deliveryPartners ||
                    partnerData.partners ||
                    partnerData.data ||
                    []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Dashboard load hela nahi. Admin token check kara."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const updateStatus = async (orderId, status) => {
        setMessage("");
        setError("");

        try {
            await axios.put(
                `${API}/orders/${orderId}/status`,
                { status },
                { headers }
            );

            setMessage("Order status update hela.");
            await loadDashboard();
        } catch (err) {
            setError(
                err.response?.data?.message || "Status update hela nahi."
            );
        }
    };

    const assignPartner = async (orderId, deliveryPartnerId) => {
        if (!deliveryPartnerId) return;

        setMessage("");
        setError("");

        try {
            await axios.put(
                `${API}/orders/${orderId}/assign-delivery`,
                { deliveryPartnerId },
                { headers }
            );

            setMessage("Delivery partner assign hela.");
            await loadDashboard();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Delivery partner assign hela nahi."
            );
        }
    };

    if (!token) {
        return (
            <main className="admin-dashboard">
                <h2>Admin Login Required</h2>
                <p>Admin account re login kari puni dashboard khola.</p>
            </main>
        );
    }

    return (
        <main className="admin-dashboard">
            <h1>QuickMart Admin Dashboard</h1>
            <p>Manage orders and delivery partners.</p>

            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {loading ? (
                <p>Loading dashboard...</p>
            ) : (
                <>
                    <section>
                        <h2>Orders ({orders.length})</h2>

                        {orders.length === 0 ? (
                            <p>No orders found.</p>
                        ) : (
                            orders.map((order) => {
                                const orderId = order._id || order.id;
                                const items = order.items || [];

                                return (
                                    <article
                                        key={orderId}
                                        style={{
                                            border: "1px solid #ddd",
                                            borderRadius: "8px",
                                            padding: "16px",
                                            marginBottom: "16px",
                                        }}
                                    >
                                        <h3>Order #{orderId}</h3>

                                        <p>
                                            <strong>Customer:</strong>{" "}
                                            {order.user?.name ||
                                                order.shippingAddress?.name ||
                                                "Customer"}
                                        </p>

                                        <p>
                                            <strong>Phone:</strong>{" "}
                                            {order.shippingAddress?.phone || "N/A"}
                                        </p>

                                        <p>
                                            <strong>Total:</strong> ₹{order.totalAmount ?? 0}
                                        </p>

                                        <p>
                                            <strong>Payment:</strong>{" "}
                                            {order.paymentMethod || "N/A"} —{" "}
                                            {order.paymentStatus || "Pending"}
                                        </p>

                                        <p>
                                            <strong>Status:</strong>{" "}
                                            {order.orderStatus || order.status || "Unknown"}
                                        </p>

                                        <p>
                                            <strong>Items:</strong>{" "}
                                            {items
                                                .map(
                                                    (item) =>
                                                        `${item.product?.name || item.name || "Product"} x ${item.quantity
                                                        }`
                                                )
                                                .join(", ") || "No item details"}
                                        </p>

                                        <label>
                                            Update status:{" "}
                                            <select
                                                value={order.orderStatus || order.status || "Confirmed"}
                                                onChange={(e) =>
                                                    updateStatus(orderId, e.target.value)
                                                }
                                            >
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="Preparing">Preparing</option>
                                                <option value="Out for Delivery">
                                                    Out for Delivery
                                                </option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </label>

                                        <div style={{ marginTop: "12px" }}>
                                            <label>
                                                Assign delivery partner:{" "}
                                                <select
                                                    value={
                                                        order.deliveryPartner?._id ||
                                                        order.deliveryPartner ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        assignPartner(orderId, e.target.value)
                                                    }
                                                >
                                                    <option value="">Select partner</option>

                                                    {partners.map((partner) => (
                                                        <option
                                                            key={partner._id}
                                                            value={partner._id}
                                                        >
                                                            {partner.name ||
                                                                partner.user?.name ||
                                                                partner.phone ||
                                                                partner._id}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </section>
                </>
            )}
        </main>
    );
};

export default AdminDashboard;
