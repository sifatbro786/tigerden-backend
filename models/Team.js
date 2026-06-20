import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        designation: {
            type: String,
            required: [true, "Designation is required"],
            trim: true,
        },
        expertise: [
            {
                type: String,
                trim: true,
            },
        ],
        image: {
            url: { type: String, required: [true, "Image is required"] },
            public_id: { type: String, required: true },
        },

        // Distinguishes regular team members from the CEO/Founder
        isCEO: {
            type: Boolean,
            default: false,
        },
        ceoMessage: {
            en: { type: String, trim: true },
            bn: { type: String, trim: true },
        },

        order: {
            type: Number,
            default: 0, // for controlling display order on the frontend
        },
    },
    { timestamps: true },
);

const Team = mongoose.model("Team", teamSchema);
export default Team;
