import Booking from "../models/Booking.js";
import Package from "../models/Package.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendBookingConfirmationEmail } from "../services/emailService.js";

const VALID_PAYMENT_METHODS = ["bkash", "nagad"];

// const VALID_STATUS_TRANSITIONS = {
//     pending: {
//         to: ["confirmed", "cancelled"],
//         paymentStatus: ["unverified", "paid", "failed"],
//     },
//     confirmed: {
//         to: ["cancelled"], // Can cancel a confirmed booking
//         paymentStatus: ["paid"],
//     },
//     cancelled: {
//         to: [], // Terminal state - no further transitions
//         paymentStatus: ["failed"],
//     },
// };

/**
 * @desc    Create a new booking (manual payment submission)
 * @route   POST /api/bookings
 * @access  Private (logged-in user)
 * @body    { packageId, paymentMethod, senderNumber, transactionId }
 */
export const createBooking = asyncHandler(async (req, res) => {
    const { packageId, paymentMethod, senderNumber, transactionId } = req.body;

    if (!packageId || !paymentMethod || !senderNumber || !transactionId) {
        throw new ApiError(
            400,
            "packageId, paymentMethod, senderNumber and transactionId are required",
        );
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        throw new ApiError(
            400,
            `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(", ")}`,
        );
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
        throw new ApiError(404, "Package not found");
    }

    // Guard against duplicate/replayed transaction IDs before hitting the
    // unique-index error, so we can give a clean message.
    const existing = await Booking.findOne({ transactionId: transactionId.trim() });
    if (existing) {
        throw new ApiError(409, "This transaction ID has already been submitted");
    }

    const booking = await Booking.create({
        user: req.user._id,
        package: pkg._id,
        totalAmount: pkg.discountedPrice,
        paymentMethod,
        senderNumber,
        transactionId: transactionId.trim(),
    });

    res.status(201).json({
        success: true,
        message: "Booking submitted. We'll verify your payment shortly.",
        data: booking,
    });
});

/**
 * @desc    Get the logged-in user's own bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private (logged-in user)
 */
export const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("package", "title price images duration")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
    });
});

/**
 * @desc    Get all bookings (admin overview)
 * @route   GET /api/admin/bookings
 * @access  Private/Admin
 */
export const getAllBookings = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status) filter.bookingStatus = status;

    const bookings = await Booking.find(filter)
        .populate("user", "name email")
        .populate("package", "title price")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
    });
});

/**
 * @desc    Admin manually verifies a payment and confirms the booking.
 *          Sends a booking-confirmation email automatically.
 * @route   PATCH /api/admin/bookings/:id/verify
 * @access  Private/Admin
 * @body    { adminNote? }
 */
export const adminVerifyPayment = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // Validate state
    if (booking.bookingStatus === "confirmed") {
        throw new ApiError(400, "This booking has already been confirmed");
    }
    if (booking.bookingStatus === "cancelled") {
        throw new ApiError(400, "Cannot confirm a cancelled booking");
    }

    // ✅ 1. ATOMICALLY INCREMENT COUPON USAGE (if coupon was applied)
    if (booking.couponCode) {
        try {
            const coupon = await Coupon.findOne({
                code: booking.couponCode.toUpperCase(),
            });

            if (coupon) {
                await incrementCouponUsage(coupon._id);
            }
        } catch (error) {
            // ❌ If coupon increment fails, reject the booking confirmation
            // This prevents oversubscription
            throw new ApiError(400, `Failed to apply coupon: ${error.message}`);
        }
    }

    // ✅ 2. UPDATE USER LOYALTY (after successful booking)
    const user = await User.findById(booking.user);
    if (user) {
        await updateUserLoyalty(user, booking.totalAmount);
    }

    // ✅ 3. UPDATE BOOKING STATUS
    const updatedBooking = await Booking.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                bookingStatus: "confirmed",
                paymentStatus: "paid",
                adminNote: req.body.adminNote || booking.adminNote,
                confirmedAt: new Date(),
            },
        },
        {
            new: true,
            runValidators: true,
        },
    )
        .populate("user", "name email")
        .populate("package", "title price");

    // ✅ 4. SEND CONFIRMATION EMAIL (non-blocking)
    if (updatedBooking.user?.email) {
        setImmediate(() => {
            sendBookingConfirmationEmail(updatedBooking.user.email, updatedBooking.user.name, {
                packageTitle: updatedBooking.package?.title?.en || "Your Package",
                totalAmount: updatedBooking.totalAmount,
                transactionId: updatedBooking.transactionId,
            }).catch((error) => {
                console.error(`[EMAIL_FAILURE] Booking ${updatedBooking._id}:`, error.message);
            });
        });
    }

    res.status(200).json({
        success: true,
        message: "Payment verified and booking confirmed.",
        data: updatedBooking,
    });
});

/**
 * @desc    Admin rejects/cancels a booking (e.g. fraudulent transaction ID)
 * @route   PATCH /api/admin/bookings/:id/reject
 * @access  Private/Admin
 * @body    { adminNote? }
 */
export const adminRejectBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                bookingStatus: "cancelled",
                paymentStatus: "failed",
                adminNote: req.body.adminNote || booking.adminNote,
                rejectedAt: new Date(),
            },
        },
        { new: true, runValidators: true },
    );

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    res.status(200).json({
        success: true,
        message: "Booking rejected",
        data: booking,
    });
});
