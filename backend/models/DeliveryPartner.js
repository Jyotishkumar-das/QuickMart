const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema(
    {
        // Linked login account
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        vehicleType: {
            type: String,
            enum: ["Bike", "Scooter", "Cycle"],
            default: "Bike",
        },

        vehicleNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },

        isAvailable: {
            type: Boolean,
            default: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        // Current GPS location
        currentLocation: {
            latitude: {
                type: Number,
                default: null,
            },

            longitude: {
                type: Number,
                default: null,
            },
        },

        // Last time GPS location was updated
        locationUpdatedAt: {
            type: Date,
            default: null,
        },

        totalDeliveries: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const DeliveryPartner = mongoose.model(
    "DeliveryPartner",
    deliveryPartnerSchema
);

module.exports = DeliveryPartner;