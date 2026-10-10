
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        // 1. Check Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login.",
            });
        }

        // 2. Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is missing.",
            });
        }

        // 3. Check JWT secret configuration
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                message: "Server configuration error.",
            });
        }

        // 4. Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 5. Validate required user information
        if (!decoded.userId || !decoded.role) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload. Please login again.",
            });
        }

        // 6. Attach authenticated user information
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        // 7. Continue to controller
        return next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again.",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please login again.",
            });
        }

        console.error("Authentication Error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication failed.",
        });
    }
};

module.exports = protect;
