import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Coupon code is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },
        discountType: {
            type: String,
            enum: ["percentage", "flat"],
            required: [true, "Discount type is required"],
        },
        value: {
            type: Number,
            required: [true, "Discount value is required"],
            min: [0, "Value cannot be negative"],
            validate: {
                validator: function (v) {
                    // percentage discount cannot exceed 100
                    if (this.discountType === "percentage") return v <= 100;
                    return true;
                },
                message: "Percentage discount cannot exceed 100",
            },
        },
        expiryDate: {
            type: Date,
            required: [true, "Expiry date is required"],
        },
        usageLimit: {
            type: Number,
            required: [true, "Usage limit is required"],
            min: [1, "Usage limit must be at least 1"],
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
