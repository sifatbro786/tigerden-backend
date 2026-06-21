import express from "express";
import PageMeta from "../models/PageMeta.js";

const router = express.Router();

// GET all page meta (public — used by usePageMeta hook on every page load)
router.get("/all", async (req, res) => {
    try {
        const pageMeta = await PageMeta.find().sort({ pageName: 1 }).select("-__v");
        res.json({ success: true, data: pageMeta, count: pageMeta.length });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// GET page meta by slug (public)
router.get("/:slug", async (req, res) => {
    try {
        const pageMeta = await PageMeta.findOne({
            pageSlug: req.params.slug,
            isActive: true,
        }).select("-__v");

        if (!pageMeta) {
            return res.status(404).json({ success: false, message: "Page meta not found" });
        }

        res.json({ success: true, data: pageMeta });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({ success: false, message: "Page meta not found" });
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

export default router;
