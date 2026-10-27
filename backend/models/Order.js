const mongoose = require("mongoose");

// ======================================================
// ORDER ITEM
// ======================================================
const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            default: "",
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        unit: {
            type: String,
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

// ======================================================
// SHIPPING ADDRESS
// ======================================================
const addressSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        addressLine: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

// ======================================================
// ORDER SCHEMA
// ======================================================
const orderSchema = new mongoose.Schema(
    {
        // CUSTOMER
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // ORDER ITEMS
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "Order must contain at least one product",
            },
        },

        // SHIPPING ADDRESS
        shippingAddress: {
            type: addressSchema,
            required: true,
        },

        // PRICE DETAILS
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        deliveryFee: {
            type: Number,
            default: 0,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        // PAYMENT METHOD
        paymentMethod: {
            type: String,
            enum: ["COD", "ONLINE"],
            default: "COD",
        },

        // PAYMENT STATUS
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending",
        },

        // RAZORPAY DETAILS
        razorpayOrderId: {
            type: String,
            default: null,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            default: null,
        },

        // ORDER STATUS
        orderStatus: {
            type: String,
            enum: [
                "Confirmed",
                "Preparing",
                "Out for Delivery",
                "Delivered",
                "Cancelled",
            ],
            default: "Confirmed",
        },

        // DELIVERY PARTNER
        deliveryPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeliveryPartner",
            default: null,
        },

        // DELIVERY TIME
        estimatedDeliveryTime: {
            type: Date,
            default: null,
        },

        // DELIVERY COMPLETION
        deliveredAt: {
            type: Date,
            default: null,
        },

        // CANCELLATION
        cancelledAt: {
            type: Date,
            default: null,
        },
        cancellationReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// ======================================================
// MODEL
// ======================================================
module.exports = mongoose.model("Order", orderSchema);