import Contact from "../models/Contact.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendContactInquiryEmail } from "../services/emailService.js";

const VALID_STATUSES = ["unread", "read"];

/**
 * @desc    Submit a new contact inquiry. Saves to DB and notifies admin via email.
 * @route   POST /api/contact
 * @access  Public
 */
export const createInquiry = asyncHandler(async (req, res) => {
    const { fullName, phone, email, serviceType, message } = req.body;

    if (!fullName || !phone || !email || !serviceType) {
        throw new ApiError(400, "fullName, phone, email and serviceType are required");
    }

    const inquiry = await Contact.create({
        fullName,
        phone,
        email,
        serviceType,
        message,
    });

    // Fire-and-forget admin notification — never blocks the user's response
    sendContactInquiryEmail(process.env.GMAIL_USER, {
        fullName: inquiry.fullName,
        phone: inquiry.phone,
        email: inquiry.email,
        serviceType: inquiry.serviceType,
        message: inquiry.message,
    });

    res.status(201).json({
        success: true,
        message: "Your inquiry has been submitted successfully. We'll get back to you soon.",
        data: inquiry,
    });
});

/**
 * @desc    Get all contact inquiries (admin dashboard)
 * @route   GET /api/admin/contact
 * @access  Private/Admin
 * @query   status=unread|read, serviceType=...
 */
export const getAllInquiries = asyncHandler(async (req, res) => {
    const { status, serviceType } = req.query;

    const filter = {};
    if (status) {
        if (!VALID_STATUSES.includes(status)) {
            throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
        }
        filter.status = status;
    }
    if (serviceType) filter.serviceType = serviceType;

    const inquiries = await Contact.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: inquiries.length,
        data: inquiries,
    });
});

/**
 * @desc    Get a single contact inquiry by ID
 * @route   GET /api/admin/contact/:id
 * @access  Private/Admin
 */
export const getInquiryById = asyncHandler(async (req, res) => {
    const inquiry = await Contact.findById(req.params.id);

    if (!inquiry) {
        throw new ApiError(404, "Inquiry not found");
    }

    res.status(200).json({ success: true, data: inquiry });
});

/**
 * @desc    Update an inquiry's status (e.g. mark as read/unread)
 * @route   PATCH /api/admin/contact/:id/status
 * @access  Private/Admin
 * @body    { status: "read" | "unread" }
 */
export const updateInquiryStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
        throw new ApiError(400, `status is required and must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const inquiry = await Contact.findById(req.params.id);
    if (!inquiry) {
        throw new ApiError(404, "Inquiry not found");
    }

    inquiry.status = status;
    await inquiry.save();

    res.status(200).json({
        success: true,
        message: `Inquiry marked as "${status}"`,
        data: inquiry,
    });
});