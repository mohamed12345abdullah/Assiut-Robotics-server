require("dotenv").config();
const MONGOURL = process.env.MONGOURL || "mongodb://localhost:27017/assiut-robotics";
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);

const EducationalTrack = require("../mongoose.models/track");
const Member = require("../mongoose.models/member");
const EducationalCourse = require("../mongoose.models/course");
const EducationalTask = require("../mongoose.models/task");

const asyncWrapper = require("../middleware/asyncWrapper");
const createError = require("../utils/createError");
const httpStatusText = require("../utils/httpStatusText");
const { deleteFromCloudinary } = require("../middleware/fileUpload");

// Get all tracks
const getAllTracks = asyncWrapper(async (req, res) => {
    const { committee, isActive, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (committee) filter.committee = committee;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const tracks = await EducationalTrack.find(filter)
        .populate('createdBy', 'name email committee avatar')
        .populate('members.member', 'name email committee avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await EducationalTrack.countDocuments(filter);
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            tracks,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }
    });
});

// Get single track by ID
const getTrackById = asyncWrapper(async (req, res) => {
    const { trackId } = req.params;
    
    const track = await EducationalTrack.findById(trackId)
        .populate('createdBy', 'name email committee avatar')
        .populate('members.member', 'name email committee avatar');
    
    if (!track) {
        throw createError(404, httpStatusText.FAIL, "Track not found");
    }
    
    // Get courses for this track
    const courses = await EducationalCourse.find({ track: trackId, isActive: true })
        .sort({ order: 1 })
        .populate('createdBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { track, courses }
    });
});

// Create new track
const createTrack = asyncWrapper(async (req, res) => {
    const { name, description, committee } = req.body;
    const email = req.decoded.email;
    
    const creator = await Member.findOne({ email });
    if (!creator) {
        throw createError(404, httpStatusText.FAIL, "Creator not found");
    }
    
    // Check if track with same name exists in the committee
    const existingTrack = await EducationalTrack.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') }, 
        committee 
    });
    
    if (existingTrack) {
        throw createError(400, httpStatusText.FAIL, "Track with this name already exists in this committee");
    }
    
    const trackData = {
        name,
        description,
        committee,
        createdBy: creator._id
    };
    
    // Add image if uploaded
    if (req.imageUrl) {
        trackData.image = req.imageUrl;
    }
    
    const track = new EducationalTrack(trackData);
    await track.save();
    
    await track.populate('createdBy', 'name email committee avatar');
    
    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: track,
        message: "Track created successfully"
    });
});

// Update track
const updateTrack = asyncWrapper(async (req, res) => {
    const { trackId } = req.params;
    const { name, description, committee, isActive } = req.body;
    const email = req.decoded.email;
    
    const track = await EducationalTrack.findById(trackId);
    if (!track) {
        throw createError(404, httpStatusText.FAIL, "Track not found");
    }
    
    const updater = await Member.findOne({ email });
    if (!updater) {
        throw createError(404, httpStatusText.FAIL, "Updater not found");
    }
    
    // Check permissions (only creator or admin can update)
    if (track.createdBy.toString() !== updater._id.toString() && 
        !['leader', 'viceLeader'].includes(updater.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    // Check if name change conflicts with existing track
    if (name && name !== track.name) {
        const existingTrack = await EducationalTrack.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }, 
            committee: committee || track.committee,
            _id: { $ne: trackId }
        });
        
        if (existingTrack) {
            throw createError(400, httpStatusText.FAIL, "Track with this name already exists in this committee");
        }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (committee) updateData.committee = committee;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Handle image update
    if (req.imageUrl) {
        // Delete old image from Cloudinary if exists
        if (track.image && track.image.includes('cloudinary')) {
            const publicId = track.image.split('/').pop().split('.')[0];
            await deleteFromCloudinary(publicId);
        }
        updateData.image = req.imageUrl;
    }
    
    const updatedTrack = await EducationalTrack.findByIdAndUpdate(
        trackId,
        updateData,
        { new: true, runValidators: true }
    ).populate('createdBy', 'name email committee avatar')
     .populate('members.member', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: updatedTrack,
        message: "Track updated successfully"
    });
});

// Delete track
const deleteTrack = asyncWrapper(async (req, res) => {
    const { trackId } = req.params;
    const email = req.decoded.email;
    
    const track = await EducationalTrack.findById(trackId);
    if (!track) {
        throw createError(404, httpStatusText.FAIL, "Track not found");
    }
    
    const deleter = await Member.findOne({ email });
    if (!deleter) {
        throw createError(404, httpStatusText.FAIL, "Deleter not found");
    }
    
    // Check permissions (only creator or admin can delete)
    if (track.createdBy.toString() !== deleter._id.toString() && 
        !['leader', 'viceLeader'].includes(deleter.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    // Check if track has courses
    const courseCount = await EducationalCourse.countDocuments({ track: trackId });
    if (courseCount > 0) {
        throw createError(400, httpStatusText.FAIL, "Cannot delete track with existing courses. Delete courses first.");
    }
    
    // Delete image from Cloudinary if exists
    if (track.image && track.image.includes('cloudinary')) {
        const publicId = track.image.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
    }
    
    await EducationalTrack.findByIdAndDelete(trackId);
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Track deleted successfully"
    });
});

// Add member to track
const addMemberToTrack = asyncWrapper(async (req, res) => {
    const { trackId } = req.params;
    const { memberId } = req.body;
    const email = req.decoded.email;
    
    const track = await EducationalTrack.findById(trackId);
    if (!track) {
        throw createError(404, httpStatusText.FAIL, "Track not found");
    }
    
    const member = await Member.findById(memberId);
    if (!member) {
        throw createError(404, httpStatusText.FAIL, "Member not found");
    }
    
    const adder = await Member.findOne({ email });
    if (!adder) {
        throw createError(404, httpStatusText.FAIL, "Adder not found");
    }
    
    // Check if member is already in track
    const existingMember = track.members.find(m => m.member.toString() === memberId);
    if (existingMember) {
        throw createError(400, httpStatusText.FAIL, "Member is already in this track");
    }
    
    track.members.push({
        member: memberId,
        joinedAt: new Date(),
        progress: 0
    });
    
    await track.save();
    await track.populate('members.member', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: track,
        message: "Member added to track successfully"
    });
});

// Remove member from track
const removeMemberFromTrack = asyncWrapper(async (req, res) => {
    const { trackId, memberId } = req.params;
    const email = req.decoded.email;
    
    const track = await EducationalTrack.findById(trackId);
    if (!track) {
        throw createError(404, httpStatusText.FAIL, "Track not found");
    }
    
    const remover = await Member.findOne({ email });
    if (!remover) {
        throw createError(404, httpStatusText.FAIL, "Remover not found");
    }
    
    // Remove member from track
    track.members = track.members.filter(m => m.member.toString() !== memberId);
    await track.save();
    
    await track.populate('members.member', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: track,
        message: "Member removed from track successfully"
    });
});

// Update member progress in track
const updateMemberProgress = asyncWrapper(async (req, res) => {
    const { trackId, memberId } = req.params;
    const { progress } = req.body;
    const email = req.decoded.email;
    
    const track = await EducationalTrack.findById(trackId);
    if (!track) {
        throw createError(404, httpStatusText.FAIL, "Track not found");
    }
    
    const updater = await Member.findOne({ email });
    if (!updater) {
        throw createError(404, httpStatusText.FAIL, "Updater not found");
    }
    
    const memberIndex = track.members.findIndex(m => m.member.toString() === memberId);
    if (memberIndex === -1) {
        throw createError(404, httpStatusText.FAIL, "Member not found in track");
    }
    
    track.members[memberIndex].progress = Math.min(100, Math.max(0, progress));
    await track.save();
    
    await track.populate('members.member', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: track,
        message: "Member progress updated successfully"
    });
});

module.exports = {
    getAllTracks,
    getTrackById,
    createTrack,
    updateTrack,
    deleteTrack,
    addMemberToTrack,
    removeMemberFromTrack,
    updateMemberProgress
}; 