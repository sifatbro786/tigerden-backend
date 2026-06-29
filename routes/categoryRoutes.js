import express from "express";
import { getAllCategories, getCategoryBySlugOrId } from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:identifier", getCategoryBySlugOrId);

export default router;