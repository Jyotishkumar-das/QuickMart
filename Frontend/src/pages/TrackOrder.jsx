import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams, Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const TrackOrder = () => {
    const { id: orderId } = useParams();

    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [socketStatus, setSocketStatus] = useState("Connecting...");

    useEffect(() => {
        let socket;

        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please login to track your order.");
            setLoading(false);
            return;
        }

        const fetchLocation = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/orders/${orderId}/live-location`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setTracking(response.data);
                setError("");
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load delivery location."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();

        socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            setSocketStatus("Connected");
            socket.emit("joinOrderRoom", orderId);
        });

        socket.on("joinedOrderRoom", (data) => {
            if (data.success) {
                setSocketStatus("Live tracking active");
            }
        });

        socket.on("connect_error", () => {
            setSocketStatus("Connection failed");
        });

        socket.on("orderRoomError", (data) => {
            setError(data.message || "Unable to join tracking room.");
        });

        socket.on("locationUpdated", (data) => {
            if (
                data.success &&
                data.orderId === orderId
            ) {
                setTracking((previous) => {
                    if (!previous) return previous;

                    return {
                        ...previous,
                        deliveryPartner: {
                            ...previous.deliveryPartner,
                            currentLocation: {
                                latitude: data.latitude,
                                longitude: data.longitude,
                            },
                            locationUpdatedAt: data.updatedAt,
                        },
                    };
                });
            }
        });

        socket.on("disconnect", () => {
            setSocketStatus("Disconnected");
        });

        return () => {
            socket?.disconnect();
        };
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg font-semibold">
                    Loading tracking details...
                </p>
            </div>
        );
    }

    if (error && !tracking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-center text-red-600">{error}</p>
                <Link
                    to="/orders"
                    className="rounded-lg bg-green-600 px-5 py-2 text-white"
                >
                    Back to My Orders
                </Link>
            </div>
        );
    }

    if (!tracking) return null;

    const partner = tracking.deliveryPartner || {};
    const location = partner.currentLocation || {};

    const latitude = location.latitude;
    const longitude = location.longitude;

    const hasLocation =
        typeof latitude === "number" &&
        typeof longitude === "number";

    const mapUrl = hasLocation
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : null;

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-3xl">
                <Link
                    to="/orders"
                    className="text-green-700 hover:underline"
                >
                    ← Back to My Orders
                </Link>

                <h1 className="mt-5 text-3xl font-bold text-gray-800">
                    Track Your Order
                </h1>

                <p className="mt-2 break-all text-sm text-gray-500">
                    Order ID: {tracking.orderId || orderId}
                </p>

                <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Order Status
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-green-700">
                        {tracking.orderStatus || "Processing"}
                    </h2>

                    <p className="mt-4 text-sm text-gray-600">
                        Live connection: {socketStatus}
                    </p>
                </div>

                <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800">
                        Delivery Partner
                    </h2>

                    <p className="mt-3 text-gray-700">
                        Name: {partner.name || "Delivery partner assigned"}
                    </p>

                    <p className="mt-2 text-gray-700">
                        Vehicle: {partner.vehicleType || "Not available"}
                    </p>

                    <p className="mt-2 text-gray-700">
                        Vehicle Number: {partner.vehicleNumber || "Not available"}
                    </p>
                </div>

                <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800">
                        Delivery Location
                    </h2>

                    {hasLocation ? (
                        <>
                            <p className="mt-3 text-gray-700">
                                Latitude: {latitude}
                            </p>

                            <p className="mt-2 text-gray-700">
                                Longitude: {longitude}
                            </p>

                            {partner.locationUpdatedAt && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Last updated:{" "}
                                    {new Date(
                                        partner.locationUpdatedAt
                                    ).toLocaleString("en-IN")}
                                </p>
                            )}

                            <a
                                href={mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-5 inline-block rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                            >
                                View on Google Maps
                            </a>
                        </>
                    ) : (
                        <p className="mt-3 text-gray-600">
                            Delivery partner location is not available yet.
                        </p>
                    )}
                </div>

                {error && (
                    <p className="mt-4 text-sm text-red-600">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default TrackOrder;