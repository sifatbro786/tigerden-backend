import Testimonial from "../models/Testimonial.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";

/**
 * @desc    Get all testimonials for admin (including unapproved)
 * @route   GET /api/admin/testimonials
 * @access  Private/Admin
 */
export const getAllTestimonialsAdmin = asyncHandler(async (req, res) => {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: testimonials.length,
        data: testimonials,
    });
});

/**
 * @desc    Get all approved testimonials
 * @route   GET /api/testimonials
 * @access  Public
 */
export const getAllTestimonials = asyncHandler(async (req, res) => {
    const testimonials = await Testimonial.find({ isApproved: true }).sort({
        createdAt: -1,
    });
    res.status(200).json({
        success: true,
        count: testimonials.length,
        data: testimonials,
    });
});

/**
 * @desc    Create a new testimonial
 * @route   POST /api/admin/testimonials
 * @access  Private/Admin
 */
export const createTestimonial = asyncHandler(async (req, res) => {
    const { name, rating, review, isApproved } = req.body;

    if (!name || !rating || !review?.en) {
        throw new ApiError(400, "Name, rating and English review are required");
    }

    const image = req.file ? { url: req.file.path, public_id: req.file.filename } : undefined;

    const testimonial = await Testimonial.create({
        name,
        rating,
        review,
        image,
        isApproved: isApproved !== undefined ? isApproved : true,
    });

    res.status(201).json({
        success: true,
        message: "Testimonial created successfully",
        data: testimonial,
    });
});

/**
 * @desc    Update a testimonial
 * @route   PUT /api/admin/testimonials/:id
 * @access  Private/Admin
 */
export const updateTestimonial = asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) throw new ApiError(404, "Testimonial not found");

    const updatableFields = ["name", "rating", "review", "isApproved"];
    updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            testimonial[field] = req.body[field];
        }
    });

    if (req.file) {
        if (testimonial.image?.public_id) {
            await deleteFromCloudinary(testimonial.image.public_id);
        }
        testimonial.image = { url: req.file.path, public_id: req.file.filename };
    }

    await testimonial.save();

    res.status(200).json({
        success: true,
        message: "Testimonial updated successfully",
        data: testimonial,
    });
});

/**
 * @desc    Delete a testimonial
 * @route   DELETE /api/admin/testimonials/:id
 * @access  Private/Admin
 */
export const deleteTestimonial = asyncHandler(async (req, res) => {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) throw new ApiError(404, "Testimonial not found");

    if (testimonial.image?.public_id) {
        await deleteFromCloudinary(testimonial.image.public_id);
    }

    res.status(200).json({ success: true, message: "Testimonial deleted successfully" });
});
