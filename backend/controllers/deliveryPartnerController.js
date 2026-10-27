
const User = require("../models/User");
const DeliveryPartner = require("../models/DeliveryPartner");

// ======================================================
// CREATE DELIVERY PARTNER - ADMIN
// POST /api/delivery-partners
// ======================================================
const createDeliveryPartner = async (req, res) => {
    try {
        const { name, phone, vehicleType, vehicleNumber } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: "Name and phone are required",
            });
        }

        const cleanPhone = String(phone).trim();

        const existingPartner = await DeliveryPartner.findOne({
            phone: cleanPhone,
        });

        if (existingPartner) {
            return res.status(409).json({
                success: false,
                message: "Delivery partner already exists",
            });
        }

        const user = await User.findOne({ phone: cleanPhone });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found. Register the delivery user first.",
            });
        }

        if (user.role !== "delivery") {
            return res.status(400).json({
                success: false,
                message:
                    "This account is not a delivery account. Register or configure a dedicated delivery user first.",
            });
        }

        const existingLinkedPartner = await DeliveryPartner.findOne({
            user: user._id,
        });

        if (existingLinkedPartner) {
            return res.status(409).json({
                success: false,
                message: "This user already has a delivery partner profile.",
            });
        }

        const deliveryPartner = await DeliveryPartner.create({
            user: user._id,
            name: String(name).trim(),
            phone: cleanPhone,
            vehicleType: vehicleType || "Bike",
            vehicleNumber: vehicleNumber
                ? String(vehicleNumber).trim().toUpperCase()
                : undefined,
        });

        return res.status(201).json({
            success: true,
            message: "Delivery partner created successfully",
            deliveryPartner,
        });
    } catch (error) {
        console.error("Create Delivery Partner Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create delivery partner",
        });
    }
};

// ======================================================
// GET ALL DELIVERY PARTNERS - ADMIN
// GET /api/delivery-partners
// ======================================================
const getDeliveryPartners = async (req, res) => {
    try {
        const deliveryPartners = await DeliveryPartner.find()
            .populate("user", "name phone role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: deliveryPartners.length,
            deliveryPartners,
        });
    } catch (error) {
        console.error("Get Delivery Partners Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch delivery partners",
        });
    }
};

// ======================================================
// GET SINGLE DELIVERY PARTNER - ADMIN
// GET /api/delivery-partners/:id
// ======================================================
const getDeliveryPartnerById = async (req, res) => {
    try {
        const deliveryPartner = await DeliveryPartner.findById(req.params.id)
            .populate("user", "name phone role");

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner not found",
            });
        }

        return res.status(200).json({
            success: true,
            deliveryPartner,
        });
    } catch (error) {
        console.error("Get Delivery Partner Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch delivery partner",
        });
    }
};

// ======================================================
// UPDATE DELIVERY PARTNER - ADMIN
// PUT /api/delivery-partners/:id
// ======================================================
const updateDeliveryPartner = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "phone",
            "vehicleType",
            "vehicleNumber",
            "isAvailable",
            "isActive",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.name !== undefined) {
            updates.name = String(updates.name).trim();
        }

        if (updates.phone !== undefined) {
            updates.phone = String(updates.phone).trim();
        }

        if (updates.vehicleNumber !== undefined) {
            updates.vehicleNumber = String(updates.vehicleNumber)
                .trim()
                .toUpperCase();
        }

        const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate("user", "name phone role");

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Delivery partner updated successfully",
            deliveryPartner,
        });
    } catch (error) {
        console.error("Update Delivery Partner Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update delivery partner",
        });
    }
};

// ======================================================
// DEACTIVATE DELIVERY PARTNER - ADMIN
// DELETE /api/delivery-partners/:id
// ======================================================
const deleteDeliveryPartner = async (req, res) => {
    try {
        const deliveryPartner = await DeliveryPartner.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive: false, isAvailable: false } },
            { new: true }
        );

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Delivery partner deactivated successfully",
            deliveryPartner,
        });
    } catch (error) {
        console.error("Delete Delivery Partner Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to deactivate delivery partner",
        });
    }
};

// ======================================================
// UPDATE DELIVERY PARTNER LOCATION - DELIVERY USER
// PUT /api/delivery-partners/location
// ======================================================
const updateDeliveryPartnerLocation = async (req, res) => {
    try {
        const latitude = Number(req.body.latitude);
        const longitude = Number(req.body.longitude);

        if (
            req.body.latitude === undefined ||
            req.body.longitude === undefined ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid latitude and longitude are required",
            });
        }

        if (!req.user?.userId || req.user.role !== "delivery") {
            return res.status(403).json({
                success: false,
                message: "Only an authenticated delivery partner can update location",
            });
        }

        const deliveryPartner = await DeliveryPartner.findOne({
            user: req.user.userId,
            isActive: true,
        });

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Active delivery partner profile not found",
            });
        }

        deliveryPartner.currentLocation = {
            latitude,
            longitude,
        };

        deliveryPartner.locationUpdatedAt = new Date();

        await deliveryPartner.save();

        return res.status(200).json({
            success: true,
            message: "Location updated successfully",
            currentLocation: deliveryPartner.currentLocation,
            locationUpdatedAt: deliveryPartner.locationUpdatedAt,
        });
    } catch (error) {
        console.error("Update Delivery Partner Location Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update delivery partner location",
        });
    }
};

module.exports = {
    createDeliveryPartner,
    getDeliveryPartners,
    getDeliveryPartnerById,
    updateDeliveryPartner,
    deleteDeliveryPartner,
    updateDeliveryPartnerLocation,
};
