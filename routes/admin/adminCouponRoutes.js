import express from "express";
import {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
} from "../../controllers/couponController.js";

const router = express.Router();

router.get("/", getAllCoupons);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
