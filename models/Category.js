import mongoose from "mongoose";

const localizedStringSchema = {
  en: { type: String, required: [true, "English text is required"], trim: true },
  bn: { type: String, required: [true, "Bangla text is required"], trim: true },
};

const localizedOptionalStringSchema = {
  en: { type: String, trim: true },
  bn: { type: String, trim: true },
};

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: localizedStringSchema,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: localizedOptionalStringSchema,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name.en if not explicitly provided
categorySchema.pre("validate", function (next) {
  if (!this.slug && this.name?.en) {
    this.slug = this.name.en
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category;