
const express = require("express");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    assignDeliveryPartner,
    getLiveDeliveryLocation,
    cancelOrder,
} = require("../controllers/orderController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =============================================
// CUSTOMER: CREATE ORDER
// POST /api/orders
// =============================================
router.post("/", protect, createOrder);

// =============================================
// CUSTOMER: GET MY ORDERS
// GET /api/orders/my-orders
// =============================================
router.get("/my-orders", protect, getMyOrders);

// =============================================
// CUSTOMER: CANCEL ORDER
// PUT /api/orders/:id/cancel
// =============================================
router.put("/:id/cancel", protect, cancelOrder);

// =============================================
// ADMIN: GET ALL ORDERS
// GET /api/orders
// =============================================
router.get("/", protect, authorizeRoles("admin"), getAllOrders);

// =============================================
// ADMIN: UPDATE ORDER STATUS
// PUT /api/orders/:id/status
// =============================================
router.put(
    "/:id/status",
    protect,
    authorizeRoles("admin"),
    updateOrderStatus
);

// =============================================
// ADMIN: UPDATE COD PAYMENT STATUS
// PUT /api/orders/:id/payment
// =============================================
router.put(
    "/:id/payment",
    protect,
    authorizeRoles("admin"),
    updatePaymentStatus
);

// =============================================
// ADMIN: ASSIGN DELIVERY PARTNER
// PUT /api/orders/:id/assign-delivery
// =============================================
router.put(
    "/:id/assign-delivery",
    protect,
    authorizeRoles("admin"),
    assignDeliveryPartner
);

// =============================================
// AUTHENTICATED USER: LIVE DELIVERY LOCATION
// GET /api/orders/:id/live-location
// =============================================
router.get(
    "/:id/live-location",
    protect,
    getLiveDeliveryLocation
);

// =============================================
// AUTHENTICATED USER: GET SINGLE ORDER
// GET /api/orders/:id
// =============================================
router.get("/:id", protect, getOrderById);

module.exports = router;
