import Blog from "../models/Blog.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";

/**
 * @desc    Get all published blogs
 * @route   GET /api/blogs
 * @access  Public
 */
export const getAllBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: blogs.length, data: blogs });
});

/**
 * @desc    Get a single blog by ID
 * @route   GET /api/blogs/:id
 * @access  Public
 */
export const getBlogById = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw new ApiError(404, "Blog not found");
    res.status(200).json({ success: true, data: blog });
});

/**
 * @desc    Create a new blog post
 * @route   POST /api/admin/blogs
 * @access  Private/Admin
 */
export const createBlog = asyncHandler(async (req, res) => {
    const { title, content, author, isPublished } = req.body;

    if (!title?.en || !title?.bn || !content?.en || !content?.bn || !author) {
        throw new ApiError(400, "Title (en/bn), content (en/bn) and author are required");
    }

    const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;

    const blog = await Blog.create({
        title,
        content,
        author,
        image,
        isPublished: isPublished !== undefined ? isPublished : true,
    });

    res.status(201).json({
        success: true,
        message: "Blog created successfully",
        data: blog,
    });
});

/**
 * @desc    Update a blog post
 * @route   PUT /api/admin/blogs/:id
 * @access  Private/Admin
 */
export const updateBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw new ApiError(404, "Blog not found");

    const updatableFields = ["title", "content", "author", "isPublished"];
    updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            blog[field] = req.body[field];
        }
    });

    if (req.file) {
        if (blog.image?.public_id) {
            await deleteFromCloudinary(blog.image.public_id); // delete old image first
        }
        blog.image = { url: req.file.path, public_id: req.file.filename };
    }

    await blog.save();

    res.status(200).json({
        success: true,
        message: "Blog updated successfully",
        data: blog,
    });
});

/**
 * @desc    Delete a blog post
 * @route   DELETE /api/admin/blogs/:id
 * @access  Private/Admin
 */
export const deleteBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) throw new ApiError(404, "Blog not found");

    if (blog.image?.public_id) {
        await deleteFromCloudinary(blog.image.public_id);
    }

    res.status(200).json({ success: true, message: "Blog deleted successfully" });
});
