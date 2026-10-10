const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const User = require("./models/User");

const createCustomer = async () => {
    try {
        await connectDB();

        const phone = "9000000001";

        const existingUser = await User.findOne({
            phone,
        });

        if (existingUser) {
            console.log("Customer already exists ✅");
            console.log("Name:", existingUser.name);
            console.log("Role:", existingUser.role);
            console.log("User ID:", existingUser._id);

            process.exit(0);
        }

        const customer = await User.create({
            name: "QuickMart Customer",
            phone,
            role: "customer",
            isActive: true,
        });

        console.log("\n====================================");
        console.log("CUSTOMER CREATED ✅");
        console.log("====================================");
        console.log("Name:", customer.name);
        console.log("Phone:", customer.phone);
        console.log("Role:", customer.role);
        console.log("User ID:", customer._id);
        console.log("====================================\n");

        process.exit(0);

    } catch (error) {
        console.error("Create Customer Error:", error);
        process.exit(1);
    }
};

createCustomer();