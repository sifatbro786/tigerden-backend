import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

/**
 * Generic Cloudinary storage factory.
 * @param {string} folder - Cloudinary folder name (e.g. "team", "blogs", "testimonials", "packages")
 */
const createCloudinaryStorage = (folder) =>
    new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `tigersden/${folder}`,
            allowed_formats: ["jpg", "jpeg", "png", "webp", "jfif"],
            transformation: [{ width: 1200, crop: "limit" }],
        },
    });

export const teamUpload = multer({ storage: createCloudinaryStorage("team") });
export const testimonialUpload = multer({
    storage: createCloudinaryStorage("testimonials"),
});
export const blogUpload = multer({ storage: createCloudinaryStorage("blogs") });
export const packageUpload = multer({
    storage: createCloudinaryStorage("packages"),
});
