import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    setError("Please login to view your orders.");
                    setLoading(false);
                    return;
                }

                const response = await axios.get(
                    `${API_URL}/orders/my-orders`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setOrders(response.data.orders || []);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load orders. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-lg font-semibold">
                    Loading your orders...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="text-center">
                    <p className="mb-4 text-red-600">{error}</p>

                    <button
                        onClick={() => navigate("/login")}
                        className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-800">
                            My Orders
                        </h1>

                        <p className="text-gray-500">
                            Track your orders and payment status.
                        </p>
                    </div>

                    <Link
                        to="/"
                        className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700"
                    >
                        Continue Shopping
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-700">
                            No orders yet
                        </h2>

                        <p className="mt-2 text-gray-500">
                            Your orders will appear here after checkout.
                        </p>

                        <Link
                            to="/"
                            className="mt-5 inline-block rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div
                                key={order._id}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                            >
                                {/* Order header */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Order ID
                                        </p>

                                        <p className="break-all font-semibold text-gray-800">
                                            {order._id}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm text-gray-500">
                                            Order Status
                                        </p>

                                        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                            {order.orderStatus || "Processing"}
                                        </span>
                                    </div>
                                </div>

                                {/* Order items */}
                                <div className="space-y-4 p-5">
                                    {(order.items || []).map((item, index) => (
                                        <div
                                            key={
                                                item._id ||
                                                `${order._id}-${index}`
                                            }
                                            className="flex items-center gap-4"
                                        >
                                            <img
                                                src={
                                                    item.image ||
                                                    item.product?.image ||
                                                    "https://placehold.co/80x80?text=Product"
                                                }
                                                alt={
                                                    item.name ||
                                                    item.product?.name ||
                                                    "Product"
                                                }
                                                className="h-20 w-20 rounded-lg border object-cover"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-gray-800">
                                                    {item.name ||
                                                        item.product?.name ||
                                                        "Product"}
                                                </h3>

                                                <p className="text-sm text-gray-500">
                                                    {item.unit || "Item"} · Qty:{" "}
                                                    {item.quantity}
                                                </p>
                                            </div>

                                            <p className="font-semibold text-gray-800">
                                                ₹{item.subtotal ?? 0}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Payment and total */}
                                <div className="grid gap-4 border-t bg-gray-50 p-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Payment Method
                                        </p>

                                        <p className="font-medium">
                                            {order.paymentMethod || "N/A"}
                                        </p>

                                        <p className="mt-3 text-sm text-gray-500">
                                            Payment Status
                                        </p>

                                        <span
                                            className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${order.paymentStatus === "Paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {order.paymentStatus || "Pending"}
                                        </span>
                                    </div>

                                    <div className="sm:text-right">
                                        <p className="text-sm text-gray-500">
                                            Total Amount
                                        </p>

                                        <p className="text-2xl font-bold text-gray-900">
                                            ₹{order.totalAmount ?? 0}
                                        </p>

                                        {order.deliveryPartner && (
                                            <p className="mt-3 text-sm text-gray-600">
                                                Delivery Partner:{" "}
                                                {order.deliveryPartner.name ||
                                                    "Assigned"}
                                            </p>
                                        )}

                                        {order.deliveredAt && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                Delivered:{" "}
                                                {new Date(
                                                    order.deliveredAt
                                                ).toLocaleString("en-IN")}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Track order button */}
                                <div className="border-t bg-white p-5">
                                    <Link
                                        to={`/track-order/${order._id}`}
                                        className="inline-block rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
                                    >
                                        Track Order
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;