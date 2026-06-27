import express from "express";
import { createBooking, getMyBookings } from "../controllers/bookingController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Both require a logged-in user (not necessarily admin)
router.post("/", authMiddleware, createBooking);
router.get("/my-bookings", authMiddleware, getMyBookings);

export default router;