const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const DeliveryPartner = require("../models/DeliveryPartner");


// ======================================================
// CREATE ORDER
// ======================================================

const createOrder = async (req, res) => {
    let session;

    try {
        const userId = req.user?.userId;

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(401).json({
                success: false,
                message: "Please log in to place an order",
            });
        }

        const {
            items,
            shippingAddress,
            paymentMethod = "COD",
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order must contain at least one product",
            });
        }

        if (items.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Too many products in one order",
            });
        }

        const requiredFields = [
            "name",
            "phone",
            "addressLine",
            "city",
            "state",
            "pincode",
        ];

        const validAddress =
            shippingAddress &&
            typeof shippingAddress === "object" &&
            requiredFields.every(
                (field) =>
                    typeof shippingAddress[field] === "string" &&
                    shippingAddress[field].trim().length > 0
            );

        if (!validAddress) {
            return res.status(400).json({
                success: false,
                message: "Complete shipping address is required",
            });
        }

        if (!["COD", "ONLINE"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method",
            });
        }

        // Validate and combine duplicate product entries.
        const quantities = new Map();

        for (const item of items) {
            if (
                !item ||
                !mongoose.isValidObjectId(item.product) ||
                !Number.isSafeInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID or quantity",
                });
            }

            const productId = item.product.toString();
            const quantity =
                (quantities.get(productId) || 0) + item.quantity;

            if (!Number.isSafeInteger(quantity)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid total product quantity",
                });
            }

            quantities.set(productId, quantity);
        }

        session = await mongoose.startSession();
        session.startTransaction();

        const orderItems = [];
        let subtotal = 0;

        for (const [productId, quantity] of quantities.entries()) {
            const product = await Product.findOne({
                _id: productId,
                isActive: true,
            }).session(session);

            if (!product) {
                await session.abortTransaction();

                return res.status(404).json({
                    success: false,
                    message: "One or more products are unavailable",
                });
            }

            if (
                !Number.isSafeInteger(product.stock) ||
                product.stock < quantity
            ) {
                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message: `${product.name} has insufficient stock`,
                });
            }

            const price =
                product.discountPrice != null &&
                    product.discountPrice < product.price
                    ? product.discountPrice
                    : product.price;

            if (!Number.isFinite(price) || price < 0) {
                throw new Error(`Invalid price for ${product.name}`);
            }

            const itemSubtotal = price * quantity;

            if (!Number.isFinite(itemSubtotal)) {
                throw new Error("Invalid product subtotal");
            }

            subtotal += itemSubtotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                image: product.image,
                price,
                quantity,
                unit: product.unit,
                subtotal: itemSubtotal,
            });

            // Atomically decrement stock only when sufficient stock remains.
            const stockUpdate = await Product.updateOne(
                {
                    _id: product._id,
                    isActive: true,
                    stock: { $gte: quantity },
                },
                {
                    $inc: { stock: -quantity },
                },
                { session }
            );

            if (stockUpdate.modifiedCount !== 1) {
                await session.abortTransaction();

                return res.status(409).json({
                    success: false,
                    message: `${product.name} stock changed. Please try again.`,
                });
            }
        }

        const deliveryFee = subtotal >= 500 ? 0 : 30;
        const discount = 0;
        const totalAmount = subtotal + deliveryFee - discount;

        if (!Number.isFinite(totalAmount)) {
            throw new Error("Invalid order total");
        }

        const [order] = await Order.create(
            [
                {
                    user: userId,
                    items: orderItems,
                    shippingAddress: {
                        name: shippingAddress.name.trim(),
                        phone: shippingAddress.phone.trim(),
                        addressLine: shippingAddress.addressLine.trim(),
                        city: shippingAddress.city.trim(),
                        state: shippingAddress.state.trim(),
                        pincode: shippingAddress.pincode.trim(),
                    },
                    subtotal,
                    deliveryFee,
                    discount,
                    totalAmount,
                    paymentMethod,
                    paymentStatus: "Pending",
                    orderStatus: "Confirmed",
                    estimatedDeliveryTime: new Date(
                        Date.now() + 30 * 60 * 1000
                    ),
                },
            ],
            { session }
        );

        await session.commitTransaction();

        const populatedOrder = await Order.findById(order._id)
            .populate("user", "name phone")
            .populate("items.product", "name image")
            .populate("deliveryPartner", "name phone");

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: populatedOrder,
        });
    } catch (error) {
        if (session?.inTransaction()) {
            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error("Transaction Abort Error:", abortError);
            }
        }

        console.error("Create Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create order",
        });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

// ======================================================
// GET MY ORDERS
// ======================================================

const getMyOrders = async (req, res) => {

    try {

        const orders =
            await Order.find({
                user: req.user.userId,
            })
                .populate(
                    "items.product",
                    "name image"
                )
                .populate(
                    "deliveryPartner",
                    "name phone"
                )
                .sort({
                    createdAt: -1,
                });


        return res.status(200).json({

            success: true,

            count:
                orders.length,

            orders,

        });

    } catch (error) {

        console.error(
            "Get My Orders Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch orders",

        });
    }
};
// ======================================================
// CANCEL ORDER - CUSTOMER
// ======================================================

const cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        session.startTransaction();

        const order = await Order.findOne({
            _id: id,
            user: userId,
        }).session(session);

        if (!order) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Only early-stage orders can be cancelled by customers.
        if (!["Confirmed", "Preparing"].includes(order.orderStatus)) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "This order can no longer be cancelled",
            });
        }

        // Restore stock for every ordered item.
        for (const item of order.items) {
            const result = await Product.updateOne(
                { _id: item.product },
                { $inc: { stock: item.quantity } },
                { session }
            );

            if (result.matchedCount !== 1) {
                throw new Error(
                    `Product not found while restoring stock: ${item.product}`
                );
            }
        }

        order.orderStatus = "Cancelled";
        order.cancelledAt = new Date();

        await order.save({ session });

        // Release an assigned delivery partner, if any.
        if (order.deliveryPartner) {
            await DeliveryPartner.updateOne(
                { _id: order.deliveryPartner },
                { $set: { isAvailable: true } },
                { session }
            );
        }

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order,
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        console.error("Cancel Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
        });
    } finally {
        await session.endSession();
    }
};

// ======================================================
// GET SINGLE ORDER
// ======================================================


const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name phone")
            .populate("items.product", "name image")
            .populate("deliveryPartner", "name phone");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // CUSTOMER: can view only their own order
        if (req.user.role === "customer") {
            const orderUserId = order.user?._id
                ? order.user._id.toString()
                : order.user?.toString();

            if (
                !orderUserId ||
                orderUserId !== req.user.userId.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to view this order",
                });
            }
        }

        // DELIVERY: can view only orders assigned to them
        if (req.user.role === "delivery") {
            const deliveryPartner = await DeliveryPartner.findOne({
                user: req.user.userId,
                isActive: true,
            }).select("_id");

            if (
                !deliveryPartner ||
                !order.deliveryPartner ||
                order.deliveryPartner._id.toString() !==
                deliveryPartner._id.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to view this order",
                });
            }
        }

        // ADMIN: can view any order

        return res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Get Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch order",
        });
    }
};


// ======================================================
// GET ALL ORDERS - ADMIN
// ======================================================

const getAllOrders = async (req, res) => {

    try {

        const orders =
            await Order.find()
                .populate(
                    "user",
                    "name phone"
                )
                .populate(
                    "items.product",
                    "name image"
                )
                .populate(
                    "deliveryPartner",
                    "name phone vehicleType vehicleNumber"
                )
                .sort({
                    createdAt: -1,
                });


        return res.status(200).json({

            success: true,

            count:
                orders.length,

            orders,

        });

    } catch (error) {

        console.error(
            "Get All Orders Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch all orders",

        });
    }
};


// ======================================================
// UPDATE ORDER STATUS - ADMIN
// ======================================================
const updateOrderStatus = async (req, res) => {
    try {
        // Frontend may send either "status" or "orderStatus".
        const status = req.body.status || req.body.orderStatus;

        if (!req.user?.role) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const order = await Order.findById(req.params.id);
        if (!["customer", "delivery", "admin"].includes(req.user?.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this order",
            });
        }
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const previousStatus = order.orderStatus;

        const allowedTransitions = {
            Confirmed: ["Preparing", "Cancelled"],
            Preparing: ["Out for Delivery", "Cancelled"],
            "Out for Delivery": ["Delivered", "Cancelled"],
        };

        const allowedStatuses = [
            "Preparing",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status",
            });
        }

        // ADMIN: validate the status transition.
        if (req.user.role === "admin") {
            if (
                !allowedTransitions[previousStatus] ||
                !allowedTransitions[previousStatus].includes(status)
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot change order status from ${previousStatus} to ${status}`,
                });
            }
        }

        // DELIVERY PARTNER: only deliver an assigned order.
        else if (req.user.role === "delivery") {
            if (
                status !== "Delivered" ||
                previousStatus !== "Out for Delivery"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Delivery partners can only mark Out for Delivery orders as Delivered",
                });
            }

            const deliveryPartner = await DeliveryPartner.findOne({
                user: req.user.userId,
                isActive: true,
            });

            if (!deliveryPartner) {
                return res.status(403).json({
                    success: false,
                    message: "Delivery partner profile not found",
                });
            }

            if (
                !order.deliveryPartner ||
                String(order.deliveryPartner) !==
                String(deliveryPartner._id)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "This order is not assigned to you",
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to update order status",
            });
        }

        // Update order.
        order.orderStatus = status;

        if (status === "Delivered") {
            order.deliveredAt = new Date();
        }

        if (status === "Cancelled") {
            order.cancelledAt = new Date();
        }

        await order.save();

        // Release the delivery partner after completion/cancellation.
        if (
            ["Delivered", "Cancelled"].includes(status) &&
            order.deliveryPartner
        ) {
            const partnerUpdate = {
                $set: { isAvailable: true },
            };

            if (status === "Delivered") {
                partnerUpdate.$inc = { totalDeliveries: 1 };
            }

            await DeliveryPartner.findByIdAndUpdate(
                order.deliveryPartner,
                partnerUpdate
            );
        }

        const updatedOrder = await Order.findById(order._id)
            .populate("user", "name phone")
            .populate("items.product", "name image")
            .populate(
                "deliveryPartner",
                "name phone vehicleType vehicleNumber"
            );

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Update Order Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update order status",
        });
    }
};



// ======================================================
// ASSIGN DELIVERY PARTNER - ADMIN
// ======================================================

const assignDeliveryPartner = async (
    req,
    res
) => {

    try {

        const {
            deliveryPartnerId,
        } = req.body;


        // Validate delivery partner ID

        if (!deliveryPartnerId) {

            return res.status(400).json({

                success: false,

                message:
                    "Delivery partner ID is required",

            });
        }


        // Find order

        const order =
            await Order.findById(
                req.params.id
            );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found",

            });
        }


        // Don't assign to completed/cancelled order

        if (
            order.orderStatus ===
            "Delivered" ||
            order.orderStatus ===
            "Cancelled"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Cannot assign delivery partner to a ${order.orderStatus.toLowerCase()} order`,

            });
        }


        // Find delivery partner

        const deliveryPartner =
            await DeliveryPartner.findById(
                deliveryPartnerId
            );


        if (!deliveryPartner) {

            return res.status(404).json({

                success: false,

                message:
                    "Delivery partner not found",

            });
        }


        // Check active status

        if (
            !deliveryPartner.isActive
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Delivery partner is inactive",

            });
        }


        // Check availability

        if (
            !deliveryPartner.isAvailable
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Delivery partner is currently unavailable",

            });
        }


        // If another partner was already assigned,
        // make that partner available again

        if (
            order.deliveryPartner &&
            order.deliveryPartner.toString() !==
            deliveryPartner._id.toString()
        ) {

            await DeliveryPartner.findByIdAndUpdate(
                order.deliveryPartner,
                {
                    isAvailable: true,
                }
            );
        }


        // Assign new delivery partner

        order.deliveryPartner =
            deliveryPartner._id;


        await order.save();


        // Mark new partner unavailable

        deliveryPartner.isAvailable =
            false;

        await deliveryPartner.save();


        // Get updated order

        const updatedOrder =
            await Order.findById(
                order._id
            )
                .populate(
                    "user",
                    "name phone"
                )
                .populate(
                    "items.product",
                    "name image"
                )
                .populate(
                    "deliveryPartner",
                    "name phone vehicleType vehicleNumber"
                );


        return res.status(200).json({

            success: true,

            message:
                "Delivery partner assigned successfully",

            order:
                updatedOrder,

        });

    } catch (error) {

        console.error(
            "Assign Delivery Partner Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to assign delivery partner",

        });
    }
};


// ======================================================
// GET LIVE DELIVERY LOCATION
// ======================================================
const getLiveDeliveryLocation = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const role = req.user?.role;
        const userId = String(req.user?.userId || "");

        // Customer can track only their own order.
        if (role === "customer") {
            const orderUserId = String(order.user || "");

            if (!userId || orderUserId !== userId) {
                console.log("Order ownership mismatch:", {
                    orderId: String(order._id),
                    orderUserId,
                    loggedInUserId: userId,
                    role,
                });

                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to track this order",
                });
            }
        }

        // Delivery partner can track only orders assigned to them.
        if (role === "delivery") {
            const assignedPartner = await DeliveryPartner.findOne({
                user: userId,
                isActive: true,
            }).select("_id");

            if (
                !assignedPartner ||
                !order.deliveryPartner ||
                String(order.deliveryPartner) !== String(assignedPartner._id)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "This order is not assigned to you",
                });
            }
        }

        if (!["customer", "delivery", "admin"].includes(role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to track this order",
            });
        }

        // An order can exist before a delivery partner is assigned.
        if (!order.deliveryPartner) {
            return res.status(200).json({
                success: true,
                orderId: order._id,
                orderStatus: order.orderStatus,
                deliveryPartner: null,
                message: "Delivery partner has not been assigned yet",
            });
        }

        const deliveryPartner = await DeliveryPartner.findById(
            order.deliveryPartner
        ).select(
            "name vehicleType vehicleNumber currentLocation locationUpdatedAt isAvailable"
        );

        if (!deliveryPartner) {
            return res.status(200).json({
                success: true,
                orderId: order._id,
                orderStatus: order.orderStatus,
                deliveryPartner: null,
                message: "Delivery partner details are not available yet",
            });
        }

        return res.status(200).json({
            success: true,
            orderId: order._id,
            orderStatus: order.orderStatus,
            deliveryPartner: {
                id: deliveryPartner._id,
                name: deliveryPartner.name,
                vehicleType: deliveryPartner.vehicleType,
                vehicleNumber: deliveryPartner.vehicleNumber,
                currentLocation: deliveryPartner.currentLocation,
                locationUpdatedAt: deliveryPartner.locationUpdatedAt,
                isAvailable: deliveryPartner.isAvailable,
            },
        });
    } catch (error) {
        console.error("Get Live Delivery Location Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get delivery location",
        });
    }
};


// ======================================================
// UPDATE COD PAYMENT STATUS - ADMIN
// ======================================================

const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        if (paymentStatus !== "Paid") {
            return res.status(400).json({
                success: false,
                message: 'Only "Paid" status can be set through this route',
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.paymentMethod !== "COD") {
            return res.status(400).json({
                success: false,
                message: "This route is only for COD orders",
            });
        }

        if (order.orderStatus !== "Delivered") {
            return res.status(400).json({
                success: false,
                message: "Order must be delivered before marking COD as paid",
            });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(200).json({
                success: true,
                message: "Payment is already marked as Paid",
                order,
            });
        }

        order.paymentStatus = "Paid";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "COD payment status updated successfully",
            order,
        });
    } catch (error) {
        console.error("Update Payment Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update payment status",
        });
    }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    createOrder,

    getMyOrders,

    getOrderById,

    getAllOrders,

    updateOrderStatus,

    assignDeliveryPartner,

    getLiveDeliveryLocation,

    updatePaymentStatus,

    cancelOrder,

};