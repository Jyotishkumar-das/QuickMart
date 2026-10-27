
const Order = require("../models/Order");
const DeliveryPartner = require("../models/DeliveryPartner");

// ======================================================
// GET ASSIGNED ORDERS
// ======================================================
const getAssignedOrders = async (req, res) => {
    try {
        const deliveryPartner = await DeliveryPartner.findOne({
            user: req.user.userId,
            isActive: true,
        });

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner profile not found",
            });
        }

        const orders = await Order.find({
            deliveryPartner: deliveryPartner._id,
            orderStatus: { $nin: ["Delivered", "Cancelled"] },
        })
            .populate("user", "name phone")
            .populate("items.product", "name image")
            .populate(
                "deliveryPartner",
                "name phone vehicleType vehicleNumber"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Get Assigned Orders Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch assigned orders",
        });
    }
};

// ======================================================
// ACCEPT ORDER
// ======================================================
const acceptOrder = async (req, res) => {
    try {
        const deliveryPartner = await DeliveryPartner.findOne({
            user: req.user.userId,
            isActive: true,
        });

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner profile not found",
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (
            !order.deliveryPartner ||
            String(order.deliveryPartner) !== String(deliveryPartner._id)
        ) {
            return res.status(403).json({
                success: false,
                message: "This order is not assigned to you",
            });
        }

        if (order.orderStatus !== "Confirmed") {
            return res.status(400).json({
                success: false,
                message: `Order cannot be accepted because its status is ${order.orderStatus}`,
            });
        }

        order.orderStatus = "Preparing";
        await order.save();

        const updatedOrder = await Order.findById(order._id)
            .populate("user", "name phone")
            .populate("items.product", "name image")
            .populate(
                "deliveryPartner",
                "name phone vehicleType vehicleNumber"
            );

        return res.status(200).json({
            success: true,
            message: "Order accepted successfully",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Accept Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to accept order",
        });
    }
};

// ======================================================
// UPDATE DELIVERY STATUS
// ======================================================
const updateDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "Preparing",
            "Out for Delivery",
            "Delivered",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery status",
            });
        }

        const deliveryPartner = await DeliveryPartner.findOne({
            user: req.user.userId,
            isActive: true,
        });

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner profile not found",
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (
            !order.deliveryPartner ||
            String(order.deliveryPartner) !== String(deliveryPartner._id)
        ) {
            return res.status(403).json({
                success: false,
                message: "This order is not assigned to you",
            });
        }

        // Validate status progression
        if (
            status === "Preparing" &&
            order.orderStatus !== "Confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message: "Only confirmed orders can be prepared",
            });
        }

        if (
            status === "Out for Delivery" &&
            order.orderStatus !== "Preparing"
        ) {
            return res.status(400).json({
                success: false,
                message: "Order must be Preparing before delivery",
            });
        }

        if (
            status === "Delivered" &&
            order.orderStatus !== "Out for Delivery"
        ) {
            return res.status(400).json({
                success: false,
                message: "Order must be Out for Delivery before Delivered",
            });
        }

        order.orderStatus = status;

        if (status === "Delivered") {
            order.deliveredAt = new Date();

            // COD payment remains Pending until collection is confirmed.
            // Do not mark payment as Paid automatically.
            deliveryPartner.isAvailable = true;
            deliveryPartner.totalDeliveries =
                (deliveryPartner.totalDeliveries || 0) + 1;

            await deliveryPartner.save();
        }

        await order.save();

        const updatedOrder = await Order.findById(order._id)
            .populate("user", "name phone")
            .populate("items.product", "name image")
            .populate(
                "deliveryPartner",
                "name phone vehicleType vehicleNumber"
            );

        return res.status(200).json({
            success: true,
            message: "Delivery status updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Update Delivery Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update delivery status",
        });
    }
};

// ======================================================
// UPDATE DELIVERY PARTNER LOCATION
// ======================================================
const updateDeliveryLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (
            latitude === undefined ||
            longitude === undefined ||
            latitude === "" ||
            longitude === "" ||
            !Number.isFinite(Number(latitude)) ||
            !Number.isFinite(Number(longitude)) ||
            Number(latitude) < -90 ||
            Number(latitude) > 90 ||
            Number(longitude) < -180 ||
            Number(longitude) > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid latitude and longitude",
            });
        }

        const deliveryPartner = await DeliveryPartner.findOne({
            user: req.user.userId,
            isActive: true,
        });

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Active delivery partner profile not found",
            });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);

        deliveryPartner.currentLocation = {
            latitude: lat,
            longitude: lng,
        };
        deliveryPartner.locationUpdatedAt = new Date();

        await deliveryPartner.save();

        // Broadcast the new location to rooms for this partner's
        // currently assigned orders, if Socket.IO is available.
        const io = req.app.get("io");

        if (io) {
            const assignedOrders = await Order.find({
                deliveryPartner: deliveryPartner._id,
                orderStatus: { $nin: ["Delivered", "Cancelled"] },
            }).select("_id");

            for (const order of assignedOrders) {
                io.to(`order_${order._id}`).emit("locationUpdated", {
                    success: true,
                    orderId: String(order._id),
                    latitude: lat,
                    longitude: lng,
                    updatedAt: deliveryPartner.locationUpdatedAt,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Delivery location updated successfully",
            location: deliveryPartner.currentLocation,
            locationUpdatedAt: deliveryPartner.locationUpdatedAt,
        });
    } catch (error) {
        console.error("Update Delivery Location Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update delivery location",
        });
    }
};

/**
 * Confirm COD payment after cash has actually been collected.
 */
const confirmCODPayment = async (req, res) => {
    try {
        const deliveryPartner = await DeliveryPartner.findOne({
            user: req.user.userId,
            isActive: true,
        });

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Active delivery partner profile not found",
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Verify that this order belongs to this delivery partner.
        if (
            !order.deliveryPartner ||
            String(order.deliveryPartner) !== String(deliveryPartner._id)
        ) {
            return res.status(403).json({
                success: false,
                message: "This order is not assigned to you",
            });
        }

        if (order.orderStatus !== "Delivered") {
            return res.status(400).json({
                success: false,
                message: "COD payment can only be confirmed after delivery",
            });
        }

        if (order.paymentMethod !== "COD") {
            return res.status(400).json({
                success: false,
                message: "This order is not a Cash on Delivery order",
            });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(200).json({
                success: true,
                message: "Payment has already been confirmed",
                paymentStatus: order.paymentStatus,
            });
        }

        if (order.paymentStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm payment with status ${order.paymentStatus}`,
            });
        }

        // Call this endpoint only after cash has actually been received.
        order.paymentStatus = "Paid";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "COD payment confirmed successfully",
            paymentStatus: order.paymentStatus,
            orderId: String(order._id),
        });
    } catch (error) {
        console.error("Confirm COD Payment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to confirm COD payment",
        });
    }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    getAssignedOrders,
    acceptOrder,
    updateDeliveryStatus,
    updateDeliveryLocation,
    confirmCODPayment,
};
