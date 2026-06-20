import express from "express";
import {
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
} from "../../controllers/teamController.js";
import { teamUpload } from "../../config/multer.js";

const router = express.Router();

router.post("/", teamUpload.single("image"), createTeamMember);
router.put("/:id", teamUpload.single("image"), updateTeamMember);
router.delete("/:id", deleteTeamMember);

export default router;
