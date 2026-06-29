import mongoose from "mongoose";
import Package from "../models/Package.js";
import Category from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, deleteManyFromCloudinary } from "../utils/cloudinaryHelper.js";

const VALID_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Resolves req.query.category (which may be a slug OR a valid ObjectId)
 * into a Category ObjectId for filtering. Returns null if not found.
 */
const resolveCategoryId = async (categoryParam) => {
  if (mongoose.Types.ObjectId.isValid(categoryParam)) {
    return categoryParam;
  }
  const category = await Category.findOne({ slug: categoryParam.toLowerCase().trim() });
  return category ? category._id : null;
};

/**
 * @desc    Advanced search & discovery for packages (PUBLIC)
 * @route   GET /api/packages
 * @access  Public
 *
 * Supported query params:
 *   - featured=true
 *   - flashSale=true
 *   - region, country, city          (case-insensitive exact match)
 *   - month=Jul                       (or comma-separated: month=Jul,Aug)
 *   - minPrice, maxPrice              (range applied against discountedPrice)
 *   - category=beach-holiday OR a valid ObjectId
 *   - search                          (free-text match on title.en/title.bn)
 */
export const getAllPackages = asyncHandler(async (req, res) => {
  const { featured, flashSale, region, country, city, month, minPrice, maxPrice, category, search } =
    req.query;

  const filter = { isActive: true };

  if (featured === "true") filter.featured = true;

  if (flashSale === "true") {
    filter.isFlashSale = true;
    filter.flashSaleEndTime = { $gt: new Date() };
  }

  // ----- Destination hierarchy -----
  if (region) filter.region = new RegExp(`^${region}$`, "i");
  if (country) filter.country = new RegExp(`^${country}$`, "i");
  if (city) filter.city = new RegExp(`^${city}$`, "i");

  // ----- Seasonality -----
  if (month) {
    const months = month
      .split(",")
      .map((m) => m.trim())
      .filter((m) => VALID_MONTHS.includes(m));

    if (months.length === 0) {
      throw new ApiError(400, `month must be one of: ${VALID_MONTHS.join(", ")}`);
    }
    filter.idealMonths = { $in: months };
  }

  // ----- Budget range (against the coupon-ready discountedPrice) -----
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.discountedPrice = {};
    if (minPrice !== undefined) {
      const min = Number(minPrice);
      if (Number.isNaN(min) || min < 0) throw new ApiError(400, "minPrice must be a non-negative number");
      filter.discountedPrice.$gte = min;
    }
    if (maxPrice !== undefined) {
      const max = Number(maxPrice);
      if (Number.isNaN(max) || max < 0) throw new ApiError(400, "maxPrice must be a non-negative number");
      filter.discountedPrice.$lte = max;
    }
  }

  // ----- Category (slug or ObjectId) -----
  if (category) {
    const categoryId = await resolveCategoryId(category);
    if (!categoryId) {
      // No matching category — short-circuit to an empty result set
      // rather than throwing, since this is a normal "no results" case.
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    filter.category = categoryId;
  }

  // ----- Free-text search on title -----
  if (search) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ "title.en": regex }, { "title.bn": regex }];
  }

  const packages = await Package.find(filter).populate("category").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: packages.length,
    data: packages,
  });
});

/**
 * @desc    Get all packages for admin (including inactive)
 * @route   GET /api/admin/packages
 * @access  Private/Admin
 */
export const getAllPackagesAdmin = asyncHandler(async (req, res) => {
  const packages = await Package.find().populate("category").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: packages.length,
    data: packages,
  });
});

/**
 * @desc    Get a single package by ID
 * @route   GET /api/packages/:id
 * @access  Public
 */
export const getPackageById = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id).populate("category");
  if (!pkg) throw new ApiError(404, "Package not found");

  res.status(200).json({
    success: true,
    data: {
      ...pkg.toObject(),
      // Explicit top-level field so the frontend / Coupon API can read
      // the active baseline price without digging through the document.
      activePrice: pkg.discountedPrice,
    },
  });
});

/**
 * @desc    Create a new package (with Cloudinary images via multer)
 * @route   POST /api/admin/packages
 * @access  Private/Admin
 */
export const createPackage = asyncHandler(async (req, res) => {
  const {
    title,
  shortDescription,
  description,
  category,
  duration,
  location,
  region,
  country,
  city,
  idealMonths,
  originalPrice,
  discountedPrice,
  discountPercentage,
  currency,
  availableDates,
  itinerary,
  inclusions,
  exclusions,
  importantNotes,
  cancellationPolicy,
  facilities,
  nearbyAttractions,
  pointOfContact,
  locationMap,
  travelTips,
  faqs,
  featured,
  isFlashSale,
  flashSaleEndTime,
  } = req.body;

  if (!title?.en || !title?.bn || !shortDescription?.en || !shortDescription?.bn ||
    !description?.en || !description?.bn || !category ||
    originalPrice === undefined || discountedPrice === undefined) {
  throw new ApiError(400, "title, shortDescription, description (en/bn), category, originalPrice and discountedPrice are required");
}

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new ApiError(400, "Invalid category");
  }

  const images = (req.files || []).map((file) => ({
    url: file.path,
    public_id: file.filename,
  }));

 const pkg = await Package.create({
  title,
  shortDescription,
  description,
  category,
  duration,
  location,
  region,
  country,
  city,
  idealMonths: Array.isArray(idealMonths) ? idealMonths : [],
  originalPrice,
  discountedPrice,
  discountPercentage: discountPercentage || 0,
  currency: currency || "BDT",
  availableDates: Array.isArray(availableDates) ? availableDates : [],
  itinerary: Array.isArray(itinerary) ? itinerary : [],
  inclusions: Array.isArray(inclusions) ? inclusions : [],
  exclusions: Array.isArray(exclusions) ? exclusions : [],
  importantNotes: importantNotes || undefined,
  cancellationPolicy: cancellationPolicy || undefined,
  facilities: facilities || undefined,
  nearbyAttractions: Array.isArray(nearbyAttractions) ? nearbyAttractions : [],
  pointOfContact: pointOfContact || undefined,
  locationMap: locationMap || undefined,
  travelTips: travelTips || undefined,
  faqs: Array.isArray(faqs) ? faqs : [],
  featured: featured === "true" || featured === true,
  isFlashSale: isFlashSale === "true" || isFlashSale === true,
  flashSaleEndTime: flashSaleEndTime || null,
  images,
});

  const populatedPkg = await pkg.populate("category");

  res.status(201).json({
    success: true,
    message: "Package created successfully",
    data: populatedPkg,
  });
});

/**
 * @desc    Update an existing package
 * @route   PUT /api/admin/packages/:id
 * @access  Private/Admin
 */
export const updatePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id);
  if (!pkg) throw new ApiError(404, "Package not found");

  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      throw new ApiError(400, "Invalid category");
    }
  }

  const updatableFields = [
  "title", "shortDescription", "description", "category", "duration", "location",
  "region", "country", "city", "idealMonths",
  "originalPrice", "discountedPrice", "discountPercentage", "currency",
  "availableDates", "itinerary", "inclusions", "exclusions",
  "importantNotes", "cancellationPolicy",
  "facilities", "nearbyAttractions", "pointOfContact", "locationMap", "travelTips",
  "faqs",
  "featured", "isFlashSale", "flashSaleEndTime", "isActive",
];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      pkg[field] = req.body[field];
    }
  });

  // ----- Image replace logic (unchanged from before) -----
  if (req.body.keepImages !== undefined) {
    const keepIds = Array.isArray(req.body.keepImages) ? req.body.keepImages : [];

    const imagesToRemove = pkg.images.filter((img) => !keepIds.includes(img.public_id));
    const imagesToKeep = pkg.images.filter((img) => keepIds.includes(img.public_id));

    if (imagesToRemove.length > 0) {
      await deleteManyFromCloudinary(imagesToRemove.map((img) => img.public_id));
    }

    pkg.images = imagesToKeep;
  }

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    pkg.images.push(...newImages);
  }

  await pkg.save();
  const populatedPkg = await pkg.populate("category");

  res.status(200).json({
    success: true,
    message: "Package updated successfully",
    data: populatedPkg,
  });
});

/**
 * @desc    Delete a package (and its Cloudinary images)
 * @route   DELETE /api/admin/packages/:id
 * @access  Private/Admin
 */
export const deletePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findByIdAndDelete(req.params.id);
  if (!pkg) throw new ApiError(404, "Package not found");

  if (pkg.images?.length > 0) {
    await deleteManyFromCloudinary(pkg.images.map((img) => img.public_id));
  }

  res.status(200).json({
    success: true,
    message: "Package deleted successfully",
  });
});