import Category from "../models/Category.js";
import Package from "../models/Package.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public (active only) / Admin (all, via ?includeInactive=true)
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === "true" ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ "name.en": 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

/**
 * @desc    Get a single category by slug or ObjectId
 * @route   GET /api/categories/:identifier
 * @access  Public
 */
export const getCategoryBySlugOrId = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  const category = await Category.findOne({
    $or: [{ slug: identifier.toLowerCase() }, { _id: identifier }],
  }).catch(() => null); // catches CastError if identifier isn't a valid ObjectId

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  res.status(200).json({ success: true, data: category });
});

/**
 * @desc    Create a new category
 * @route   POST /api/admin/categories
 * @access  Private/Admin
 * @body    { name: { en, bn }, slug?, description?: { en, bn }, isActive? }
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, isActive } = req.body;

  if (!name?.en || !name?.bn) {
    throw new ApiError(400, "name.en and name.bn are required");
  }

  const finalSlug = (slug && slug.trim()) || generateSlug(name.en);

  const existing = await Category.findOne({
    $or: [{ slug: finalSlug }, { "name.en": name.en.trim() }],
  });
  if (existing) {
    throw new ApiError(409, "A category with this name or slug already exists");
  }

  const category = await Category.create({
    name,
    slug: finalSlug,
    description,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

/**
 * @desc    Update a category
 * @route   PUT /api/admin/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const { name, slug, description, isActive } = req.body;

  if (slug && slug.trim() !== category.slug) {
    const duplicate = await Category.findOne({ slug: slug.trim(), _id: { $ne: category._id } });
    if (duplicate) {
      throw new ApiError(409, "A category with this slug already exists");
    }
    category.slug = slug.trim();
  } else if (name?.en && name.en !== category.name.en && !slug) {
    // Auto-regenerate slug if the English name changed and no explicit slug given
    const regeneratedSlug = generateSlug(name.en);
    const duplicate = await Category.findOne({ slug: regeneratedSlug, _id: { $ne: category._id } });
    if (!duplicate) {
      category.slug = regeneratedSlug;
    }
  }

  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

/**
 * @desc    Delete a category
 * @route   DELETE /api/admin/categories/:id
 * @access  Private/Admin
 *
 * Guard: a category that's still referenced by at least one package
 * cannot be deleted, to avoid orphaning packages with a dangling
 * category reference.
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const packageCount = await Package.countDocuments({ category: category._id });
  if (packageCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete this category — it is used by ${packageCount} package(s). Reassign or delete those packages first.`
    );
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});