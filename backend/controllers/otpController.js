
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const cleanPhoneNumber = (phone) => {
    return String(phone).trim();
};

const isValidPhoneNumber = (phone) => /^\d{10}$/.test(phone);

// ==============================================
// SEND OTP
// ==============================================
const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || !isValidPhoneNumber(String(phone).trim())) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 10-digit mobile number",
            });
        }

        const cleanPhone = cleanPhoneNumber(phone);

        // Demo mode must be explicitly enabled and restricted
        // to one private test number configured on Render.
        const demoMode = process.env.DEMO_OTP_MODE === "true";
        const demoPhone = process.env.DEMO_OTP_PHONE;

        if (demoMode && !demoPhone) {
            console.error("Demo OTP mode requires DEMO_OTP_PHONE");

            return res.status(500).json({
                success: false,
                message: "Demo OTP configuration is incomplete",
            });
        }

        if (demoMode && cleanPhone !== demoPhone.trim()) {
            return res.status(403).json({
                success: false,
                message: "Demo OTP is available only for the configured test number",
            });
        }

        // Do not generate or store an OTP unless the request
        // is permitted by the current demo configuration.
        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        await OTP.deleteMany({ phone: cleanPhone });

        await OTP.create({
            phone: cleanPhone,
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
        });

        // Never return the OTP in the API response.
        // Log it only in restricted demo mode for the test number.
        // Keep Render dashboard access private.
        if (demoMode && cleanPhone === demoPhone.trim()) {
            console.log(`[QUICKMART DEMO OTP] ${otp}`);
        } else if (process.env.NODE_ENV !== "production") {
            console.log(`[Development OTP] ${otp}`);
        }

        return res.status(200).json({
            success: true,
            message: demoMode
                ? "Demo OTP generated. Check the private backend logs."
                : "OTP generated successfully. Please verify your OTP.",
        });
    } catch (error) {
        // Avoid logging request bodies, phone numbers, or OTPs.
        console.error("Send OTP failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to generate OTP",
        });
    }
};

// ==============================================
// VERIFY OTP
// ==============================================
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (
            !phone ||
            !isValidPhoneNumber(String(phone).trim()) ||
            otp === undefined ||
            otp === null ||
            !/^\d{6}$/.test(String(otp).trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 10-digit mobile number and 6-digit OTP",
            });
        }

        const cleanPhone = cleanPhoneNumber(phone);
        const cleanOtp = String(otp).trim();

        // Restrict verification to the configured test number
        // while demo mode is enabled.
        const demoMode = process.env.DEMO_OTP_MODE === "true";
        const demoPhone = process.env.DEMO_OTP_PHONE;

        if (demoMode && (!demoPhone || cleanPhone !== demoPhone.trim())) {
            return res.status(403).json({
                success: false,
                message: "Demo OTP is available only for the configured test number",
            });
        }

        const otpRecord = await OTP.findOne({
            phone: cleanPhone,
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP.",
            });
        }

        if (otpRecord.expiresAt <= new Date()) {
            await OTP.deleteOne({ _id: otpRecord._id });

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP.",
            });
        }

        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });

            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);

        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
                attemptsRemaining: Math.max(0, 5 - otpRecord.attempts),
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");

            return res.status(500).json({
                success: false,
                message: "Authentication configuration error",
            });
        }

        // Find an existing user or create a new customer.
        let user = await User.findOne({ phone: cleanPhone });
        let isNewCustomer = false;

        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString("hex");
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
                name: `Customer ${cleanPhone.slice(-4)}`,
                phone: cleanPhone,
                password: hashedPassword,
                role: "customer",
                isActive: true,
            });

            isNewCustomer = true;
        }

        if (user.isActive === false) {
            await OTP.deleteOne({ _id: otpRecord._id });

            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // OTP is single-use.
        await OTP.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({
            success: true,
            message: isNewCustomer
                ? "Registration and login successful"
                : "OTP verified successfully",
            isNewCustomer,
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Verify OTP failed:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This mobile number already has an account. Please request OTP again.",
            });
        }

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
