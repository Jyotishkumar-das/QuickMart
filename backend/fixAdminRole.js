const dotenv = require("dotenv");
const mongoose = require("mongoose");

const User = require("./models/User");

dotenv.config();

const fixAdminRole = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected ✅");

        const user = await User.findOne({
            name: "QuickMart Admin",
        });

        if (!user) {
            console.log("Admin user not found ❌");
            process.exit(1);
        }

        user.role = "admin";
        user.isActive = true;

        await user.save();

        console.log("================================");
        console.log("Admin role fixed successfully ✅");
        console.log("Name:", user.name);
        console.log("Role:", user.role);
        console.log("================================");

        process.exit(0);
    } catch (error) {
        console.error("Fix Admin Role Error:", error.message);
        process.exit(1);
    }
};

fixAdminRole();