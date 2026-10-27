
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Check authentication first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login.",
            });
        }

        // Normalize role strings before comparison
        const userRole = String(req.user.role || "")
            .trim()
            .toLowerCase();

        const permittedRoles = allowedRoles.map((role) =>
            String(role).trim().toLowerCase()
        );

        if (!permittedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You don't have permission.",
                // Safe diagnostic information; no token is exposed.
                userRole: userRole || "missing",
                requiredRoles: permittedRoles,
            });
        }

        return next();
    };
};

module.exports = authorizeRoles;
