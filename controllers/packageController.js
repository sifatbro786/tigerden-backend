import mongoose from "mongoose";
import Package from "../models/Package.js";
import Category from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, deleteManyFromCloudinary } from "../utils/cloudinaryHelper.js";

const VALID_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VALID_PACKAGE_TYPES = ["domestic", "international"];

/**
 * Resolves req.query.category (which may be a slug OR a valid ObjectId)
 * into a Category ObjectId for filtering. Returns null if not found.
 */
const resolveCategoryId = async (categoryParam) => {
  if (mongoose.Types.ObjectId.isValid(categoryParam)) return categoryParam;
  const category = await Category.findOne({ slug: categoryParam.toLowerCase().trim() });
  return category ? category._id : null;
};

/**
 * @desc    Advanced search & discovery for packages (PUBLIC)
 * @route   GET /api/packages
 * @access  Public
 * New query param: packageType=domestic|international
 */
export const getAllPackages = asyncHandler(async (req, res) => {
  const {
    featured,
    flashSale,
    region,
    country,
    city,
    month,
    minPrice,
    maxPrice,
    category,
    search,
    packageType,
  } = req.query;

  const filter = { isActive: true };

  if (featured === "true") filter.featured = true;

  if (flashSale === "true") {
    filter.isFlashSale = true;
    filter.flashSaleEndTime = { $gt: new Date() };
  }

  if (packageType) {
    if (!VALID_PACKAGE_TYPES.includes(packageType)) {
      throw new ApiError(400, `packageType must be one of: ${VALID_PACKAGE_TYPES.join(", ")}`);
    }
    filter.packageType = packageType;
  }

  if (region) filter.region = new RegExp(`^${region}$`, "i");
  if (country) filter.country = new RegExp(`^${country}$`, "i");
  if (city) filter.city = new RegExp(`^${city}$`, "i");

  if (month) {
    const months = month.split(",").map((m) => m.trim()).filter((m) => VALID_MONTHS.includes(m));
    if (months.length === 0) {
      throw new ApiError(400, `month must be one of: ${VALID_MONTHS.join(", ")}`);
    }
    filter.idealMonths = { $in: months };
  }

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

  if (category) {
    const categoryId = await resolveCategoryId(category);
    if (!categoryId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    filter.category = categoryId;
  }

  if (search) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ "title.en": regex }, { "title.bn": regex }];
  }

  const packages = await Package.find(filter).populate("category").sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: packages.length, data: packages });
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
    packageType,
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
    tags,
    originalPrice,
    discountedPrice,
    discountPercentage,
    currency,
    pricePerPerson,
    minGroupSize,
    maxGroupSize,
    coverVideo,
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
    visaRequired,
    visaOnArrival,
    passportValidity,
    reviews,
    featured,
    isFlashSale,
    flashSaleEndTime,
  } = req.body;

  if (
    !packageType ||
    !VALID_PACKAGE_TYPES.includes(packageType) ||
    !title?.en ||
    !title?.bn ||
    !shortDescription?.en ||
    !shortDescription?.bn ||
    !description?.en ||
    !description?.bn ||
    !category ||
    originalPrice === undefined ||
    discountedPrice === undefined
  ) {
    throw new ApiError(
      400,
      "packageType (domestic/international), title, shortDescription, description (en/bn), category, originalPrice and discountedPrice are required"
    );
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) throw new ApiError(400, "Invalid category");

  // req.files now holds TWO field groups: "coverImage" (single) and
  // "gallery" (multiple) — see updated multer config + routes below.
  const coverFile = req.files?.coverImage?.[0];
  const galleryFiles = req.files?.gallery || [];

  const pkg = await Package.create({
    packageType,
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
    tags: Array.isArray(tags) ? tags : [],
    originalPrice,
    discountedPrice,
    discountPercentage: discountPercentage || 0,
    currency: currency || "BDT",
    pricePerPerson: pricePerPerson !== undefined ? pricePerPerson : true,
    minGroupSize: minGroupSize || 1,
    maxGroupSize,
    coverImage: coverFile ? { url: coverFile.path, public_id: coverFile.filename } : undefined,
    gallery: galleryFiles.map((file) => ({ url: file.path, public_id: file.filename })),
    coverVideo,
    availableDates: Array.isArray(availableDates) ? availableDates : [],
    itinerary: Array.isArray(itinerary) ? itinerary : [],
    inclusions: Array.isArray(inclusions) ? inclusions : [],
    exclusions: Array.isArray(exclusions) ? exclusions : [],
    importantNotes,
    cancellationPolicy,
    facilities,
    nearbyAttractions: Array.isArray(nearbyAttractions) ? nearbyAttractions : [],
    pointOfContact,
    locationMap,
    travelTips,
    faqs: Array.isArray(faqs) ? faqs : [],
    visaRequired: packageType === "international" ? Boolean(visaRequired) : false,
    visaOnArrival: packageType === "international" ? Boolean(visaOnArrival) : false,
    passportValidity: packageType === "international" ? passportValidity : undefined,
    reviews: Array.isArray(reviews) ? reviews : [],
    featured: featured === "true" || featured === true,
    isFlashSale: isFlashSale === "true" || isFlashSale === true,
    flashSaleEndTime: flashSaleEndTime || null,
  });

  const populatedPkg = await pkg.populate("category");

  res.status(201).json({ success: true, message: "Package created successfully", data: populatedPkg });
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
    "packageType", "title", "shortDescription", "description", "category", "duration", 
    "location", "region", "country", "city", "idealMonths", "tags",
    "originalPrice", "discountedPrice", "discountPercentage", "currency",
    "pricePerPerson", "minGroupSize", "maxGroupSize", "coverVideo",
    "availableDates", "itinerary", "inclusions", "exclusions",
    "importantNotes", "cancellationPolicy", "facilities", "nearbyAttractions", 
    "pointOfContact", "locationMap", "travelTips", "faqs",
    "visaRequired", "visaOnArrival", "passportValidity", "reviews",
    "featured", "isFlashSale", "flashSaleEndTime", "isActive"
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "featured" || field === "isFlashSale") {
        pkg[field] = req.body[field] === "true" || req.body[field] === true;
      } else if (field === "pricePerPerson") {
        pkg[field] = req.body[field] === "false" || req.body[field] === false ? false : true;
      } else if (field === "visaRequired" || field === "visaOnArrival") {
        pkg[field] = req.body[field] === "true" || req.body[field] === true;
      } else {
        pkg[field] = req.body[field];
      }
    }
  });

  if (pkg.packageType === "domestic") {
    pkg.visaRequired = false;
    pkg.visaOnArrival = false;
    pkg.passportValidity = undefined;
  }

  // ==========================================
  // ১. Cover Image Handling (Single Image)
  // ==========================================
  const coverFile = req.files?.coverImage?.[0];
  if (coverFile) {
    if (pkg.coverImage && pkg.coverImage.public_id) {
      await deleteManyFromCloudinary([pkg.coverImage.public_id]);
    }
    pkg.coverImage = {
      url: coverFile.path,
      public_id: coverFile.filename,
    };
  }

  // ==========================================
  // ২. Gallery Images Handling (Multiple Images)
  // ==========================================
  if (req.body.keepImages !== undefined) {
    const keepIds = Array.isArray(req.body.keepImages) 
      ? req.body.keepImages 
      : [req.body.keepImages].filter(Boolean);

    const galleryToRemove = pkg.gallery.filter((img) => !keepIds.includes(img.public_id));
    const galleryToKeep = pkg.gallery.filter((img) => keepIds.includes(img.public_id));

    if (galleryToRemove.length > 0) {
      await deleteManyFromCloudinary(galleryToRemove.map((img) => img.public_id));
    }

    pkg.gallery = galleryToKeep;
  }

  const galleryFiles = req.files?.gallery || [];
  if (galleryFiles.length > 0) {
    const newGalleryImages = galleryFiles.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    pkg.gallery.push(...newGalleryImages);
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