import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

const DeliveryDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [latitude, setLatitude] = useState("20.3000");
    const [longitude, setLongitude] = useState("85.8300");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [updatingOrder, setUpdatingOrder] = useState("");

    const token = localStorage.getItem("token");

    const headers = {
        Authorization: `Bearer ${token}`,
    };

    // Load orders assigned to the logged-in delivery partner
    const loadOrders = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setError("Delivery partner login required.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.get(
                `${API}/delivery/assigned-orders`,
                { headers }
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
                "Orders load hela nahi. Delivery role and backend API check kara."
            );
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // Update delivery partner's current location
    const updateLocation = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const lat = Number(latitude);
        const lng = Number(longitude);

        if (
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

        try {
            await axios.put(
                `${API}/delivery-partners/my-location`,
                {
                    latitude: lat,
                    longitude: lng,
                },
                { headers }
            );

            setMessage("Delivery location updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Location update hela nahi. Delivery role and API check kara."
            );
        }
    };

    // Update order status using the delivery routes
    const updateStatus = async (orderId, status) => {
        setError("");
        setMessage("");
        setUpdatingOrder(orderId);

        try {
            await axios.put(
                `${API}/delivery/orders/${orderId}/status`,
                { status },
                { headers }
            );

            setMessage(`Order status updated to ${status}.`);
            await loadOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Status update hela nahi. Backend status rules check kara."
            );
        } finally {
            setUpdatingOrder("");
        }
    };

    if (!token) {
        return (
            <main style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
                <h2>Delivery Partner Login Required</h2>
                <p>Please log in with an authorized delivery partner account.</p>
            </main>
        );
    }

    return (
        <main
            style={{
                maxWidth: 900,
                margin: "30px auto",
                padding: 20,
                fontFamily: "Arial, sans-serif",
            }}
        >
            <h1>QuickMart Delivery Dashboard</h1>
            <p>Manage assigned orders and update your delivery location.</p>

            {message && (
                <p role="status" style={{ color: "green" }}>
                    {message}
                </p>
            )}

            {error && (
                <p role="alert" style={{ color: "red" }}>
                    {error}
                </p>
            )}

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 24,
                }}
            >
                <h2>Update My Location</h2>

                <form onSubmit={updateLocation}>
                    <label style={{ display: "block", marginBottom: 12 }}>
                        Latitude
                        <input
                            type="number"
                            step="any"
                            min="-90"
                            max="90"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                boxSizing: "border-box",
                                padding: 10,
                                marginTop: 6,
                            }}
                        />
                    </label>

                    <label style={{ display: "block", marginBottom: 16 }}>
                        Longitude
                        <input
                            type="number"
                            step="any"
                            min="-180"
                            max="180"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            required
                            style={{
                                display: "block",
                                width: "100%",
                                boxSizing: "border-box",
                                padding: 10,
                                marginTop: 6,
                            }}
                        />
                    </label>

                    <button type="submit">Update Location</button>
                </form>

                <p style={{ color: "#666", fontSize: 13 }}>
                    Demo coordinates are prefilled. Use the partner's actual
                    location when testing real delivery tracking.
                </p>
            </section>

            <section>
                <h2>My Assigned Orders ({orders.length})</h2>

                <button
                    type="button"
                    onClick={loadOrders}
                    disabled={loading}
                    style={{ marginBottom: 16 }}
                >
                    {loading ? "Loading..." : "Refresh Orders"}
                </button>

                {loading ? (
                    <p>Loading assigned orders...</p>
                ) : orders.length === 0 ? (
                    <p>No assigned orders found.</p>
                ) : (
                    orders.map((order) => {
                        const orderId = order._id || order.id;
                        const address = order.shippingAddress || {};
                        const status = order.orderStatus || order.status;

                        return (
                            <article
                                key={orderId}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 10,
                                    padding: 18,
                                    marginBottom: 16,
                                }}
                            >
                                <h3>Order #{orderId}</h3>

                                <p>
                                    <strong>Customer:</strong>{" "}
                                    {address.name || "Customer"}
                                </p>

                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {address.phone || "N/A"}
                                </p>

                                <p>
                                    <strong>Address:</strong>{" "}
                                    {[
                                        address.addressLine,
                                        address.city,
                                        address.state,
                                        address.pincode,
                                    ]
                                        .filter(Boolean)
                                        .join(", ") || "Address not available"}
                                </p>

                                <p>
                                    <strong>Total:</strong>{" "}
                                    ₹{order.totalAmount ?? 0}
                                </p>

                                <p>
                                    <strong>Payment:</strong>{" "}
                                    {order.paymentMethod || "N/A"} —{" "}
                                    {order.paymentStatus || "Pending"}
                                </p>

                                <p>
                                    <strong>Status:</strong>{" "}
                                    {status || "Unknown"}
                                </p>

                                {status === "Out for Delivery" && (
                                    <button
                                        type="button"
                                        disabled={updatingOrder === orderId}
                                        onClick={() =>
                                            updateStatus(orderId, "Delivered")
                                        }
                                    >
                                        {updatingOrder === orderId
                                            ? "Updating..."
                                            : "Mark as Delivered"}
                                    </button>
                                )}
                            </article>
                        );
                    })
                )}
            </section>
        </main>
    );
};

export default DeliveryDashboard;
