import express from "express";
import { createInquiry } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", createInquiry);

export default router;