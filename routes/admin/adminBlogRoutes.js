import express from "express";
import { createBlog, updateBlog, deleteBlog } from "../../controllers/blogController.js";
import { blogUpload } from "../../config/multer.js";

const router = express.Router();

router.post("/", blogUpload.single("image"), createBlog);
router.put("/:id", blogUpload.single("image"), updateBlog);
router.delete("/:id", deleteBlog);

export default router;
