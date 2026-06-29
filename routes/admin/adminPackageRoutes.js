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

const PACKAGE_JSON_FIELDS = [
  "title",
  "shortDescription",
  "description",
  "idealMonths",
  "keepImages",
  "availableDates",
  "itinerary",
  "inclusions",
  "exclusions",
  "importantNotes",
  "cancellationPolicy",
  "facilities",
  "nearbyAttractions",
  "pointOfContact",
  "locationMap",
  "travelTips",
  "faqs",
];

router.get("/", getAllPackagesAdmin);

router.post(
  "/",
  packageUpload.array("images", 5),
  parseJSONFields(PACKAGE_JSON_FIELDS),
  createPackage
);
router.put(
  "/:id",
  packageUpload.array("images", 5),
  parseJSONFields(PACKAGE_JSON_FIELDS),
  updatePackage
);
router.delete("/:id", deletePackage);

export default router;