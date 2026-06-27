// src/controllers/packageController.js
import Package from "../models/Package.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary, deleteManyFromCloudinary } from "../utils/cloudinaryHelper.js";

const VALID_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * @desc    Advanced search & discovery for packages (PUBLIC)
 * @route   GET /api/packages
 * @access  Public
 */
export const getAllPackages = asyncHandler(async (req, res) => {
    const { featured, flashSale, region, country, city, month, minPrice, maxPrice, search } = req.query;

    const filter = { isActive: true };

    if (featured === "true") filter.featured = true;

    if (flashSale === "true") {
        filter.isFlashSale = true;
        filter.flashSaleEndTime = { $gt: new Date() };
    }

    if (region) filter.region = new RegExp(`^${region}$`, "i");
    if (country) filter.country = new RegExp(`^${country}$`, "i");
    if (city) filter.city = new RegExp(`^${city}$`, "i");

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

    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) {
            const min = Number(minPrice);
            if (Number.isNaN(min) || min < 0) throw new ApiError(400, "minPrice must be a non-negative number");
            filter.price.$gte = min;
        }
        if (maxPrice !== undefined) {
            const max = Number(maxPrice);
            if (Number.isNaN(max) || max < 0) throw new ApiError(400, "maxPrice must be a non-negative number");
            filter.price.$lte = max;
        }
    }

    if (search) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [{ "title.en": regex }, { "title.bn": regex }];
    }

    const packages = await Package.find(filter).sort({ createdAt: -1 });

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
    const packages = await Package.find().sort({ createdAt: -1 });

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
    const pkg = await Package.findById(req.params.id);
    if (!pkg) throw new ApiError(404, "Package not found");
    res.status(200).json({ success: true, data: pkg });
});

/**
 * @desc    Create a new package (with Cloudinary images via multer)
 * @route   POST /api/admin/packages
 * @access  Private/Admin
 */
export const createPackage = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        price,
        duration,
        location,
        region,
        country,
        city,
        idealMonths,
        featured,
        isFlashSale,
        flashSaleEndTime,
    } = req.body;

    if (!title?.en || !title?.bn || !description?.en || !description?.bn || !price) {
        throw new ApiError(400, "Title (en/bn), description (en/bn) and price are required");
    }

    const images = (req.files || []).map((file) => ({
        url: file.path,
        public_id: file.filename,
    }));

    const pkg = await Package.create({
        title,
        description,
        price,
        duration,
        location,
        region,
        country,
        city,
        idealMonths: Array.isArray(idealMonths) ? idealMonths : [],
        featured: featured === "true" || featured === true,
        isFlashSale: isFlashSale === "true" || isFlashSale === true,
        flashSaleEndTime: flashSaleEndTime || null,
        images,
    });

    res.status(201).json({
        success: true,
        message: "Package created successfully",
        data: pkg,
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

    const updatableFields = [
        "title",
        "description",
        "price",
        "duration",
        "location",
        "region",
        "country",
        "city",
        "idealMonths",
        "featured",
        "isFlashSale",
        "flashSaleEndTime",
        "isActive",
    ];

    updatableFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            pkg[field] = req.body[field];
        }
    });

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

    res.status(200).json({
        success: true,
        message: "Package updated successfully",
        data: pkg,
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