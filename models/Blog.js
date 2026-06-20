import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
    {
        title: {
            en: { type: String, required: [true, "English title is required"], trim: true },
            bn: { type: String, required: [true, "Bangla title is required"], trim: true },
        },
        content: {
            en: { type: String, required: [true, "English content is required"] },
            bn: { type: String, required: [true, "Bangla content is required"] },
        },
        author: {
            type: String,
            required: [true, "Author is required"],
            trim: true,
        },
        image: {
            url: { type: String },
            public_id: { type: String },
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
