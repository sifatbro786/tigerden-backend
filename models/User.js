import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Name is required"], trim: true },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ["user", "admin", "super_admin"],
            default: "user",
        },
        phone: { type: String, trim: true },

        // Loyalty
        totalBookings: { type: Number, default: 0, min: 0 },
        totalSpent: { type: Number, default: 0, min: 0 },
        loyaltyTier: { type: String, enum: ["new", "regular", "premium"], default: "new" },

        // Google OAuth
        authProvider: { type: String, enum: ["local", "google"], default: "local" },
        googleId: { type: String, default: null },

        // Forgot/Reset password (OTP)
        resetPasswordOTP: { type: String, select: false, default: null },
        resetPasswordExpires: { type: Date, select: false, default: null },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
