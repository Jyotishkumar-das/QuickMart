
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected ✅");

        // Use a phone number you control that is not registered yet
        const adminPhone = "8984654863";

        const existingUser = await User.findOne({
            phone: adminPhone,
        });

        if (existingUser) {
            console.log("This phone number is already registered.");
            console.log("Role:", existingUser.role);
            process.exitCode = 1;
            return;
        }

        const admin = await User.create({
            name: "QuickMart Admin",
            phone: adminPhone,
            role: "admin",
        });

        console.log("Admin created successfully ✅");
        console.log("Phone:", admin.phone);
        console.log("Role:", admin.role);
    } catch (error) {
        console.error("Admin creation error:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();
