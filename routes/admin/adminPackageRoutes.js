import express from "express";
import {
    createPackage,
    updatePackage,
    deletePackage,
    getAllPackagesAdmin,
} from "../../controllers/packageController.js";
import { packageUpload } from "../../config/multer.js";
import parseJSONFields from "../../middlewares/parseJSONFields.js";

const router = express.Router();

router.get("/", getAllPackagesAdmin);

router.post(
    "/",
    packageUpload.array("images", 5),
    parseJSONFields(["title", "description", "idealMonths"]),
    createPackage,
);
router.put(
    "/:id",
    packageUpload.array("images", 5),
    parseJSONFields(["title", "description", "idealMonths", "keepImages"]),
    updatePackage,
);
router.delete("/:id", deletePackage);

export default router;
