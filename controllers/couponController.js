import Coupon from "../models/Coupon.js";
import Package from "../models/Package.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validateCoupon, calculateCouponDiscount } from "../services/couponService.js";
import { calculateLoyaltyTier, applyLoyaltyDiscount } from "../services/loyaltyService.js";

/**
 * @desc    Validate & apply a coupon code to a given price.
 *          Also stacks the user's loyalty discount on top if authenticated,
 *          but coupon validity/usage rules are always enforced first.
 * @route   POST /api/coupons/apply
 * @access  Public (loyalty discount applied only if req.user exists)
 * @body    { code: string, price: number }
 */
export const applyCoupon = asyncHandler(async (req, res) => {
    const { code, price } = req.body;

    if (price === undefined) {
        throw new ApiError(400, "Price is required to apply a coupon");
    }

    // 1. Validate coupon (throws ApiError if invalid/expired/exhausted)
    const coupon = await validateCoupon(code);

    // 2. Calculate coupon discount
    const { discountAmount, finalPrice: priceAfterCoupon } = calculateCouponDiscount(coupon, price);

    // 3. Stack loyalty discount on top, if user is authenticated
    let loyaltyInfo = { discountPercent: 0, discountedPrice: priceAfterCoupon };
    if (req.user) {
        const tier = calculateLoyaltyTier(req.user.totalBookings);
        loyaltyInfo = applyLoyaltyDiscount(priceAfterCoupon, tier);
    }

    // NOTE: We do NOT increment usedCount here — that should happen only
    // when the coupon is actually consumed as part of a confirmed booking,
    // to avoid inflating usage counts from price-preview calls.

    res.status(200).json({
        success: true,
        message: "Coupon applied successfully",
        data: {
            originalPrice: price,
            couponDiscount: discountAmount,
            priceAfterCoupon,
            loyaltyDiscountPercent: loyaltyInfo.discountPercent,
            finalPrice: loyaltyInfo.discountedPrice,
        },
    });
});

/**
 * @desc    Get all coupons
 * @route   GET /api/admin/coupons
 * @access  Private/Admin
 */
export const getAllCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
});

/**
 * @desc    Create a new coupon
 * @route   POST /api/admin/coupons
 * @access  Private/Admin
 */
export const createCoupon = asyncHandler(async (req, res) => {
    const { code, discountType, value, expiryDate, usageLimit } = req.body;

    if (!code || !discountType || value === undefined || !expiryDate || !usageLimit) {
        throw new ApiError(
            400,
            "code, discountType, value, expiryDate and usageLimit are required",
        );
    }

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
        throw new ApiError(409, "A coupon with this code already exists");
    }

    const coupon = await Coupon.create({
        code,
        discountType,
        value,
        expiryDate,
        usageLimit,
    });

    res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        data: coupon,
    });
});

/**
 * @desc    Update a coupon
 * @route   PUT /api/admin/coupons/:id
 * @access  Private/Admin
 */
export const updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) throw new ApiError(404, "Coupon not found");

    const updatableFields = [
        "code",
        "discountType",
        "value",
        "expiryDate",
        "usageLimit",
        "isActive",
    ];

    updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            coupon[field] = req.body[field];
        }
    });

    await coupon.save();

    res.status(200).json({
        success: true,
        message: "Coupon updated successfully",
        data: coupon,
    });
});

/**
 * @desc    Delete a coupon
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private/Admin
 */
export const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) throw new ApiError(404, "Coupon not found");

    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
});

export const applyCouponToPackage = asyncHandler(async (req, res) => {
  const { code, packageId } = req.body;

  const pkg = await Package.findById(packageId);
  if (!pkg) throw new ApiError(404, "Package not found");

  const coupon = await validateCoupon(code);

  // ✅ always use discountedPrice, never the deprecated `price` field
  const { discountAmount, finalPrice } = calculateCouponDiscount(coupon, pkg.discountedPrice);

  res.status(200).json({
    success: true,
    data: { originalPrice: pkg.discountedPrice, discountAmount, finalPrice },
  });
});