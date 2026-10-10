
const express = require("express");

const {
    createDeliveryPartner,
    getDeliveryPartners,
    getDeliveryPartnerById,
    updateDeliveryPartner,
    deleteDeliveryPartner,
    updateDeliveryPartnerLocation,
} = require("../controllers/deliveryPartnerController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==============================================
// CREATE DELIVERY PARTNER - ADMIN
// ==============================================
router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    createDeliveryPartner
);

// ==============================================
// GET ALL DELIVERY PARTNERS - ADMIN
// ==============================================
router.get(
    "/",
    protect,
    authorizeRoles("admin"),
    getDeliveryPartners
);

// ==============================================
// UPDATE OWN LOCATION - DELIVERY PARTNER
// ==============================================
router.put(
    "/my-location",
    protect,
    authorizeRoles("delivery"),
    updateDeliveryPartnerLocation
);

// ==============================================
// GET SINGLE DELIVERY PARTNER - ADMIN
// ==============================================
router.get(
    "/:id",
    protect,
    authorizeRoles("admin"),
    getDeliveryPartnerById
);

// ==============================================
// UPDATE DELIVERY PARTNER - ADMIN
// ==============================================
router.put(
    "/:id",
    protect,
    authorizeRoles("admin"),
    updateDeliveryPartner
);

// ==============================================
// DELETE DELIVERY PARTNER - ADMIN
// ==============================================
router.delete(
    "/:id",
    protect,
    authorizeRoles("admin"),
    deleteDeliveryPartner
);

module.exports = router;
