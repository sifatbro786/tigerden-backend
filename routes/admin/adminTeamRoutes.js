import express from "express";
import {
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
} from "../../controllers/teamController.js";
import { teamUpload } from "../../config/multer.js";
import parseJSONFields from "../../middlewares/parseJSONFields.js";

const router = express.Router();

router.post(
    "/",
    teamUpload.single("image"),
    parseJSONFields(["ceoMessage", "expertise"]),
    createTeamMember,
);
router.put(
    "/:id",
    teamUpload.single("image"),
    parseJSONFields(["ceoMessage", "expertise"]),
    updateTeamMember,
);
router.delete("/:id", deleteTeamMember);

export default router;
