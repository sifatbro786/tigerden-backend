import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB using Mongoose.
 * Exits process on failure to prevent the app from running without a DB.
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
