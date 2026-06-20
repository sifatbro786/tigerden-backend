import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
        },
        review: {
            en: { type: String, trim: true, required: [true, "English review is required"] },
            bn: { type: String, trim: true }, // Bangla optional as per spec
        },
        image: {
            url: { type: String },
            public_id: { type: String },
        },
        isApproved: {
            type: Boolean,
            default: true, // admin can moderate by toggling this
        },
    },
    { timestamps: true },
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);
export default Testimonial;
