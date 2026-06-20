import Coupon from "../models/Coupon.js";
import ApiError from "../utils/ApiError.js";

/**
 * Coupon Service
 * --------------
 * Centralizes coupon validation + discount math so the same logic
 * can be reused by the "apply coupon" public endpoint and any future
 * checkout/booking flow.
 */

/**
 * Validates a coupon code: existence, active flag, expiry, and usage limit.
 * Throws ApiError with an appropriate status code if invalid.
 * @param {string} code
 * @returns {Promise<import("mongoose").Document>} the valid coupon document
 */
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

/**
 * Calculates the discounted price for a given coupon + base price.
 * @param {import("mongoose").Document} coupon
 * @param {number} price
 * @returns {{ discountAmount: number, finalPrice: number }}
 */
export const calculateCouponDiscount = (coupon, price) => {
    if (typeof price !== "number" || price < 0) {
        throw new ApiError(400, "A valid price is required to apply a coupon");
    }

    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
        discountAmount = (price * coupon.value) / 100;
    } else if (coupon.discountType === "flat") {
        discountAmount = coupon.value;
    }

    // Discount can never exceed the price itself
    discountAmount = Math.min(discountAmount, price);
    const finalPrice = Math.max(0, price - discountAmount);

    return { discountAmount, finalPrice };
};

/**
 * Increments a coupon's usedCount. Call this only after a successful
 * application of the coupon to an actual booking/order.
 * @param {import("mongoose").Document} coupon
 */
export const incrementCouponUsage = async (coupon) => {
    coupon.usedCount += 1;
    await coupon.save();
    return coupon;
};
