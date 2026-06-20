/**
 * Loyalty Service
 * ----------------
 * Encapsulates the "Regular Customer" loyalty logic so it can be reused
 * across controllers (e.g. after a booking is recorded, or when
 * calculating a final checkout price).
 *
 * Tier rules (configurable via .env):
 *   - bookings >= LOYALTY_BOOKING_THRESHOLD  -> "regular" tier, gets automatic % discount
 *   - bookings >= LOYALTY_BOOKING_THRESHOLD * 2 -> "premium" tier (bonus tier, higher discount)
 *   - otherwise -> "new" tier, no automatic discount
 */

const BASE_THRESHOLD = Number(process.env.LOYALTY_BOOKING_THRESHOLD) || 5;
const BASE_DISCOUNT_PERCENT = Number(process.env.LOYALTY_DISCOUNT_PERCENT) || 10;

/**
 * Determines the loyalty tier based on total completed bookings.
 * @param {number} totalBookings
 * @returns {"new" | "regular" | "premium"}
 */
export const calculateLoyaltyTier = (totalBookings = 0) => {
    if (totalBookings >= BASE_THRESHOLD * 2) return "premium";
    if (totalBookings >= BASE_THRESHOLD) return "regular";
    return "new";
};

/**
 * Returns the automatic discount percentage a user is entitled to,
 * based on their loyalty tier.
 * @param {"new" | "regular" | "premium"} tier
 * @returns {number} discount percentage (0-100)
 */
export const getLoyaltyDiscountPercent = (tier) => {
    switch (tier) {
        case "premium":
            return BASE_DISCOUNT_PERCENT * 2; // premium customers get double discount
        case "regular":
            return BASE_DISCOUNT_PERCENT;
        default:
            return 0;
    }
};

/**
 * Updates a user document's loyalty fields after a new booking/purchase.
 * Mutates and saves the user document.
 * @param {import("mongoose").Document} user - Mongoose User document
 * @param {number} amountSpent - amount spent in this booking
 */
export const updateUserLoyalty = async (user, amountSpent = 0) => {
    user.totalBookings += 1;
    user.totalSpent += amountSpent;
    user.loyaltyTier = calculateLoyaltyTier(user.totalBookings);
    await user.save();
    return user;
};

/**
 * Applies the user's loyalty discount to a given price.
 * @param {number} price
 * @param {"new" | "regular" | "premium"} tier
 * @returns {{ discountPercent: number, discountedPrice: number }}
 */
export const applyLoyaltyDiscount = (price, tier) => {
    const discountPercent = getLoyaltyDiscountPercent(tier);
    const discountedPrice = Math.max(0, price - (price * discountPercent) / 100);
    return { discountPercent, discountedPrice };
};
