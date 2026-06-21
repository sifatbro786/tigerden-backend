import express from "express";
import {
    registerUser,
    loginUser,
    getMyProfile,
    forgotPassword,
    resetPassword,
    googleLogin,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMyProfile);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google-login", googleLogin);

export default router;
