import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        package: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Package",
            required: [true, "Package is required"],
        },
        // ✅ NEW: Track which coupon was used
        couponCode: {
            type: String,
            trim: true,
            default: null,
        },
        // ✅ NEW: Track discount applied
        couponDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: [true, "Total amount is required"],
            min: [0, "Total amount cannot be negative"],
        },
        paymentMethod: {
            type: String,
            enum: ["bkash", "nagad"],
            required: [true, "Payment method is required"],
        },
        senderNumber: {
            type: String,
            required: [true, "Sender number is required for manual verification"],
            trim: true,
        },
        transactionId: {
            type: String,
            required: [true, "Transaction ID is required"],
            unique: true,
            trim: true,
            index: true, // Explicit index for performance
        },
        bookingStatus: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "pending",
        },
        paymentStatus: {
            type: String,
            enum: ["unverified", "paid", "failed"],
            default: "unverified",
        },
        adminNote: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { timestamps: true },
);

// Compound index for user + status queries
bookingSchema.index({ user: 1, bookingStatus: 1, createdAt: -1 });
// Index for admin filtering
bookingSchema.index({ bookingStatus: 1, createdAt: -1 });
// Index for package lookup
bookingSchema.index({ package: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
