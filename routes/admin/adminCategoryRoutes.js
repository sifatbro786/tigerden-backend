import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories); // supports ?includeInactive=true for the admin dashboard
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;