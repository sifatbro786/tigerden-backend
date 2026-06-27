import Booking from "../models/Booking.js";
import Package from "../models/Package.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendBookingConfirmationEmail } from "../services/emailService.js";

const VALID_PAYMENT_METHODS = ["bkash", "nagad", "rocket"];

/**
 * @desc    Create a new booking (manual payment submission)
 * @route   POST /api/bookings
 * @access  Private (logged-in user)
 * @body    { packageId, paymentMethod, senderNumber, transactionId }
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { packageId, paymentMethod, senderNumber, transactionId } = req.body;

  if (!packageId || !paymentMethod || !senderNumber || !transactionId) {
    throw new ApiError(400, "packageId, paymentMethod, senderNumber and transactionId are required");
  }

  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ApiError(400, `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(", ")}`);
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
    totalAmount: pkg.price,
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

  if (booking.bookingStatus === "confirmed") {
    throw new ApiError(400, "This booking has already been confirmed");
  }

  booking.bookingStatus = "confirmed";
  booking.paymentStatus = "paid";
  if (req.body.adminNote) booking.adminNote = req.body.adminNote;

  await booking.save();

  // Populate user + package details for the confirmation email
  const populatedBooking = await Booking.findById(booking._id)
    .populate("user", "name email")
    .populate("package", "title price");

  if (populatedBooking.user?.email) {
    await sendBookingConfirmationEmail(populatedBooking.user.email, populatedBooking.user.name, {
      packageTitle: populatedBooking.package?.title?.en || "Your Package",
      totalAmount: populatedBooking.totalAmount,
      transactionId: populatedBooking.transactionId,
    });
  }

  res.status(200).json({
    success: true,
    message: "Payment verified and booking confirmed. Confirmation email sent.",
    data: populatedBooking,
  });
});

/**
 * @desc    Admin rejects/cancels a booking (e.g. fraudulent transaction ID)
 * @route   PATCH /api/admin/bookings/:id/reject
 * @access  Private/Admin
 * @body    { adminNote? }
 */
export const adminRejectBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  booking.bookingStatus = "cancelled";
  booking.paymentStatus = "failed";
  if (req.body.adminNote) booking.adminNote = req.body.adminNote;

  await booking.save();

  res.status(200).json({
    success: true,
    message: "Booking rejected",
    data: booking,
  });
});