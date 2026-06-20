import express from "express";
import { getAllTestimonials } from "../controllers/testimonialController.js";

const router = express.Router();

router.get("/", getAllTestimonials);

export default router;
