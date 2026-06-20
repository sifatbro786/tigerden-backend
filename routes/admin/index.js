import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { adminMiddleware } from "../../middlewares/adminMiddleware.js";

import adminPackageRoutes from "./adminPackageRoutes.js";
import adminBlogRoutes from "./adminBlogRoutes.js";
import adminTeamRoutes from "./adminTeamRoutes.js";
import adminTestimonialRoutes from "./adminTestimonialRoutes.js";
import adminCouponRoutes from "./adminCouponRoutes.js";

const router = express.Router();

// Every route nested under /api/admin requires a valid JWT + admin role.
router.use(authMiddleware, adminMiddleware);

router.use("/packages", adminPackageRoutes);
router.use("/blogs", adminBlogRoutes);
router.use("/team", adminTeamRoutes);
router.use("/testimonials", adminTestimonialRoutes);
router.use("/coupons", adminCouponRoutes);

export default router;
