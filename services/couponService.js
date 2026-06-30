// couponService.js - Complete Implementation

import Coupon from "../models/Coupon.js";
import ApiError from "../utils/ApiError.js";

export const validateCoupon = async (code) => {
    if (!code) {
        throw new ApiError(400, "Coupon code is required");
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
        throw new ApiError(404, "Invalid coupon code");
    }

    if (!coupon.isActive) {
        throw new ApiError(400, "This coupon is no longer active");
    }

    if (coupon.expiryDate < new Date()) {
        throw new ApiError(400, "This coupon has expired");
    }

    if (coupon.usedCount >= coupon.usageLimit) {
        throw new ApiError(400, "This coupon has reached its usage limit");
    }

    return coupon;
};

export const calculateCouponDiscount = (coupon, price) => {
    if (typeof price !== "number" || price < 0) {
        throw new ApiError(400, "A valid price is required");
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
        discountAmount = (price * coupon.value) / 100;
    } else if (coupon.discountType === "flat") {
        discountAmount = coupon.value;
    }

    discountAmount = Math.min(discountAmount, price);
    const finalPrice = Math.max(0, price - discountAmount);
    return { discountAmount, finalPrice };
};

// ✅ ATOMIC INCREMENT - Safe for concurrent requests
export const incrementCouponUsage = async (couponId) => {
    const updated = await Coupon.findByIdAndUpdate(
        couponId,
        {
            $inc: { usedCount: 1 },
            $set: { updatedAt: new Date() },
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (!updated) {
        throw new ApiError(404, "Coupon not found");
    }

    // ✅ Check if we've exceeded the limit after increment
    if (updated.usedCount > updated.usageLimit) {
        // Optionally deactivate the coupon
        await Coupon.findByIdAndUpdate(couponId, {
            $set: { isActive: false },
        });
        throw new ApiError(400, "Coupon usage limit exceeded");
    }

    return updated;
};
