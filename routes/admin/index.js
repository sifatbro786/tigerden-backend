import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { adminMiddleware } from "../../middlewares/adminMiddleware.js";
import {
    changeUserRole,
    changeAdminPassword,
    getAllUsers,
} from "../../controllers/adminController.js";

import adminPackageRoutes from "./adminPackageRoutes.js";
import adminBlogRoutes from "./adminBlogRoutes.js";
import adminTeamRoutes from "./adminTeamRoutes.js";
import adminTestimonialRoutes from "./adminTestimonialRoutes.js";
import adminCouponRoutes from "./adminCouponRoutes.js";
import adminPageMetaRoutes from "./adminPageMetaRoutes.js";
import adminBookingRoutes from "./adminBookingRoutes.js";
import adminCategoryRoutes from "./adminCategoryRoutes.js";

const router = express.Router();

// Every route nested under /api/admin requires a valid JWT + admin/super_admin role.
router.use(authMiddleware, adminMiddleware);

// Role & password management (new)
router.get("/users", getAllUsers);
router.patch("/users/:id/role", changeUserRole);
router.post("/change-password", changeAdminPassword);

// Existing CMS resources
router.use("/packages", adminPackageRoutes);
router.use("/bookings", adminBookingRoutes);
router.use("/blogs", adminBlogRoutes);
router.use("/team", adminTeamRoutes);
router.use("/testimonials", adminTestimonialRoutes);
router.use("/coupons", adminCouponRoutes);
router.use("/page-meta", adminPageMetaRoutes);
router.use("/categories", adminCategoryRoutes);

export default router;
