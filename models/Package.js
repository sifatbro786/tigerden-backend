import mongoose from "mongoose";

// Reusable multi-language sub-schema
const localizedStringSchema = {
    en: { type: String, required: [true, "English text is required"], trim: true },
    bn: { type: String, required: [true, "Bangla text is required"], trim: true },
};

const packageSchema = new mongoose.Schema(
    {
        title: {
            type: localizedStringSchema,
            required: true,
        },
        description: {
            type: localizedStringSchema,
            required: true,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        duration: {
            type: String, // e.g. "3 Days 2 Nights"
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
        featured: {
            type: Boolean,
            default: false,
        },

        // ----- Flash Sale Fields -----
        isFlashSale: {
            type: Boolean,
            default: false,
        },
        flashSaleEndTime: {
            type: Date,
            default: null,
            validate: {
                validator: function (value) {
                    // If flash sale is active, end time must be in the future at creation
                    if (this.isFlashSale && value) {
                        return value > new Date();
                    }
                    return true;
                },
                message: "Flash sale end time must be a future date",
            },
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

// Virtual to check if flash sale is currently live
packageSchema.virtual("isFlashSaleLive").get(function () {
    return Boolean(this.isFlashSale && this.flashSaleEndTime && this.flashSaleEndTime > new Date());
});

packageSchema.set("toJSON", { virtuals: true });
packageSchema.set("toObject", { virtuals: true });

const Package = mongoose.model("Package", packageSchema);
export default Package;
