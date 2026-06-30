import express from "express";
import {
    getAllInquiries,
    getInquiryById,
    updateInquiryStatus,
} from "../../controllers/contactController.js";

const router = express.Router();

router.get("/", getAllInquiries);
router.get("/:id", getInquiryById);
router.patch("/:id/status", updateInquiryStatus);

export default router;