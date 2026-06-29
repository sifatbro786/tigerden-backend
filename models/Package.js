// Package.js - Complete Refactored Version

import mongoose from "mongoose";

// Reusable localized schemas
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

// ----- UPDATED Sub-schemas with Localization -----

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: localizedStringSchema, required: true },
    activities: {
      type: [localizedStringSchema],
      default: [],
    },
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

// ✅ UPDATED: Description now localized
const nearbyAttractionSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    distance: { type: String, trim: true },
    duration: { type: String, trim: true },
    description: { type: localizedOptionalStringSchema, default: undefined },
  },
  { _id: false }
);

// ✅ UPDATED: RoomType and Amenities now localized
const accommodationSchema = new mongoose.Schema(
  {
    hotelName: { type: String, trim: true },
    hotelRating: { type: Number, min: 1, max: 5 },
    roomType: { type: localizedOptionalStringSchema, default: undefined },
    amenities: { type: localizedArraySchema, default: [] },
  },
  { _id: false }
);

// ✅ UPDATED: Arrays now use localized strings
const facilitiesSchema = new mongoose.Schema(
  {
    accommodation: { type: accommodationSchema, default: undefined },
    transportation: { type: localizedArraySchema, default: [] },
    meals: { type: localizedArraySchema, default: [] },
    guides: { type: localizedArraySchema, default: [] },
  },
  { _id: false }
);

const contactPersonSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const pointOfContactSchema = new mongoose.Schema(
  {
    tourManager: { type: contactPersonSchema, default: undefined },
    emergencyContact: { type: emergencyContactSchema, default: undefined },
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

// ✅ UPDATED: All text fields now localized
const travelTipsSchema = new mongoose.Schema(
  {
    bestTime: { type: localizedOptionalStringSchema, default: undefined },
    packing: { type: localizedArraySchema, default: [] },
    health: { type: localizedOptionalStringSchema, default: undefined },
    cultural: { type: localizedOptionalStringSchema, default: undefined },
  },
  { _id: false }
);

// ----- Main Package Schema -----

const packageSchema = new mongoose.Schema(
  {
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

    // Pricing
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
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      validate: {
        validator: function(value) {
          if (this.originalPrice === 0) return true;
          const expectedDiscount = ((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100;
          return Math.abs(value - expectedDiscount) < 0.5;
        },
        message: "Discount percentage does not match the price difference"
      }
    },
    currency: { type: String, default: "BDT", trim: true },

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

    // Deep Fields
    availableDates: { type: [String], default: [] },
    itinerary: { type: [itineraryDaySchema], default: [] },
    inclusions: { type: [localizedStringSchema], default: [] },
    exclusions: { type: [localizedStringSchema], default: [] },

    // ✅ UPDATED: ImportantNotes now localized
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

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// ----- Indexes -----
packageSchema.index({ region: 1, country: 1, city: 1, discountedPrice: 1 });
packageSchema.index({ category: 1, isActive: 1, isFlashSale: 1, discountedPrice: 1 });
packageSchema.index({ "title.en": "text", "title.bn": "text" }, {
  weights: {
    "title.en": 10,
    "title.bn": 5
  }
});
packageSchema.index({ isFlashSale: 1, flashSaleEndTime: 1, isActive: 1 });

// ----- Virtuals -----
packageSchema.virtual("isFlashSaleLive").get(function () {
  return Boolean(this.isFlashSale && this.flashSaleEndTime && this.flashSaleEndTime > new Date());
});

// ----- Pre-save Hook -----
packageSchema.pre('save', function(next) {
  if (this.isModified('originalPrice') || this.isModified('discountedPrice')) {
    if (this.originalPrice > 0) {
      this.discountPercentage = ((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100;
      this.discountPercentage = Math.round(this.discountPercentage * 100) / 100;
    }
  }
  next();
});

// ----- Query Middleware -----
packageSchema.pre('find', function() {
  this.where({ isDeleted: false });
});
packageSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

packageSchema.set("toJSON", { virtuals: true });
packageSchema.set("toObject", { virtuals: true });

const Package = mongoose.model("Package", packageSchema);
export default Package;