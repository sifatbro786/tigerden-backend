import mongoose from "mongoose";

const localizedStringSchema = {
  en: { type: String, required: [true, "English text is required"], trim: true },
  bn: { type: String, required: [true, "Bangla text is required"], trim: true },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const packageSchema = new mongoose.Schema(
  {
    title: { type: localizedStringSchema, required: true },
    description: { type: localizedStringSchema, required: true },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    duration: { type: String, trim: true },
    location: { type: String, trim: true },

    // ----- Destination Hierarchy (Region > Country > City) -----
    region: { type: String, trim: true, index: true },
    country: { type: String, trim: true, index: true },
    city: { type: String, trim: true, index: true },

    // ----- Seasonality -----
    idealMonths: {
      type: [{ type: String, enum: MONTHS }],
      default: [],
    },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    featured: { type: Boolean, default: false },

    isFlashSale: { type: Boolean, default: false },
    flashSaleEndTime: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (this.isFlashSale && value) {
            return value > new Date();
          }
          return true;
        },
        message: "Flash sale end time must be a future date",
      },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index to speed up the most common search combination
packageSchema.index({ region: 1, country: 1, city: 1, price: 1 });

packageSchema.virtual("isFlashSaleLive").get(function () {
  return Boolean(this.isFlashSale && this.flashSaleEndTime && this.flashSaleEndTime > new Date());
});

packageSchema.set("toJSON", { virtuals: true });
packageSchema.set("toObject", { virtuals: true });

const Package = mongoose.model("Package", packageSchema);
export default Package;