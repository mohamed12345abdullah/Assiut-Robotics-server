require("dotenv").config();
const MONGOURL = process.env.MONGOURL || "mongodb://localhost:27017/assiut-robotics";
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);

const EducationalCourse = require("../mongoose.models/course");
const EducationalTrack = require("../mongoose.models/track");
const Member = require("../mongoose.models/member");
const EducationalTask = require("../mongoose.models/task");

const asyncWrapper = require("../middleware/asyncWrapper");
const createError = require("../utils/createError");
const httpStatusText = require("../utils/httpStatusText");
const { deleteFromCloudinary } = require("../middleware/fileUpload");

// Get all courses
const getAllCourses = asyncWrapper(async (req, res) => {
    const { track, isActive, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (track) filter.track = track;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const courses = await EducationalCourse.find(filter)
        .populate('track', 'name committee')
        .populate('createdBy', 'name email committee avatar')
        .sort({ order: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await EducationalCourse.countDocuments(filter);
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            courses,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }
    });
});

// Get single course by ID
const getCourseById = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    
    const course = await EducationalCourse.findById(courseId)
        .populate('track', 'name committee')
        .populate('createdBy', 'name email committee avatar');
    
    if (!course) {
        throw createError(404, httpStatusText.FAIL, "Course not found");
    }
    
    // Get tasks for this course
    const tasks = await EducationalTask.find({ course: courseId, isActive: true })
        .sort({ order: 1 })
        .populate('createdBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { course, tasks }
    });
});

// Create new course
const createCourse = asyncWrapper(async (req, res) => {
    const { name, description, track, order, duration, difficulty, materials } = req.body;
    const email = req.decoded.email;
    
    const creator = await Member.findOne({ email });
    if (!creator) {
        throw createError(404, httpStatusText.FAIL, "Creator not found");
    }
    
    // Verify track exists
    const trackDoc = await EducationalTrack.findById(track);
    if (!trackDoc) {
        throw createError(404, httpStatusText.FAIL, "Track not found");
    }
    
    // Check if course with same name exists in the track
    const existingCourse = await EducationalCourse.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') }, 
        track 
    });
    
    if (existingCourse) {
        throw createError(400, httpStatusText.FAIL, "Course with this name already exists in this track");
    }
    
    // Check if order is already taken
    const existingOrder = await EducationalCourse.findOne({ track, order });
    if (existingOrder) {
        throw createError(400, httpStatusText.FAIL, "Course order already taken in this track");
    }
    
    const courseData = {
        name,
        description,
        track,
        order: parseInt(order),
        duration: duration ? parseInt(duration) : 0,
        difficulty: difficulty || 'beginner',
        createdBy: creator._id
    };
    
    // Add materials if provided
    if (materials && Array.isArray(materials)) {
        courseData.materials = materials;
    }
    
    // Add image if uploaded
    if (req.imageUrl) {
        courseData.image = req.imageUrl;
    }
    
    const course = new EducationalCourse(courseData);
    await course.save();
    
    await course.populate('track', 'name committee');
    await course.populate('createdBy', 'name email committee avatar');
    
    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: course,
        message: "Course created successfully"
    });
});

// Update course
const updateCourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const { name, description, track, order, duration, difficulty, isActive, materials } = req.body;
    const email = req.decoded.email;
    
    const course = await EducationalCourse.findById(courseId);
    if (!course) {
        throw createError(404, httpStatusText.FAIL, "Course not found");
    }
    
    const updater = await Member.findOne({ email });
    if (!updater) {
        throw createError(404, httpStatusText.FAIL, "Updater not found");
    }
    
    // Check permissions (only creator or admin can update)
    if (course.createdBy.toString() !== updater._id.toString() && 
        !['leader', 'viceLeader'].includes(updater.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    // Check if name change conflicts with existing course
    if (name && name !== course.name) {
        const existingCourse = await EducationalCourse.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }, 
            track: track || course.track,
            _id: { $ne: courseId }
        });
        
        if (existingCourse) {
            throw createError(400, httpStatusText.FAIL, "Course with this name already exists in this track");
        }
    }
    
    // Check if order change conflicts
    if (order && parseInt(order) !== course.order) {
        const existingOrder = await EducationalCourse.findOne({ 
            track: track || course.track, 
            order: parseInt(order),
            _id: { $ne: courseId }
        });
        
        if (existingOrder) {
            throw createError(400, httpStatusText.FAIL, "Course order already taken in this track");
        }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (track) updateData.track = track;
    if (order) updateData.order = parseInt(order);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (difficulty) updateData.difficulty = difficulty;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (materials && Array.isArray(materials)) updateData.materials = materials;
    
    // Handle image update
    if (req.imageUrl) {
        // Delete old image from Cloudinary if exists
        if (course.image && course.image.includes('cloudinary')) {
            const publicId = course.image.split('/').pop().split('.')[0];
            await deleteFromCloudinary(publicId);
        }
        updateData.image = req.imageUrl;
    }
    
    const updatedCourse = await EducationalCourse.findByIdAndUpdate(
        courseId,
        updateData,
        { new: true, runValidators: true }
    ).populate('track', 'name committee')
     .populate('createdBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: updatedCourse,
        message: "Course updated successfully"
    });
});

// Delete course
const deleteCourse = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const email = req.decoded.email;
    
    const course = await EducationalCourse.findById(courseId);
    if (!course) {
        throw createError(404, httpStatusText.FAIL, "Course not found");
    }
    
    const deleter = await Member.findOne({ email });
    if (!deleter) {
        throw createError(404, httpStatusText.FAIL, "Deleter not found");
    }
    
    // Check permissions (only creator or admin can delete)
    if (course.createdBy.toString() !== deleter._id.toString() && 
        !['leader', 'viceLeader'].includes(deleter.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    // Check if course has tasks
    const taskCount = await EducationalTask.countDocuments({ course: courseId });
    if (taskCount > 0) {
        throw createError(400, httpStatusText.FAIL, "Cannot delete course with existing tasks. Delete tasks first.");
    }
    
    // Delete image from Cloudinary if exists
    if (course.image && course.image.includes('cloudinary')) {
        const publicId = course.image.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
    }
    
    await EducationalCourse.findByIdAndDelete(courseId);
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Course deleted successfully"
    });
});

// Add material to course
const addMaterial = asyncWrapper(async (req, res) => {
    const { courseId } = req.params;
    const { title, type, url, description } = req.body;
    const email = req.decoded.email;
    
    const course = await EducationalCourse.findById(courseId);
    if (!course) {
        throw createError(404, httpStatusText.FAIL, "Course not found");
    }
    
    const adder = await Member.findOne({ email });
    if (!adder) {
        throw createError(404, httpStatusText.FAIL, "Adder not found");
    }
    
    // Check permissions
    if (course.createdBy.toString() !== adder._id.toString() && 
        !['leader', 'viceLeader'].includes(adder.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    const material = {
        title,
        type,
        url: req.fileUrl || url,
        description
    };
    
    course.materials.push(material);
    await course.save();
    
    await course.populate('track', 'name committee');
    await course.populate('createdBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: course,
        message: "Material added successfully"
    });
});

// Remove material from course
const removeMaterial = asyncWrapper(async (req, res) => {
    const { courseId, materialIndex } = req.params;
    const email = req.decoded.email;
    
    const course = await EducationalCourse.findById(courseId);
    if (!course) {
        throw createError(404, httpStatusText.FAIL, "Course not found");
    }
    
    const remover = await Member.findOne({ email });
    if (!remover) {
        throw createError(404, httpStatusText.FAIL, "Remover not found");
    }
    
    // Check permissions
    if (course.createdBy.toString() !== remover._id.toString() && 
        !['leader', 'viceLeader'].includes(remover.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    const index = parseInt(materialIndex);
    if (index < 0 || index >= course.materials.length) {
        throw createError(400, httpStatusText.FAIL, "Invalid material index");
    }
    
    course.materials.splice(index, 1);
    await course.save();
    
    await course.populate('track', 'name committee');
    await course.populate('createdBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: course,
        message: "Material removed successfully"
    });
});

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    addMaterial,
    removeMaterial
}; 