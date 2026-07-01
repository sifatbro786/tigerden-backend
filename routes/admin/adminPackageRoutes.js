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

const uploadFields = packageUpload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "gallery", maxCount: 8 },
]);

const PACKAGE_JSON_FIELDS = [
  "title",
  "shortDescription",
  "description",
  "idealMonths",
  "tags",
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
  "reviews",
];

router.get("/", getAllPackagesAdmin);
router.post(
  "/",
  uploadFields,
  parseJSONFields(PACKAGE_JSON_FIELDS),
  createPackage
);
router.put(
  "/:id",
  uploadFields,
  parseJSONFields(PACKAGE_JSON_FIELDS),
  updatePackage
);
router.delete("/:id", deletePackage);

export default router;