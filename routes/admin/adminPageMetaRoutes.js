import express from "express";
import PageMeta from "../../models/PageMeta.js";

const router = express.Router();

const generateSlug = (pageName) =>
    pageName
        .toLowerCase()
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

// GET / -> matches pageMetaApi.getAll() => /admin/page-meta
router.get("/", async (req, res) => {
    try {
        const pageMeta = await PageMeta.find().sort({ pageName: 1 }).select("-__v");
        res.json({ success: true, data: pageMeta, count: pageMeta.length });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// GET /:id -> matches pageMetaApi.getById(id)
router.get("/:id", async (req, res) => {
    try {
        const pageMeta = await PageMeta.findById(req.params.id).select("-__v");
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

// POST / -> create
router.post("/", async (req, res) => {
    try {
        const { pageName, metaTitle, metaDescription, metaKeywords, canonicalUrl, lastUpdatedBy } =
            req.body;

        if (!pageName || !metaTitle || !metaDescription || !metaKeywords || !canonicalUrl) {
            return res.status(400).json({
                success: false,
                message:
                    "All fields are required: pageName, metaTitle, metaDescription, metaKeywords, canonicalUrl",
            });
        }

        const generatedSlug = generateSlug(pageName);

        const existingPage = await PageMeta.findOne({
            $or: [{ pageName: pageName.trim() }, { pageSlug: generatedSlug }],
        });

        if (existingPage) {
            return res.status(400).json({
                success: false,
                message: "Page name or similar page already exists",
            });
        }

        const newPageMeta = await PageMeta.create({
            pageName: pageName.trim(),
            pageSlug: generatedSlug,
            metaTitle: metaTitle.trim(),
            metaDescription: metaDescription.trim(),
            metaKeywords: metaKeywords.trim(),
            canonicalUrl: canonicalUrl.trim(),
            lastUpdatedBy: lastUpdatedBy || "admin",
            isActive: true,
        });

        res.status(201).json({
            success: true,
            data: newPageMeta,
            message: "Page meta created successfully",
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res
                .status(400)
                .json({ success: false, message: "Validation error", error: error.message });
        }
        if (error.code === 11000) {
            return res
                .status(400)
                .json({ success: false, message: "Duplicate entry found", details: error.message });
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// PUT /:id -> update
router.put("/:id", async (req, res) => {
    try {
        const {
            pageName,
            metaTitle,
            metaDescription,
            metaKeywords,
            canonicalUrl,
            isActive,
            lastUpdatedBy,
        } = req.body;

        const existingPage = await PageMeta.findById(req.params.id);
        if (!existingPage) {
            return res.status(404).json({ success: false, message: "Page meta not found" });
        }

        const updateFields = {};

        if (pageName && pageName !== existingPage.pageName) {
            const newSlug = generateSlug(pageName);
            const duplicatePage = await PageMeta.findOne({
                _id: { $ne: req.params.id },
                $or: [{ pageName: pageName.trim() }, { pageSlug: newSlug }],
            });
            if (duplicatePage) {
                return res
                    .status(400)
                    .json({ success: false, message: "Page name or similar page already exists" });
            }
            updateFields.pageName = pageName.trim();
            updateFields.pageSlug = newSlug;
        }

        if (metaTitle !== undefined) updateFields.metaTitle = metaTitle.trim();
        if (metaDescription !== undefined) updateFields.metaDescription = metaDescription.trim();
        if (metaKeywords !== undefined) updateFields.metaKeywords = metaKeywords.trim();
        if (canonicalUrl !== undefined) updateFields.canonicalUrl = canonicalUrl.trim();
        if (isActive !== undefined) updateFields.isActive = isActive;
        if (lastUpdatedBy !== undefined) updateFields.lastUpdatedBy = lastUpdatedBy;

        const updatedPageMeta = await PageMeta.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true },
        ).select("-__v");

        res.json({
            success: true,
            data: updatedPageMeta,
            message: "Page meta updated successfully",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({ success: false, message: "Page meta not found" });
        }
        if (error.name === "ValidationError") {
            return res
                .status(400)
                .json({ success: false, message: "Validation error", error: error.message });
        }
        if (error.code === 11000) {
            return res
                .status(400)
                .json({ success: false, message: "Page name or slug already exists" });
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// DELETE /:id
router.delete("/:id", async (req, res) => {
    try {
        const deletedPageMeta = await PageMeta.findByIdAndDelete(req.params.id);
        if (!deletedPageMeta) {
            return res.status(404).json({ success: false, message: "Page meta not found" });
        }
        res.json({
            success: true,
            message: "Page meta deleted successfully",
            deletedId: deletedPageMeta._id,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({ success: false, message: "Page meta not found" });
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// PATCH /:id/toggle
router.patch("/:id/toggle", async (req, res) => {
    try {
        const pageMeta = await PageMeta.findById(req.params.id);
        if (!pageMeta) {
            return res.status(404).json({ success: false, message: "Page meta not found" });
        }
        pageMeta.isActive = !pageMeta.isActive;
        pageMeta.lastUpdatedBy = req.body.updatedBy || "admin";
        await pageMeta.save();

        res.json({
            success: true,
            data: pageMeta,
            message: `Page ${pageMeta.isActive ? "activated" : "deactivated"} successfully`,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({ success: false, message: "Page meta not found" });
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

export default router;
