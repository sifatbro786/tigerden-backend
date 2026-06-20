import express from "express";
import {
    createPackage,
    updatePackage,
    deletePackage,
} from "../../controllers/packageController.js";
import { packageUpload } from "../../config/multer.js";

const router = express.Router();

router.post("/", packageUpload.array("images", 5), createPackage);
router.put("/:id", packageUpload.array("images", 5), updatePackage);
router.delete("/:id", deletePackage);

export default router;
