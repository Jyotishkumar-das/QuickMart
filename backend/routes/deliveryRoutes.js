
const express = require("express");

const {
    getAssignedOrders,
    acceptOrder,
    updateDeliveryStatus,
    updateDeliveryLocation,
    confirmCODPayment,
} = require("../controllers/deliveryController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// GET ASSIGNED ORDERS
router.get(
    "/assigned-orders",
    protect,
    authorizeRoles("delivery"),
    getAssignedOrders
);

// ACCEPT ORDER
router.put(
    "/orders/:id/accept",
    protect,
    authorizeRoles("delivery"),
    acceptOrder
);

// UPDATE DELIVERY STATUS
router.put(
    "/orders/:id/status",
    protect,
    authorizeRoles("delivery"),
    updateDeliveryStatus
);

// UPDATE DELIVERY PARTNER LOCATION
router.put(
    "/location",
    protect,
    authorizeRoles("delivery"),
    updateDeliveryLocation
);

// CONFIRM COD PAYMENT AFTER CASH COLLECTION
router.put(
    "/orders/:id/confirm-cod-payment",
    protect,
    authorizeRoles("delivery"),
    confirmCODPayment
);

module.exports = router;
