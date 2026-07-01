// Package.js - Complete Refactored Version

import mongoose from "mongoose";

const localizedStringSchema = {
  en: { type: String, required: [true, "English text is required"], trim: true },
  bn: { type: String, required: [true, "Bangla text is required"], trim: true },
};

const localizedOptionalStringSchema = {
  en: { type: String, trim: true },
  bn: { type: String, trim: true },
};

const localizedArraySchema = {
  type: [localizedOptionalStringSchema],
  default: [],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ----- Sub-schemas -----

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: localizedStringSchema, required: true },
    activities: { type: [localizedStringSchema], default: [] },
    meals: { type: [String], default: [] }, // e.g. ["Breakfast", "Lunch"]
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: localizedStringSchema, required: true },
    answer: { type: localizedStringSchema, required: true },
  },
  { _id: false }
);

const nearbyAttractionSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    distance: { type: String, trim: true },
    duration: { type: String, trim: true },
    description: { type: localizedOptionalStringSchema, default: undefined },
    image: { type: String, trim: true }, // simple URL is fine for reference photos
  },
  { _id: false }
);

// Accommodation is always an ARRAY now — supports both single-hotel
// domestic trips (array of 1) and multi-city international trips
// (one entry per city/leg, e.g. Bali's Kuta -> Ubud -> Nusa Dua).
const accommodationEntrySchema = new mongoose.Schema(
  {
    nights: { type: String, trim: true }, // e.g. "2 Nights"
    hotelName: { type: String, trim: true },
    hotelRating: { type: Number, min: 1, max: 5 },
    location: { type: String, trim: true }, // e.g. "Ubud"
    roomType: { type: localizedOptionalStringSchema, default: undefined },
    amenities: { type: localizedArraySchema, default: [] },
  },
  { _id: false }
);

const facilitiesSchema = new mongoose.Schema(
  {
    accommodation: { type: [accommodationEntrySchema], default: [] },
    transportation: { type: localizedArraySchema, default: [] },
    meals: { type: localizedArraySchema, default: [] },
    guides: { type: localizedArraySchema, default: [] },
    // NOTE: "included"/"excluded" are intentionally NOT duplicated here —
    // use the top-level `inclusions` / `exclusions` fields as the single
    // source of truth to avoid data drift between the two.
  },
  { _id: false }
);

const contactPersonSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    languages: { type: [String], default: [] },
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    availableHours: { type: String, trim: true },
  },
  { _id: false }
);

const officeContactSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { _id: false }
);

const embassyContactSchema = new mongoose.Schema(
  {
    country: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { _id: false }
);

const pointOfContactSchema = new mongoose.Schema(
  {
    tourManager: { type: contactPersonSchema, default: undefined },
    emergencyContact: { type: emergencyContactSchema, default: undefined },
    office: { type: officeContactSchema, default: undefined },
    embassyContact: { type: embassyContactSchema, default: undefined }, // international only
  },
  { _id: false }
);

const locationMapSchema = new mongoose.Schema(
  {
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    mapEmbedUrl: { type: String, trim: true },
  },
  { _id: false }
);

const travelTipsSchema = new mongoose.Schema(
  {
    bestTime: { type: localizedOptionalStringSchema, default: undefined },
    weather: { type: localizedOptionalStringSchema, default: undefined },
    currency: { type: String, trim: true }, // e.g. "Indonesian Rupiah (IDR)" — not localized, factual data
    language: { type: String, trim: true }, // e.g. "Bahasa Indonesia, English widely spoken"
    packing: { type: localizedArraySchema, default: [] },
    health: { type: localizedOptionalStringSchema, default: undefined },
    cultural: { type: localizedOptionalStringSchema, default: undefined },
    connectivity: { type: localizedOptionalStringSchema, default: undefined },
  },
  { _id: false }
);

// User-submitted / admin-curated reviews shown on the package details page.
// Kept embedded (not a separate model) since reviews are package-scoped
// display content here, distinct from the site-wide Testimonial collection.
const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, trim: true, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    date: { type: Date, default: Date.now },
    comment: { type: String, trim: true },
  },
  { _id: true, timestamps: false }
);

// ----- Main Package Schema -----

const packageSchema = new mongoose.Schema(
  {
    // ----- Domestic vs International -----
    packageType: {
      type: String,
      enum: {
        values: ["domestic", "international"],
        message: "packageType must be either 'domestic' or 'international'",
      },
      required: [true, "packageType is required"],
      index: true,
    },

    title: { type: localizedStringSchema, required: true },
    shortDescription: { type: localizedStringSchema, required: true },
    description: { type: localizedStringSchema, required: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },

    duration: { type: String, trim: true },
    location: { type: String, trim: true },

    region: { type: String, trim: true, index: true },
    country: { type: String, trim: true, index: true },
    city: { type: String, trim: true, index: true },

    idealMonths: {
      type: [{ type: String, enum: MONTHS }],
      default: [],
    },

    tags: { type: [String], default: [] },

    // ----- Pricing -----
    originalPrice: {
      type: Number,
      required: [true, "Original price is required"],
      min: [0, "Original price cannot be negative"],
    },
    discountedPrice: {
      type: Number,
      required: [true, "Discounted price is required"],
      min: [0, "Discounted price cannot be negative"],
      validate: {
        validator: function (value) {
          return value <= this.originalPrice;
        },
        message: "Discounted price cannot exceed the original price",
      },
    },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
    currency: { type: String, default: "BDT", trim: true },
    pricePerPerson: { type: Boolean, default: true },
    minGroupSize: { type: Number, min: 1, default: 1 },
    maxGroupSize: { type: Number, min: 1 },

    // ----- Media -----
    coverImage: {
      url: { type: String },
      public_id: { type: String },
    },
    gallery: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    coverVideo: { type: String, trim: true }, // YouTube link

    featured: { type: Boolean, default: false },

    isFlashSale: { type: Boolean, default: false },
    flashSaleEndTime: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (this.isFlashSale && value) return value > new Date();
          return true;
        },
        message: "Flash sale end time must be a future date",
      },
    },

    // ----- Deep Fields -----
    availableDates: { type: [String], default: [] },
    itinerary: { type: [itineraryDaySchema], default: [] },
    inclusions: { type: [localizedStringSchema], default: [] },
    exclusions: { type: [localizedStringSchema], default: [] },

    importantNotes: {
      clothing: { type: localizedOptionalStringSchema, default: undefined },
      health: { type: localizedOptionalStringSchema, default: undefined },
      cultural: { type: localizedOptionalStringSchema, default: undefined },
      connectivity: { type: localizedOptionalStringSchema, default: undefined },
    },

    cancellationPolicy: {
      type: Map,
      of: String,
      default: undefined,
    },

    facilities: { type: facilitiesSchema, default: undefined },
    nearbyAttractions: { type: [nearbyAttractionSchema], default: [] },
    pointOfContact: { type: pointOfContactSchema, default: undefined },
    locationMap: { type: locationMapSchema, default: undefined },
    travelTips: { type: travelTipsSchema, default: undefined },
    faqs: { type: [faqSchema], default: [] },

    // ----- International-only travel requirements -----
    visaRequired: { type: Boolean, default: false },
    visaOnArrival: { type: Boolean, default: false },
    passportValidity: { type: String, trim: true }, // e.g. "6 months minimum"

    // ----- Reviews & auto-derived rating -----
    reviews: { type: [reviewSchema], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// ----- Indexes -----
packageSchema.index({ region: 1, country: 1, city: 1, discountedPrice: 1 });
packageSchema.index({ category: 1, isActive: 1, isFlashSale: 1, discountedPrice: 1 });
packageSchema.index({ packageType: 1, isActive: 1 });
packageSchema.index(
  { "title.en": "text", "title.bn": "text" },
  { weights: { "title.en": 10, "title.bn": 5 } }
);
packageSchema.index({ isFlashSale: 1, flashSaleEndTime: 1, isActive: 1 });

// ----- Virtuals -----
packageSchema.virtual("isFlashSaleLive").get(function () {
  return Boolean(this.isFlashSale && this.flashSaleEndTime && this.flashSaleEndTime > new Date());
});

// ----- Pre-save Hooks -----
packageSchema.pre("save", function (next) {
  // Keep discountPercentage in sync with the actual price difference
  if (this.isModified("originalPrice") || this.isModified("discountedPrice")) {
    if (this.originalPrice > 0) {
      this.discountPercentage =
        Math.round(((this.originalPrice - this.discountedPrice) / this.originalPrice) * 10000) / 100;
    }
  }

  // Auto-derive rating & reviewCount from the embedded reviews array,
  // rather than trusting a manually-set admin value (prevents drift).
  if (this.isModified("reviews")) {
    this.reviewCount = this.reviews.length;
    this.rating =
      this.reviews.length > 0
        ? Math.round((this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length) * 10) / 10
        : 0;
  }

  next();
});

// ----- Query Middleware (soft delete) -----
packageSchema.pre("find", function () {
  this.where({ isDeleted: false });
});
packageSchema.pre("findOne", function () {
  this.where({ isDeleted: false });
});

packageSchema.set("toJSON", { virtuals: true });
packageSchema.set("toObject", { virtuals: true });

const Package = mongoose.model("Package", packageSchema);
export default Package;