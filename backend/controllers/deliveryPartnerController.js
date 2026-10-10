const User = require("../models/User");
const DeliveryPartner = require("../models/DeliveryPartner");

// ======================================================
// CREATE DELIVERY PARTNER - ADMIN
// ======================================================
const createDeliveryPartner = async (req, res) => {
    try {
        const {
            name,
            phone,
            vehicleType,
            vehicleNumber,
        } = req.body;

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

        const user = await User.findOne({
            phone: cleanPhone,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "User account not found. Create/register the user first.",
            });
        }

        if (user.role !== "delivery") {
            return res.status(400).json({
                success: false,
                message:
                    "This user is not registered as a delivery partner. Use a dedicated delivery account.",
            });
        }

        const existingLinkedPartner = await DeliveryPartner.findOne({
            user: user._id,
        });

        if (existingLinkedPartner) {
            return res.status(409).json({
                success: false,
                message:
                    "This user already has a delivery partner profile.",
            });
        }

        const deliveryPartner = await DeliveryPartner.create({
            user: user._id,
            name: String(name).trim(),
            phone: cleanPhone,
            vehicleType,
            vehicleNumber,
        });

        return res.status(201).json({
            success: true,
            message: "Delivery partner linked successfully",
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
// ======================================================
const getDeliveryPartners = async (req, res) => {
    try {
        const deliveryPartners = await DeliveryPartner.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: deliveryPartners.length,
            deliveryPartners,
        });
    } catch (error) {
        console.error("Get Delivery Partners Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch delivery partners",
        });
    }
};

// ======================================================
// GET SINGLE DELIVERY PARTNER - ADMIN
// ======================================================
const getDeliveryPartnerById = async (req, res) => {
    try {
        const deliveryPartner = await DeliveryPartner.findById(
            req.params.id
        );

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner not found",
            });
        }

        res.status(200).json({
            success: true,
            deliveryPartner,
        });
    } catch (error) {
        console.error("Get Delivery Partner Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch delivery partner",
        });
    }
};

// ======================================================
// UPDATE DELIVERY PARTNER - ADMIN
// ======================================================
const updateDeliveryPartner = async (req, res) => {
    try {
        const deliveryPartner =
            await DeliveryPartner.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Delivery partner updated successfully",
            deliveryPartner,
        });
    } catch (error) {
        console.error("Update Delivery Partner Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update delivery partner",
        });
    }
};

// ======================================================
// DELETE DELIVERY PARTNER - ADMIN
// ======================================================
const deleteDeliveryPartner = async (req, res) => {
    try {
        const deliveryPartner =
            await DeliveryPartner.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            );

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Delivery partner deactivated successfully",
        });
    } catch (error) {
        console.error("Delete Delivery Partner Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete delivery partner",
        });
    }
};

const updateDeliveryPartnerLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number" ||
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

        const deliveryPartner = await DeliveryPartner.findOne({
            user: req.user.userId,
            isActive: true,
        });

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: "Delivery partner not found",
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