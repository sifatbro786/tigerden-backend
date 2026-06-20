import express from "express";
import { getAllTeamMembers, getCEOMessage } from "../controllers/teamController.js";

const router = express.Router();

router.get("/", getAllTeamMembers);
router.get("/ceo-message", getCEOMessage);

export default router;
