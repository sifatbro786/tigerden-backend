import Team from "../models/Team.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";

/**
 * @desc    Get all team members (sorted by display order)
 * @route   GET /api/team
 * @access  Public
 */
export const getAllTeamMembers = asyncHandler(async (req, res) => {
    const members = await Team.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json({ success: true, count: members.length, data: members });
});

/**
 * @desc    Get the CEO/Founder message specifically
 * @route   GET /api/team/ceo-message
 * @access  Public
 */
export const getCEOMessage = asyncHandler(async (req, res) => {
    const ceo = await Team.findOne({ isCEO: true });
    if (!ceo) {
        throw new ApiError(404, "CEO message not found");
    }
    res.status(200).json({ success: true, data: ceo });
});

/**
 * @desc    Create a new team member (or CEO entry)
 * @route   POST /api/admin/team
 * @access  Private/Admin
 */
export const createTeamMember = asyncHandler(async (req, res) => {
    const { name, designation, expertise, isCEO, ceoMessage, order } = req.body;

    if (!name || !designation) {
        throw new ApiError(400, "Name and designation are required");
    }

    if (!req.file) {
        throw new ApiError(400, "An image is required for the team member");
    }

    // Ensure only one CEO entry exists at a time
    if (isCEO === "true" || isCEO === true) {
        await Team.updateMany({ isCEO: true }, { isCEO: false });
    }

    const member = await Team.create({
        name,
        designation,
        expertise: Array.isArray(expertise)
            ? expertise
            : expertise
              ? expertise
                    .split(",")
                    .map((e) => e.trim())
                    .filter(Boolean)
              : [],
        image: { url: req.file.path, public_id: req.file.filename },
        isCEO: isCEO === "true" || isCEO === true,
        ceoMessage,
        order,
    });

    res.status(201).json({
        success: true,
        message: "Team member created successfully",
        data: member,
    });
});

/**
 * @desc    Update a team member
 * @route   PUT /api/admin/team/:id
 * @access  Private/Admin
 */
export const updateTeamMember = asyncHandler(async (req, res) => {
    const member = await Team.findById(req.params.id);
    if (!member) throw new ApiError(404, "Team member not found");

    const { name, designation, expertise, isCEO, ceoMessage, order } = req.body;

    if (isCEO === "true" || isCEO === true) {
        await Team.updateMany({ isCEO: true }, { isCEO: false });
        member.isCEO = true;
    } else if (isCEO === "false" || isCEO === false) {
        member.isCEO = false;
    }

    if (name !== undefined) member.name = name;
    if (designation !== undefined) member.designation = designation;
    if (expertise !== undefined) {
        member.expertise = Array.isArray(expertise)
            ? expertise
            : typeof expertise === "string"
              ? expertise
                    .split(",")
                    .map((e) => e.trim())
                    .filter(Boolean)
              : [];
    }
    if (ceoMessage !== undefined) member.ceoMessage = ceoMessage;
    if (order !== undefined) member.order = order;

    if (req.file) {
        if (member.image?.public_id) {
            await deleteFromCloudinary(member.image.public_id);
        }
        member.image = { url: req.file.path, public_id: req.file.filename };
    }

    await member.save();

    res.status(200).json({
        success: true,
        message: "Team member updated successfully",
        data: member,
    });
});

/**
 * @desc    Delete a team member
 * @route   DELETE /api/admin/team/:id
 * @access  Private/Admin
 */
export const deleteTeamMember = asyncHandler(async (req, res) => {
    const member = await Team.findByIdAndDelete(req.params.id);
    if (!member) throw new ApiError(404, "Team member not found");

    if (member.image?.public_id) {
        await deleteFromCloudinary(member.image.public_id);
    }

    res.status(200).json({ success: true, message: "Team member deleted successfully" });
});
