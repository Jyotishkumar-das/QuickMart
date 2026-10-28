import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [latitude, setLatitude] = useState("20.3000");
    const [longitude, setLongitude] = useState("85.8300");
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState("");

    const token = localStorage.getItem("token");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    // Fetch orders assigned to the logged-in delivery partner
    const fetchOrders = useCallback(async () => {
        if (!token) {
            setError("Please log in using your delivery partner account.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/delivery/assigned-orders`,
                authConfig
            );

            const data = response.data;
            const orderList = Array.isArray(data)
                ? data
                : data.orders || data.data || [];

            setOrders(orderList);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load assigned orders."
            );
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Update delivery partner's location
    const updateLocation = async (event) => {
        event.preventDefault();

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
            setError("Enter valid latitude and longitude.");
            return;
        }

        try {
            setUpdatingLocation(true);
            setError("");
            setSuccess("");

            await axios.put(
                `${API_URL}/delivery-partners/my-location`,
                {
                    latitude: lat,
                    longitude: lng,
                },
                authConfig
            );

            setSuccess("Location updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update location. Check your delivery account."
            );
        } finally {
            setUpdatingLocation(false);
        }
    };

    // Mark an assigned order as delivered
    const updateOrderStatus = async (orderId) => {
        try {
            setUpdatingOrderId(orderId);
            setError("");
            setSuccess("");

            await axios.put(
                `${API_URL}/orders/${orderId}/status`,
                { status: "Delivered" },
                authConfig
            );

            setSuccess("Order marked as delivered.");
            await fetchOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update order status."
            );
        } finally {
            setUpdatingOrderId("");
        }
    };

    return (
        <main className="min-h-screen bg-gray-100 p-5 sm:p-8">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-green-700">
                            QuickMart Delivery Dashboard
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Manage assigned orders and update your delivery
                            location.
                        </p>
                    </div>

                    <Link
                        to="/"
                        className="rounded-lg border border-green-700 px-4 py-2 text-green-700"
                    >
                        Home
                    </Link>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mt-5 rounded-lg bg-red-50 p-4 text-red-700"
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="mt-5 rounded-lg bg-green-50 p-4 text-green-700"
                    >
                        {success}
                    </div>
                )}

                <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold">
                        Update My Location
                    </h2>

                    <form
                        onSubmit={updateLocation}
                        className="mt-4 grid gap-4 sm:grid-cols-2"
                    >
                        <div>
                            <label
                                htmlFor="latitude"
                                className="mb-2 block font-medium"
                            >
                                Latitude
                            </label>
                            <input
                                id="latitude"
                                type="number"
                                step="any"
                                min="-90"
                                max="90"
                                value={latitude}
                                onChange={(event) =>
                                    setLatitude(event.target.value)
                                }
                                required
                                className="w-full rounded-lg border p-3"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="longitude"
                                className="mb-2 block font-medium"
                            >
                                Longitude
                            </label>
                            <input
                                id="longitude"
                                type="number"
                                step="any"
                                min="-180"
                                max="180"
                                value={longitude}
                                onChange={(event) =>
                                    setLongitude(event.target.value)
                                }
                                required
                                className="w-full rounded-lg border p-3"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                disabled={updatingLocation}
                                className="rounded-lg bg-green-700 px-5 py-3 text-white disabled:opacity-50"
                            >
                                {updatingLocation
                                    ? "Updating..."
                                    : "Update Location"}
                            </button>

                            <p className="mt-2 text-sm text-gray-500">
                                These are demo coordinates. Use actual GPS
                                coordinates for real tracking.
                            </p>
                        </div>
                    </form>
                </section>

                <section className="mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-bold">
                            My Assigned Orders ({orders.length})
                        </h2>

                        <button
                            type="button"
                            onClick={fetchOrders}
                            disabled={loading}
                            className="rounded-lg bg-green-700 px-4 py-2 text-white disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Refresh Orders"}
                        </button>
                    </div>

                    {loading ? (
                        <p className="mt-4">Loading assigned orders...</p>
                    ) : orders.length === 0 ? (
                        <p className="mt-4 rounded-lg bg-white p-5 text-gray-600">
                            No assigned orders found.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-4">
                            {orders.map((order) => (
                                <article
                                    key={order._id}
                                    className="rounded-xl bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-wrap justify-between gap-3">
                                        <h3 className="font-bold">
                                            Order #
                                            {String(order._id).slice(-8)}
                                        </h3>
                                        <span className="font-semibold">
                                            ₹{order.totalAmount ?? 0}
                                        </span>
                                    </div>

                                    <p className="mt-3">
                                        <strong>Customer:</strong>{" "}
                                        {order.shippingAddress?.name ||
                                            "Customer"}
                                    </p>

                                    <p className="mt-1">
                                        <strong>Phone:</strong>{" "}
                                        {order.shippingAddress?.phone || "N/A"}
                                    </p>

                                    <p className="mt-1">
                                        <strong>Status:</strong>{" "}
                                        {order.orderStatus || "Unknown"}
                                    </p>

                                    <p className="mt-1">
                                        <strong>Address:</strong>{" "}
                                        {[
                                            order.shippingAddress?.addressLine,
                                            order.shippingAddress?.city,
                                            order.shippingAddress?.state,
                                            order.shippingAddress?.pincode,
                                        ]
                                            .filter(Boolean)
                                            .join(", ") || "Not provided"}
                                    </p>

                                    <div className="mt-3">
                                        <strong>Items:</strong>
                                        {(order.items || []).map(
                                            (item, index) => (
                                                <p
                                                    key={item._id || index}
                                                    className="mt-1 text-gray-600"
                                                >
                                                    {item.name ||
                                                        item.product?.name ||
                                                        "Product"}
                                                    {" × "}
                                                    {item.quantity}
                                                </p>
                                            )
                                        )}
                                    </div>

                                    {order.orderStatus ===
                                        "Out for Delivery" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateOrderStatus(order._id)
                                                }
                                                disabled={
                                                    updatingOrderId === order._id
                                                }
                                                className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-white disabled:opacity-50"
                                            >
                                                {updatingOrderId === order._id
                                                    ? "Updating..."
                                                    : "Mark as Delivered"}
                                            </button>
                                        )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

export default Dashboard;