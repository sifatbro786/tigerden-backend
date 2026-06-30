import mongoose from "mongoose";

const SERVICE_TYPES = ["Visa Processing", "Medical Tourism", "Package Tour", "Other Inquiry"];

const contactSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },
        serviceType: {
            type: String,
            enum: {
                values: SERVICE_TYPES,
                message: `serviceType must be one of: ${SERVICE_TYPES.join(", ")}`,
            },
            required: [true, "Service type is required"],
        },
        message: {
            type: String,
            trim: true,
            default: "",
        },
        status: {
            type: String,
            enum: ["unread", "read"],
            default: "unread",
        },
    },
    { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;