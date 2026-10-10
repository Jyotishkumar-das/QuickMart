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
            orderStatus: {
                $nin: ["Delivered", "Cancelled"],
            },
        })
            .populate("user", "name phone")
            .populate("items.product", "name image")
            .populate(
                "deliveryPartner",
                "name phone vehicleType vehicleNumber"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Get Assigned Orders Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch assigned orders",
        });
    }
};


// ======================================================
// ACCEPT ORDER - DELIVERY PARTNER
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

        // Make sure this order belongs to this partner
        if (
            !order.deliveryPartner ||
            order.deliveryPartner.toString() !==
            deliveryPartner._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "This order is not assigned to you",
            });
        }

        // Only confirmed orders can be accepted
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

        res.status(200).json({
            success: true,
            message: "Order accepted successfully",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Accept Order Error:", error);

        res.status(500).json({
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

        // Make sure this order belongs to this partner
        if (
            !order.deliveryPartner ||
            order.deliveryPartner.toString() !==
            deliveryPartner._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "This order is not assigned to you",
            });
        }

        // Prevent invalid status progression
        if (
            status === "Out for Delivery" &&
            order.orderStatus !== "Preparing"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Order must be Preparing before going Out for Delivery",
            });
        }

        if (
            status === "Delivered" &&
            order.orderStatus !== "Out for Delivery"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Order must be Out for Delivery before Delivered",
            });
        }

        order.orderStatus = status;

        // Delivery completed
        if (status === "Delivered") {
            order.deliveredAt = new Date();

            deliveryPartner.isAvailable = true;
            deliveryPartner.totalDeliveries += 1;

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

        res.status(200).json({
            success: true,
            message: "Delivery status updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        console.error(
            "Update Delivery Status Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update delivery status",
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
};