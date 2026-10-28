
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./DeliveryPartners.css";

const API_URL = "https://quickmart-api-b27r.onrender.com/api";

const DeliveryPartners = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [updatingId, setUpdatingId] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const fetchPartners = useCallback(async (showLoader = true) => {
        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please log in as an admin.");
            setLoading(false);
            return;
        }

        try {
            if (showLoader) setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/delivery-partners`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            const list = Array.isArray(data)
                ? data
                : data.deliveryPartners || data.partners || data.data || [];

            setPartners(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load delivery partners."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    const updatePartner = async (partner, field, value) => {
        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please log in as an admin.");
            return;
        }

        try {
            setUpdatingId(partner._id);
            setError("");
            setMessage("");

            const response = await axios.put(
                `${API_URL}/delivery-partners/${partner._id}`,
                { [field]: value },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedPartner =
                response.data?.deliveryPartner || response.data?.data;

            if (updatedPartner?._id) {
                setPartners((previous) =>
                    previous.map((item) =>
                        item._id === updatedPartner._id
                            ? { ...item, ...updatedPartner }
                            : item
                    )
                );
            }

            setMessage(
                field === "isAvailable"
                    ? `Availability changed to ${value ? "Available" : "Unavailable"
                    }.`
                    : `Partner ${value ? "activated" : "deactivated"} successfully.`
            );

            await fetchPartners(false);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update delivery partner."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const filteredPartners = useMemo(() => {
        const term = search.trim().toLowerCase();

        return partners.filter((partner) => {
            const matchesSearch =
                !term ||
                (partner.name || "").toLowerCase().includes(term) ||
                (partner.phone || "").toLowerCase().includes(term) ||
                (partner.vehicleNumber || "").toLowerCase().includes(term) ||
                (partner.vehicleType || "").toLowerCase().includes(term);

            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Active" && partner.isActive) ||
                (statusFilter === "Inactive" && !partner.isActive) ||
                (statusFilter === "Available" &&
                    partner.isActive &&
                    partner.isAvailable) ||
                (statusFilter === "Unavailable" &&
                    (!partner.isAvailable || !partner.isActive));

            return matchesSearch && matchesStatus;
        });
    }, [partners, search, statusFilter]);

    const activeCount = partners.filter((p) => p.isActive).length;
    const availableCount = partners.filter(
        (p) => p.isActive && p.isAvailable
    ).length;
    const inactiveCount = partners.filter((p) => !p.isActive).length;
    const totalDeliveries = partners.reduce(
        (total, partner) => total + Number(partner.totalDeliveries || 0),
        0
    );

    const handleActivation = (partner) => {
        const action = partner.isActive ? "deactivate" : "activate";
        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${partner.name || "this partner"}?`
        );

        if (confirmed) {
            updatePartner(partner, "isActive", !partner.isActive);
        }
    };

    return (
        <main className="delivery-page">
            <div className="delivery-container">
                <Link to="/admin" className="delivery-back-link">
                    <span>←</span> Back to Dashboard
                </Link>

                <header className="delivery-header">
                    <div>
                        <span className="delivery-eyebrow">QUICKMART ADMIN</span>
                        <h1>Delivery Partners</h1>
                        <p>Manage your delivery team and their availability.</p>
                    </div>

                    <button
                        type="button"
                        className="delivery-refresh-btn"
                        onClick={() => fetchPartners()}
                        disabled={loading || Boolean(updatingId)}
                    >
                        <span className={loading ? "delivery-spinning" : ""}>↻</span>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </header>

                {error && (
                    <div className="delivery-alert delivery-alert-error">
                        <span>!</span>
                        <p>{error}</p>
                        <button onClick={() => setError("")} aria-label="Dismiss error">
                            ×
                        </button>
                    </div>
                )}

                {message && (
                    <div className="delivery-alert delivery-alert-success">
                        <span>✓</span>
                        <p>{message}</p>
                        <button
                            onClick={() => setMessage("")}
                            aria-label="Dismiss message"
                        >
                            ×
                        </button>
                    </div>
                )}

                <section className="delivery-stats">
                    <article className="delivery-stat-card">
                        <div className="delivery-stat-icon delivery-stat-green">♙</div>
                        <div>
                            <p>Total Partners</p>
                            <h2>{partners.length}</h2>
                            <span>Registered delivery team</span>
                        </div>
                    </article>

                    <article className="delivery-stat-card">
                        <div className="delivery-stat-icon delivery-stat-blue">✓</div>
                        <div>
                            <p>Available</p>
                            <h2>{availableCount}</h2>
                            <span>Ready for deliveries</span>
                        </div>
                    </article>

                    <article className="delivery-stat-card">
                        <div className="delivery-stat-icon delivery-stat-orange">◷</div>
                        <div>
                            <p>Inactive</p>
                            <h2>{inactiveCount}</h2>
                            <span>Deactivated accounts</span>
                        </div>
                    </article>

                    <article className="delivery-stat-card">
                        <div className="delivery-stat-icon delivery-stat-purple">↗</div>
                        <div>
                            <p>Total Deliveries</p>
                            <h2>{totalDeliveries.toLocaleString("en-IN")}</h2>
                            <span>Across all partners</span>
                        </div>
                    </article>
                </section>

                <section className="delivery-panel">
                    <div className="delivery-panel-heading">
                        <div>
                            <h2>Delivery Team</h2>
                            <p>Review partner details and manage their status.</p>
                        </div>
                        <span className="delivery-count">
                            {filteredPartners.length} partners
                        </span>
                    </div>

                    <div className="delivery-filters">
                        <label className="delivery-search">
                            <span>⌕</span>
                            <input
                                type="search"
                                placeholder="Search name, phone, vehicle..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Filter delivery partners"
                        >
                            <option value="All">All Partners</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Available">Available</option>
                            <option value="Unavailable">Unavailable</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="delivery-state">
                            <div className="delivery-loader" />
                            <h3>Loading delivery partners...</h3>
                            <p>Please wait while the delivery team loads.</p>
                        </div>
                    ) : error && partners.length === 0 ? (
                        <div className="delivery-state">
                            <h3>Unable to load delivery partners</h3>
                            <p>{error}</p>
                            <button
                                className="delivery-primary-btn"
                                onClick={() => fetchPartners()}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="delivery-state">
                            <div className="delivery-empty-icon">♙</div>
                            <h3>
                                {partners.length === 0
                                    ? "No delivery partners found"
                                    : "No matching partners"}
                            </h3>
                            <p>
                                {partners.length === 0
                                    ? "Create a delivery user account first, then register its delivery partner profile."
                                    : "Try another search term or change the filter."}
                            </p>
                            {partners.length > 0 && (
                                <button
                                    className="delivery-secondary-btn"
                                    onClick={() => {
                                        setSearch("");
                                        setStatusFilter("All");
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="delivery-grid">
                            {filteredPartners.map((partner, index) => {
                                const isUpdating = updatingId === partner._id;
                                const isAvailable =
                                    Boolean(partner.isActive) && Boolean(partner.isAvailable);

                                return (
                                    <article className="delivery-card" key={partner._id}>
                                        <div className="delivery-card-top">
                                            <div className="delivery-avatar">
                                                {(partner.name || "?")
                                                    .trim()
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="delivery-person-info">
                                                <h3>{partner.name || "Unnamed partner"}</h3>
                                                <p>{partner.phone || "Phone not available"}</p>
                                            </div>

                                            <span
                                                className={`delivery-status ${partner.isActive
                                                    ? "delivery-status-active"
                                                    : "delivery-status-inactive"
                                                    }`}
                                            >
                                                <span />
                                                {partner.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>

                                        <div className="delivery-details">
                                            <div className="delivery-detail-row">
                                                <span className="delivery-detail-icon">▰</span>
                                                <div>
                                                    <span>Vehicle Type</span>
                                                    <strong>
                                                        {partner.vehicleType || "Not specified"}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="delivery-detail-row">
                                                <span className="delivery-detail-icon">№</span>
                                                <div>
                                                    <span>Vehicle Number</span>
                                                    <strong>
                                                        {partner.vehicleNumber || "Not specified"}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="delivery-detail-row">
                                                <span className="delivery-detail-icon">↗</span>
                                                <div>
                                                    <span>Total Deliveries</span>
                                                    <strong>
                                                        {Number(partner.totalDeliveries || 0).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="delivery-card-availability">
                                            <span>Current availability</span>
                                            <span
                                                className={`delivery-availability ${isAvailable
                                                    ? "delivery-availability-on"
                                                    : "delivery-availability-off"
                                                    }`}
                                            >
                                                <span />
                                                {isAvailable ? "Available" : "Unavailable"}
                                            </span>
                                        </div>

                                        <div className="delivery-actions">
                                            <button
                                                type="button"
                                                className="delivery-availability-btn"
                                                disabled={isUpdating || !partner.isActive}
                                                onClick={() =>
                                                    updatePartner(
                                                        partner,
                                                        "isAvailable",
                                                        !partner.isAvailable
                                                    )
                                                }
                                            >
                                                {isUpdating
                                                    ? "Updating..."
                                                    : partner.isAvailable
                                                        ? "Mark Unavailable"
                                                        : "Mark Available"}
                                            </button>

                                            <button
                                                type="button"
                                                className={`delivery-activation-btn ${partner.isActive
                                                    ? "delivery-deactivate-btn"
                                                    : "delivery-activate-btn"
                                                    }`}
                                                disabled={Boolean(updatingId)}
                                                onClick={() => handleActivation(partner)}
                                            >
                                                {partner.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {!loading && filteredPartners.length > 0 && (
                        <footer className="delivery-panel-footer">
                            Showing {filteredPartners.length} of {partners.length} partners
                        </footer>
                    )}
                </section>

                <footer className="delivery-page-footer">
                    QuickMart Admin Panel · Delivery Operations
                </footer>
            </div>
        </main>
    );
};

export default DeliveryPartners;
