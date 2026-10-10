const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            index: true,
        },

        otpHash: {
            type: String,
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        attempts: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Automatically delete OTP after expiry
otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;