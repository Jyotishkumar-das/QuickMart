const express = require("express");

const {
    getAssignedOrders,
    acceptOrder,
    updateDeliveryStatus,
} = require("../controllers/deliveryController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// GET ASSIGNED ORDERS
// ======================================================
router.get(
    "/assigned-orders",
    protect,
    authorizeRoles("delivery"),
    getAssignedOrders
);


// ======================================================
// ACCEPT ORDER
// ======================================================
router.put(
    "/orders/:id/accept",
    protect,
    authorizeRoles("delivery"),
    acceptOrder
);


// ======================================================
// UPDATE DELIVERY STATUS
// ======================================================
router.put(
    "/orders/:id/status",
    protect,
    authorizeRoles("delivery"),
    updateDeliveryStatus
);

module.exports = router;