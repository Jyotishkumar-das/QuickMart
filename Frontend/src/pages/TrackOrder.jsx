
import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams, Link } from "react-router-dom";
import "./TrackOrder.css";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";
const SOCKET_URL = "https://quickmart-api-b27r.onrender.com";

const TrackOrder = () => {
    const { id: orderId } = useParams();

    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [socketStatus, setSocketStatus] = useState("Connecting...");

    useEffect(() => {
        let socket;
        let isMounted = true;

        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please login to track your order.");
            setLoading(false);
            return;
        }

        const fetchLocation = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `${API_URL}/orders/${orderId}/live-location`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (isMounted) {
                    setTracking(response.data);
                    setError("");
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load delivery location."
                    );
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchLocation();

        socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            if (!isMounted) return;
            setSocketStatus("Connected");
            socket.emit("joinOrderRoom", orderId);
        });

        socket.on("joinedOrderRoom", (data) => {
            if (!isMounted) return;

            if (data.success) {
                setSocketStatus("Live tracking active");
            }
        });

        socket.on("connect_error", () => {
            if (isMounted) setSocketStatus("Connection failed");
        });

        socket.on("orderRoomError", (data) => {
            if (isMounted) {
                setError(data.message || "Unable to join tracking room.");
            }
        });

        socket.on("locationUpdated", (data) => {
            if (
                !isMounted ||
                !data.success ||
                data.orderId !== orderId
            ) {
                return;
            }

            setTracking((previous) => {
                if (!previous) return previous;

                return {
                    ...previous,
                    deliveryPartner: {
                        ...previous.deliveryPartner,
                        currentLocation: {
                            ...previous.deliveryPartner?.currentLocation,
                            latitude: data.latitude,
                            longitude: data.longitude,
                        },
                        locationUpdatedAt: data.updatedAt,
                    },
                };
            });
        });

        socket.on("disconnect", () => {
            if (isMounted) setSocketStatus("Disconnected");
        });

        return () => {
            isMounted = false;
            socket?.disconnect();
        };
    }, [orderId]);

    if (loading) {
        return (
            <main className="track-page track-centered">
                <div className="track-state-card">
                    <div className="track-spinner" />
                    <h2>Finding your order</h2>
                    <p>Loading your latest delivery information...</p>
                </div>
            </main>
        );
    }

    if (error && !tracking) {
        return (
            <main className="track-page track-centered">
                <div className="track-state-card">
                    <div className="track-state-icon">!</div>
                    <h2>Tracking unavailable</h2>
                    <p>{error}</p>
                    <Link to="/orders" className="track-primary-btn">
                        ← Back to My Orders
                    </Link>
                </div>
            </main>
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

    const formatDate = (value) => {
        if (!value) return "Not available";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? "Not available"
            : date.toLocaleString("en-IN");
    };

    const connectionIsActive = socketStatus === "Live tracking active";

    return (
        <main className="track-page">
            <div className="track-container">
                <Link to="/orders" className="track-back-link">
                    <span>←</span> Back to My Orders
                </Link>

                <header className="track-header">
                    <div>
                        <span className="track-eyebrow">QUICKMART DELIVERY</span>
                        <h1>Track Your Order</h1>
                        <p>Stay updated on your delivery in real time.</p>
                    </div>

                    <div
                        className={`track-connection ${connectionIsActive
                            ? "track-connection-live"
                            : "track-connection-waiting"
                            }`}
                    >
                        <span className="track-connection-dot" />
                        {socketStatus}
                    </div>
                </header>

                <section className="track-hero">
                    <div className="track-hero-decoration">Q</div>
                    <div className="track-hero-content">
                        <div className="track-hero-icon">✓</div>
                        <div>
                            <span className="track-hero-label">CURRENT ORDER STATUS</span>
                            <h2>{tracking.orderStatus || "Processing"}</h2>
                            <p>
                                {connectionIsActive
                                    ? "Live updates are connected."
                                    : "Your order details are shown below. Live connection may still be reconnecting."}
                            </p>
                        </div>
                    </div>

                    <div className="track-order-reference">
                        <span>ORDER ID</span>
                        <strong>{tracking.orderId || orderId}</strong>
                    </div>
                </section>

                <div className="track-layout">
                    <div className="track-main-column">
                        <section className="track-card">
                            <div className="track-card-heading">
                                <div className="track-heading-icon track-icon-green">♙</div>
                                <div>
                                    <h2>Delivery Partner</h2>
                                    <p>Your assigned delivery professional</p>
                                </div>
                            </div>

                            <div className="track-partner-profile">
                                <div className="track-partner-avatar">
                                    {(partner.name || "D").trim().charAt(0).toUpperCase()}
                                </div>

                                <div className="track-partner-info">
                                    <h3>{partner.name || "Delivery partner assigned"}</h3>
                                    <p>
                                        {partner.vehicleType || "Vehicle details not available"}
                                    </p>
                                </div>

                                <span className="track-partner-badge">
                                    <span />
                                    Assigned
                                </span>
                            </div>

                            <div className="track-vehicle-details">
                                <div className="track-vehicle-item">
                                    <span className="track-vehicle-icon">▰</span>
                                    <div>
                                        <span>Vehicle Type</span>
                                        <strong>{partner.vehicleType || "Not available"}</strong>
                                    </div>
                                </div>

                                <div className="track-vehicle-item">
                                    <span className="track-vehicle-icon">№</span>
                                    <div>
                                        <span>Vehicle Number</span>
                                        <strong>
                                            {partner.vehicleNumber || "Not available"}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="track-card">
                            <div className="track-card-heading">
                                <div className="track-heading-icon track-icon-blue">⌖</div>
                                <div>
                                    <h2>Live Delivery Location</h2>
                                    <p>Latest location shared by your delivery partner</p>
                                </div>
                            </div>

                            {hasLocation ? (
                                <>
                                    <div className="track-location-banner">
                                        <span className="track-location-pulse" />
                                        <div>
                                            <strong>Location available</strong>
                                            <p>Coordinates received from your delivery partner.</p>
                                        </div>
                                    </div>

                                    <div className="track-coordinates">
                                        <div>
                                            <span>Latitude</span>
                                            <strong>{latitude}</strong>
                                        </div>
                                        <div>
                                            <span>Longitude</span>
                                            <strong>{longitude}</strong>
                                        </div>
                                    </div>

                                    <div className="track-last-updated">
                                        <span>◷</span>
                                        <div>
                                            <span>Last location update</span>
                                            <strong>
                                                {formatDate(partner.locationUpdatedAt)}
                                            </strong>
                                        </div>
                                    </div>

                                    <a
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="track-map-btn"
                                    >
                                        <span>⌖</span>
                                        View Location on Google Maps
                                        <span className="track-map-arrow">↗</span>
                                    </a>
                                </>
                            ) : (
                                <div className="track-location-empty">
                                    <div className="track-empty-map-icon">⌖</div>
                                    <h3>Waiting for location</h3>
                                    <p>
                                        The delivery partner has not shared a location yet.
                                        Please check again shortly.
                                    </p>
                                </div>
                            )}
                        </section>

                        {error && (
                            <div className="track-inline-error">
                                <span>!</span>
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    <aside className="track-sidebar">
                        <section className="track-card track-quick-card">
                            <div className="track-card-heading">
                                <div className="track-heading-icon track-icon-orange">◷</div>
                                <div>
                                    <h2>Tracking Status</h2>
                                    <p>Connection information</p>
                                </div>
                            </div>

                            <div className="track-status-row">
                                <span className="track-status-indicator" />
                                <div>
                                    <span>Order status</span>
                                    <strong>{tracking.orderStatus || "Processing"}</strong>
                                </div>
                            </div>

                            <div className="track-status-row">
                                <span
                                    className={`track-status-indicator ${connectionIsActive ? "track-indicator-live" : ""
                                        }`}
                                />
                                <div>
                                    <span>Live connection</span>
                                    <strong>{socketStatus}</strong>
                                </div>
                            </div>

                            <div className="track-help-note">
                                <span>i</span>
                                <p>
                                    Keep this page open to receive live location updates while
                                    the tracking connection is active.
                                </p>
                            </div>

                            <Link to="/orders" className="track-secondary-btn">
                                View My Orders
                            </Link>
                        </section>
                    </aside>
                </div>

                <footer className="track-footer">
                    QuickMart · Fresh groceries, delivered with care.
                </footer>
            </div>
        </main>
    );
};

export default TrackOrder;
