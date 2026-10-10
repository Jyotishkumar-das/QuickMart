const dotenv = require("dotenv");
const mongoose = require("mongoose");

const User = require("./models/User");
const DeliveryPartner = require("./models/DeliveryPartner");

dotenv.config();

const linkDeliveryPartner = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected ✅");

        // Find existing delivery partner
        const deliveryPartner = await DeliveryPartner.findOne({
            phone: "9777118623",
        });

        if (!deliveryPartner) {
            console.log("Delivery partner not found ❌");
            process.exit(1);
        }

        // Find existing user
        let user = await User.findOne({
            phone: deliveryPartner.phone,
        });

        // Create delivery user if not found
        if (!user) {
            user = await User.create({
                name: deliveryPartner.name,
                phone: deliveryPartner.phone,
                role: "delivery",
                isActive: true,
            });

            console.log("Delivery User created successfully ✅");
        } else {
            // Make sure existing user has delivery role
            user.role = "delivery";
            user.isActive = true;

            await user.save();

            console.log("Existing User updated to delivery role ✅");
        }

        // Link User to DeliveryPartner
        deliveryPartner.user = user._id;

        await deliveryPartner.save();

        console.log("====================================");
        console.log("Delivery Partner linked successfully ✅");
        console.log("Name:", deliveryPartner.name);
        console.log("Phone:", deliveryPartner.phone);
        console.log("User ID:", user._id);
        console.log("Role:", user.role);
        console.log("Delivery Partner ID:", deliveryPartner._id);
        console.log("====================================");

        process.exit(0);
    } catch (error) {
        console.error(
            "Link Delivery Partner Error:",
            error.message
        );

        process.exit(1);
    }
};

linkDeliveryPartner();