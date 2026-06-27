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
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["bkash", "nagad", "rocket"],
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
      unique: true, // prevents duplicate submission / replay fraud
      trim: true,
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
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;