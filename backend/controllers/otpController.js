
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");

// Generate a 6-digit OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// Clean phone number
const cleanPhoneNumber = (phone) => {
    return String(phone).trim();
};

// ==============================================
// SEND OTP
// ==============================================
const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Mobile number is required",
            });
        }

        const cleanPhone = cleanPhoneNumber(phone);

        const user = await User.findOne({
            phone: cleanPhone,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Mobile number is not registered",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            });
        }

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        // Remove previous OTPs
        await OTP.deleteMany({
            phone: cleanPhone,
        });

        // Save new OTP with 5-minute expiry
        await OTP.create({
            phone: cleanPhone,
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
        });

        // Development only: OTP appears in backend terminal
        if (process.env.NODE_ENV !== "production") {
            console.log("Development OTP:", otp);
        }

        return res.status(200).json({
            success: true,
            message: "OTP generated successfully",
        });
    } catch (error) {
        console.error("Send OTP Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
        });
    }
};

// ==============================================
// VERIFY OTP
// ==============================================
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Mobile number and OTP are required",
            });
        }

        const cleanPhone = cleanPhoneNumber(phone);
        const cleanOtp = String(otp).trim();

        const user = await User.findOne({
            phone: cleanPhone,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Mobile number is not registered",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            });
        }

        const otpRecord = await OTP.findOne({
            phone: cleanPhone,
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP",
            });
        }

        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: otpRecord._id });

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP",
            });
        }

        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });

            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please request a new OTP",
            });
        }

        const isMatch = await bcrypt.compare(
            cleanOtp,
            otpRecord.otpHash
        );

        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
                attemptsRemaining: 5 - otpRecord.attempts,
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");

            return res.status(500).json({
                success: false,
                message: "Authentication configuration error",
            });
        }

        // Include user ID and role in JWT
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        await OTP.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Verify OTP Error:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed",
        });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
};
