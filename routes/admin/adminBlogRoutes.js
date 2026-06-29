import express from "express";
import { createBlog, updateBlog, deleteBlog, getAllBlogsAdmin } from "../../controllers/blogController.js";
import { blogUpload } from "../../config/multer.js";
import parseJSONFields from "../../middlewares/parseJSONFields.js";

const router = express.Router();
router.get("/", getAllBlogsAdmin);
router.post("/", blogUpload.single("image"), parseJSONFields(["title", "content"]), createBlog);
router.put("/:id", blogUpload.single("image"), parseJSONFields(["title", "content"]), updateBlog);
router.delete("/:id", deleteBlog);

export default router;
