import express from "express";
import {
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getAllTestimonialsAdmin,
} from "../../controllers/testimonialController.js";
import { testimonialUpload } from "../../config/multer.js";
import parseJSONFields from "../../middlewares/parseJSONFields.js";

const router = express.Router();

router.get("/", getAllTestimonialsAdmin);
router.post("/", testimonialUpload.single("image"), parseJSONFields(["review"]), createTestimonial);
router.put(
    "/:id",
    testimonialUpload.single("image"),
    parseJSONFields(["review"]),
    updateTestimonial,
);
router.delete("/:id", deleteTestimonial);

export default router;
