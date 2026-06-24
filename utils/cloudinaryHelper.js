import cloudinary from "../config/cloudinary.js";

/**
 * Deletes a single image from Cloudinary by its public_id.
 * Never throws — logs and continues, since a failed cleanup
 * shouldn't block the actual DB operation that triggered it.
 */
export const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`⚠️ Failed to delete Cloudinary image (${publicId}):`, error.message);
    }
};

/**
 * Deletes multiple images from Cloudinary in parallel.
 * @param {string[]} publicIds
 */
export const deleteManyFromCloudinary = async (publicIds = []) => {
    await Promise.all(publicIds.filter(Boolean).map((id) => deleteFromCloudinary(id)));
};
