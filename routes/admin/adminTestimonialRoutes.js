import express from "express";
import {
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
} from "../../controllers/testimonialController.js";
import { testimonialUpload } from "../../config/multer.js";

const router = express.Router();

router.post("/", testimonialUpload.single("image"), createTestimonial);
router.put("/:id", testimonialUpload.single("image"), updateTestimonial);
router.delete("/:id", deleteTestimonial);

export default router;
