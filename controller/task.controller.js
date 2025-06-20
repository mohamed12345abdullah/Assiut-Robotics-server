require("dotenv").config();
const MONGOURL = process.env.MONGOURL || "mongodb://localhost:27017/assiut-robotics";
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);

const EducationalTask = require("../mongoose.models/task");
const EducationalCourse = require("../mongoose.models/course");
const EducationalTrack = require("../mongoose.models/track");
const Member = require("../mongoose.models/member");

const asyncWrapper = require("../middleware/asyncWrapper");
const createError = require("../utils/createError");
const httpStatusText = require("../utils/httpStatusText");
const { deleteFromCloudinary } = require("../middleware/fileUpload");

// Get all tasks
const getAllTasks = asyncWrapper(async (req, res) => {
    const { course, track, isActive, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (course) filter.course = course;
    if (track) filter.track = track;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const tasks = await EducationalTask.find(filter)
        .populate('course', 'name')
        .populate('track', 'name committee')
        .populate('createdBy', 'name email committee avatar')
        .populate('submissions.member', 'name email committee avatar')
        .populate('submissions.evaluatedBy', 'name email committee avatar')
        .sort({ order: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await EducationalTask.countDocuments(filter);
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            tasks,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }
    });
});

// Get single task by ID
const getTaskById = asyncWrapper(async (req, res) => {
    const { taskId } = req.params;
    
    const task = await EducationalTask.findById(taskId)
        .populate('course', 'name')
        .populate('track', 'name committee')
        .populate('createdBy', 'name email committee avatar')
        .populate('submissions.member', 'name email committee avatar')
        .populate('submissions.evaluatedBy', 'name email committee avatar');
    
    if (!task) {
        throw createError(404, httpStatusText.FAIL, "Task not found");
    }
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: task
    });
});

// Create new task
const createTask = asyncWrapper(async (req, res) => {
    const { 
        title, 
        description, 
        course, 
        order, 
        points, 
        startDate, 
        deadline, 
        taskUrl 
    } = req.body;
    const email = req.decoded.email;
    
    const creator = await Member.findOne({ email });
    if (!creator) {
        throw createError(404, httpStatusText.FAIL, "Creator not found");
    }
    
    // Verify course exists
    const courseDoc = await EducationalCourse.findById(course);
    if (!courseDoc) {
        throw createError(404, httpStatusText.FAIL, "Course not found");
    }
    
    // Check if task with same title exists in the course
    const existingTask = await EducationalTask.findOne({ 
        title: { $regex: new RegExp(`^${title}$`, 'i') }, 
        course 
    });
    
    if (existingTask) {
        throw createError(400, httpStatusText.FAIL, "Task with this title already exists in this course");
    }
    
    // Check if order is already taken
    const existingOrder = await EducationalTask.findOne({ course, order });
    if (existingOrder) {
        throw createError(400, httpStatusText.FAIL, "Task order already taken in this course");
    }
    
    const taskData = {
        title,
        description,
        course,
        track: courseDoc.track, // Get track from course
        order: parseInt(order),
        points: parseInt(points),
        startDate: new Date(startDate),
        deadline: new Date(deadline),
        taskUrl: taskUrl || null,
        createdBy: creator._id
    };
    
    const task = new EducationalTask(taskData);
    await task.save();
    
    await task.populate('course', 'name');
    await task.populate('track', 'name committee');
    await task.populate('createdBy', 'name email committee avatar');
    
    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: task,
        message: "Task created successfully"
    });
});

// Update task
const updateTask = asyncWrapper(async (req, res) => {
    const { taskId } = req.params;
    const { 
        title, 
        description, 
        course, 
        order, 
        points, 
        startDate, 
        deadline, 
        taskUrl, 
        isActive 
    } = req.body;
    const email = req.decoded.email;
    
    const task = await EducationalTask.findById(taskId);
    if (!task) {
        throw createError(404, httpStatusText.FAIL, "Task not found");
    }
    
    const updater = await Member.findOne({ email });
    if (!updater) {
        throw createError(404, httpStatusText.FAIL, "Updater not found");
    }
    
    // Check permissions (only creator or admin can update)
    if (task.createdBy.toString() !== updater._id.toString() && 
        !['leader', 'viceLeader'].includes(updater.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    // Check if title change conflicts with existing task
    if (title && title !== task.title) {
        const existingTask = await EducationalTask.findOne({ 
            title: { $regex: new RegExp(`^${title}$`, 'i') }, 
            course: course || task.course,
            _id: { $ne: taskId }
        });
        
        if (existingTask) {
            throw createError(400, httpStatusText.FAIL, "Task with this title already exists in this course");
        }
    }
    
    // Check if order change conflicts
    if (order && parseInt(order) !== task.order) {
        const existingOrder = await EducationalTask.findOne({ 
            course: course || task.course, 
            order: parseInt(order),
            _id: { $ne: taskId }
        });
        
        if (existingOrder) {
            throw createError(400, httpStatusText.FAIL, "Task order already taken in this course");
        }
    }
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (course) updateData.course = course;
    if (order) updateData.order = parseInt(order);
    if (points) updateData.points = parseInt(points);
    if (startDate) updateData.startDate = new Date(startDate);
    if (deadline) updateData.deadline = new Date(deadline);
    if (taskUrl !== undefined) updateData.taskUrl = taskUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Update track if course changes
    if (course) {
        const courseDoc = await EducationalCourse.findById(course);
        if (courseDoc) {
            updateData.track = courseDoc.track;
        }
    }
    
    const updatedTask = await EducationalTask.findByIdAndUpdate(
        taskId,
        updateData,
        { new: true, runValidators: true }
    ).populate('course', 'name')
     .populate('track', 'name committee')
     .populate('createdBy', 'name email committee avatar')
     .populate('submissions.member', 'name email committee avatar')
     .populate('submissions.evaluatedBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: updatedTask,
        message: "Task updated successfully"
    });
});

// Delete task
const deleteTask = asyncWrapper(async (req, res) => {
    const { taskId } = req.params;
    const email = req.decoded.email;
    
    const task = await EducationalTask.findById(taskId);
    if (!task) {
        throw createError(404, httpStatusText.FAIL, "Task not found");
    }
    
    const deleter = await Member.findOne({ email });
    if (!deleter) {
        throw createError(404, httpStatusText.FAIL, "Deleter not found");
    }
    
    // Check permissions (only creator or admin can delete)
    if (task.createdBy.toString() !== deleter._id.toString() && 
        !['leader', 'viceLeader'].includes(deleter.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    await EducationalTask.findByIdAndDelete(taskId);
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Task deleted successfully"
    });
});

// Submit task
const submitTask = asyncWrapper(async (req, res) => {
    const { taskId } = req.params;
    const { submissionLink } = req.body;
    const email = req.decoded.email;
    
    const task = await EducationalTask.findById(taskId);
    if (!task) {
        throw createError(404, httpStatusText.FAIL, "Task not found");
    }
    
    const member = await Member.findOne({ email });
    if (!member) {
        throw createError(404, httpStatusText.FAIL, "Member not found");
    }
    
    // Check if task is active
    if (!task.isActive) {
        throw createError(400, httpStatusText.FAIL, "Task is not active");
    }
    
    // Check if deadline has passed
    if (new Date() > task.deadline) {
        throw createError(400, httpStatusText.FAIL, "Task deadline has passed");
    }
    
    // Check if member already submitted
    const existingSubmission = task.submissions.find(s => s.member.toString() === member._id.toString());
    if (existingSubmission) {
        throw createError(400, httpStatusText.FAIL, "You have already submitted this task");
    }
    
    const submission = {
        member: member._id,
        submissionLink: req.fileUrl || submissionLink || "*",
        submittedAt: new Date()
    };
    
    // Add file info if uploaded
    if (req.fileUrl) {
        submission.downloadSubmissionUrl = req.fileUrl;
        submission.submissionFileId = req.publicId;
    }
    
    task.submissions.push(submission);
    await task.save();
    
    await task.populate('course', 'name');
    await task.populate('track', 'name committee');
    await task.populate('createdBy', 'name email committee avatar');
    await task.populate('submissions.member', 'name email committee avatar');
    await task.populate('submissions.evaluatedBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: task,
        message: "Task submitted successfully"
    });
});

// Evaluate task submission
const evaluateTask = asyncWrapper(async (req, res) => {
    const { taskId, memberId } = req.params;
    const { headEvaluation, notes } = req.body;
    const email = req.decoded.email;
    
    const task = await EducationalTask.findById(taskId);
    if (!task) {
        throw createError(404, httpStatusText.FAIL, "Task not found");
    }
    
    const evaluator = await Member.findOne({ email });
    if (!evaluator) {
        throw createError(404, httpStatusText.FAIL, "Evaluator not found");
    }
    
    // Check permissions
    if (!['leader', 'viceLeader', 'head', 'vice'].includes(evaluator.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    const submission = task.submissions.find(s => s.member.toString() === memberId);
    if (!submission) {
        throw createError(404, httpStatusText.FAIL, "Submission not found");
    }
    
    // Calculate deadline evaluation
    const deadlineEvaluation = new Date() <= task.deadline ? task.points * 0.2 : 0;
    
    // Calculate total rate
    const totalRate = (headEvaluation || 0) + deadlineEvaluation;
    
    submission.headEvaluation = headEvaluation || 0;
    submission.deadlineEvaluation = deadlineEvaluation;
    submission.rate = totalRate;
    submission.notes = notes;
    submission.evaluatedBy = evaluator._id;
    submission.evaluatedAt = new Date();
    
    await task.save();
    
    await task.populate('course', 'name');
    await task.populate('track', 'name committee');
    await task.populate('createdBy', 'name email committee avatar');
    await task.populate('submissions.member', 'name email committee avatar');
    await task.populate('submissions.evaluatedBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: task,
        message: "Task evaluated successfully"
    });
});

// Get member's task submissions
const getMemberSubmissions = asyncWrapper(async (req, res) => {
    const { memberId } = req.params;
    const email = req.decoded.email;
    
    const member = await Member.findById(memberId);
    if (!member) {
        throw createError(404, httpStatusText.FAIL, "Member not found");
    }
    
    const requester = await Member.findOne({ email });
    if (!requester) {
        throw createError(404, httpStatusText.FAIL, "Requester not found");
    }
    
    // Check permissions (member can see their own submissions, admins can see all)
    if (member._id.toString() !== requester._id.toString() && 
        !['leader', 'viceLeader', 'head', 'vice'].includes(requester.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    const tasks = await EducationalTask.find({
        'submissions.member': memberId
    })
    .populate('course', 'name')
    .populate('track', 'name committee')
    .populate('createdBy', 'name email committee avatar')
    .populate('submissions.member', 'name email committee avatar')
    .populate('submissions.evaluatedBy', 'name email committee avatar')
    .sort({ 'submissions.submittedAt': -1 });
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: tasks
    });
});

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    submitTask,
    evaluateTask,
    getMemberSubmissions
}; 