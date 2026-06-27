import express from "express";
import {
  getAllBookings,
  adminVerifyPayment,
  adminRejectBooking,
} from "../../controllers/bookingController.js";

const router = express.Router();

router.get("/", getAllBookings);
router.patch("/:id/verify", adminVerifyPayment);
router.patch("/:id/reject", adminRejectBooking);

export default router;