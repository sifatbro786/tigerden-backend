import express from "express";
import { applyCoupon } from "../controllers/couponController.js";
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

// Public can preview/apply a coupon to see the discounted price.
// If a valid JWT is supplied, loyalty discounts also get applied —
// but this route itself does not require authentication.
router.post("/apply", optionalAuthMiddleware, applyCoupon);

export default router;
