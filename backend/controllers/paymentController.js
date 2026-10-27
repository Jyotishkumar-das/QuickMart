const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order for an existing QuickMart order
const createPaymentOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Only the customer who owns this order or an admin can pay
        const userId = req.user?.userId;

        if (
            req.user?.role !== "admin" &&
            (!userId || order.user.toString() !== userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to pay for this order",
            });
        }

        if (order.paymentMethod !== "ONLINE") {
            return res.status(400).json({
                success: false,
                message: "This order is not configured for online payment",
            });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(400).json({
                success: false,
                message: "This order is already paid",
            });
        }

        if (
            order.orderStatus === "Cancelled" ||
            order.orderStatus === "Delivered"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment is not available for this order",
            });
        }

        const amountInPaise = Math.round(Number(order.totalAmount) * 100);

        if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount",
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: order._id.toString(),
            notes: {
                quickmartOrderId: order._id.toString(),
            },
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        return res.status(201).json({
            success: true,
            message: "Razorpay payment order created",
            keyId: process.env.RAZORPAY_KEY_ID,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            quickmartOrderId: order._id,
        });
    } catch (error) {
        console.error("Create Payment Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create payment order",
        });
    }
};

// Verify Razorpay Checkout signature
const verifyPayment = async (req, res) => {
    try {
        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (
            !orderId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Required payment details are missing",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const userId = req.user?.userId;

        if (
            req.user?.role !== "admin" &&
            (!userId || order.user.toString() !== userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to verify this order",
            });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
            });
        }

        if (order.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Razorpay order does not match",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const signatureBuffer = Buffer.from(
            expectedSignature,
            "hex"
        );
        const receivedBuffer = Buffer.from(
            razorpay_signature,
            "hex"
        );

        if (
            signatureBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, receivedBuffer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed",
            });
        }

        order.paymentStatus = "Paid";
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            orderId: order._id,
            paymentStatus: order.paymentStatus,
        });
    } catch (error) {
        console.error("Verify Payment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify payment",
        });
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
};