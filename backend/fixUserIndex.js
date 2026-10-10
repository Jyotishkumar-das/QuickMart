const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const fixUserIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB Connected ✅");

        const indexes = await mongoose.connection
            .collection("users")
            .indexes();

        console.log("\nCurrent indexes:");

        indexes.forEach((index) => {
            console.log(index.name);
        });

        const emailIndex = indexes.find(
            (index) => index.name === "email_1"
        );

        if (!emailIndex) {
            console.log("\nemail_1 index not found.");
            console.log("Nothing to remove.");
        } else {
            await mongoose.connection
                .collection("users")
                .dropIndex("email_1");

            console.log(
                "\nOld email_1 index removed successfully ✅"
            );
        }

        await mongoose.disconnect();

        console.log("MongoDB disconnected.");
        process.exit(0);

    } catch (error) {
        console.error(
            "Index Fix Error:",
            error
        );

        await mongoose.disconnect();

        process.exit(1);
    }
};

fixUserIndex();