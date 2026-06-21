import mongoose from "mongoose";

const pageMetaSchema = new mongoose.Schema(
    {
        pageName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        pageSlug: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
            sparse: true,
        },
        metaTitle: {
            type: String,
            required: true,
            trim: true,
        },
        metaDescription: {
            type: String,
            required: true,
            trim: true,
        },
        metaKeywords: {
            type: String,
            required: true,
            trim: true,
        },
        canonicalUrl: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastUpdatedBy: {
            type: String,
            default: "admin",
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("PageMeta", pageMetaSchema);
