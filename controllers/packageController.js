import Package from "../models/Package.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Get all active packages (supports ?featured=true & ?flashSale=true filters)
 * @route   GET /api/packages
 * @access  Public
 */
export const getAllPackages = asyncHandler(async (req, res) => {
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

    if (!pkg) {
        throw new ApiError(404, "Package not found");
    }

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
    if (!pkg) {
        throw new ApiError(404, "Package not found");
    }

    const updatableFields = [
        "title",
        "description",
        "price",
        "duration",
        "location",
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

    // Append any newly uploaded images
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
 * @desc    Delete a package
 * @route   DELETE /api/admin/packages/:id
 * @access  Private/Admin
 */
export const deletePackage = asyncHandler(async (req, res) => {
    const pkg = await Package.findByIdAndDelete(req.params.id);

    if (!pkg) {
        throw new ApiError(404, "Package not found");
    }

    res.status(200).json({
        success: true,
        message: "Package deleted successfully",
    });
});
