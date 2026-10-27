const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check Authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is missing.",
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                message: "Server configuration error.",
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.userId || !decoded.role) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload. Please login again.",
            });
        }

        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        return next();
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.name === "TokenExpiredError"
                        ? "Token expired. Please login again."
                        : "Invalid token. Please login again.",
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