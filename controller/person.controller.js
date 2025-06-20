require("dotenv").config();
const MONGOURL = process.env.MONGOURL || "mongodb://localhost:27017/assiut-robotics";
const mongoose = require("mongoose");
mongoose.connect(MONGOURL);

const Person = require("../mongoose.models/person");
const Member = require("../mongoose.models/member");

const asyncWrapper = require("../middleware/asyncWrapper");
const createError = require("../utils/createError");
const httpStatusText = require("../utils/httpStatusText");
const { deleteFromCloudinary } = require("../middleware/fileUpload");

// Get all people
const getAllPeople = asyncWrapper(async (req, res) => {
    const { role, isActive, tags, page = 1, limit = 10, search } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        filter.tags = { $in: tagArray };
    }
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { organization: { $regex: search, $options: 'i' } },
            { position: { $regex: search, $options: 'i' } }
        ];
    }
    
    const people = await Person.find(filter)
        .populate('createdBy', 'name email committee avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Person.countDocuments(filter);
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            people,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }
    });
});

// Get single person by ID
const getPersonById = asyncWrapper(async (req, res) => {
    const { personId } = req.params;
    
    const person = await Person.findById(personId)
        .populate('createdBy', 'name email committee avatar');
    
    if (!person) {
        throw createError(404, httpStatusText.FAIL, "Person not found");
    }
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: person
    });
});

// Create new person
const createPerson = asyncWrapper(async (req, res) => {
    const { 
        name, 
        email, 
        phoneNumber, 
        role, 
        organization, 
        position, 
        bio, 
        socialLinks, 
        skills, 
        interests, 
        tags, 
        notes 
    } = req.body;
    const email_creator = req.decoded.email;
    
    const creator = await Member.findOne({ email: email_creator });
    if (!creator) {
        throw createError(404, httpStatusText.FAIL, "Creator not found");
    }
    
    // Check if person with same email exists
    const existingPerson = await Person.findOne({ email });
    if (existingPerson) {
        throw createError(400, httpStatusText.FAIL, "Person with this email already exists");
    }
    
    const personData = {
        name,
        email,
        phoneNumber,
        role: role || 'other',
        organization,
        position,
        bio,
        socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
        skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
        interests: interests ? interests.split(',').map(interest => interest.trim()) : [],
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        notes,
        createdBy: creator._id
    };
    
    // Add avatar if uploaded
    if (req.imageUrl) {
        personData.avatar = req.imageUrl;
    }
    
    const person = new Person(personData);
    await person.save();
    
    await person.populate('createdBy', 'name email committee avatar');
    
    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: person,
        message: "Person created successfully"
    });
});

// Update person
const updatePerson = asyncWrapper(async (req, res) => {
    const { personId } = req.params;
    const { 
        name, 
        email, 
        phoneNumber, 
        role, 
        organization, 
        position, 
        bio, 
        socialLinks, 
        skills, 
        interests, 
        tags, 
        notes, 
        isActive 
    } = req.body;
    const email_updater = req.decoded.email;
    
    const person = await Person.findById(personId);
    if (!person) {
        throw createError(404, httpStatusText.FAIL, "Person not found");
    }
    
    const updater = await Member.findOne({ email: email_updater });
    if (!updater) {
        throw createError(404, httpStatusText.FAIL, "Updater not found");
    }
    
    // Check permissions (only creator or admin can update)
    if (person.createdBy.toString() !== updater._id.toString() && 
        !['leader', 'viceLeader'].includes(updater.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    // Check if email change conflicts with existing person
    if (email && email !== person.email) {
        const existingPerson = await Person.findOne({ 
            email,
            _id: { $ne: personId }
        });
        
        if (existingPerson) {
            throw createError(400, httpStatusText.FAIL, "Person with this email already exists");
        }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (role) updateData.role = role;
    if (organization !== undefined) updateData.organization = organization;
    if (position !== undefined) updateData.position = position;
    if (bio !== undefined) updateData.bio = bio;
    if (socialLinks) updateData.socialLinks = JSON.parse(socialLinks);
    if (skills) updateData.skills = skills.split(',').map(skill => skill.trim());
    if (interests) updateData.interests = interests.split(',').map(interest => interest.trim());
    if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Handle avatar update
    if (req.imageUrl) {
        // Delete old avatar from Cloudinary if exists
        if (person.avatar && person.avatar.includes('cloudinary')) {
            const publicId = person.avatar.split('/').pop().split('.')[0];
            await deleteFromCloudinary(publicId);
        }
        updateData.avatar = req.imageUrl;
    }
    
    const updatedPerson = await Person.findByIdAndUpdate(
        personId,
        updateData,
        { new: true, runValidators: true }
    ).populate('createdBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: updatedPerson,
        message: "Person updated successfully"
    });
});

// Delete person
const deletePerson = asyncWrapper(async (req, res) => {
    const { personId } = req.params;
    const email_deleter = req.decoded.email;
    
    const person = await Person.findById(personId);
    if (!person) {
        throw createError(404, httpStatusText.FAIL, "Person not found");
    }
    
    const deleter = await Member.findOne({ email: email_deleter });
    if (!deleter) {
        throw createError(404, httpStatusText.FAIL, "Deleter not found");
    }
    
    // Check permissions (only creator or admin can delete)
    if (person.createdBy.toString() !== deleter._id.toString() && 
        !['leader', 'viceLeader'].includes(deleter.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    // Delete avatar from Cloudinary if exists
    if (person.avatar && person.avatar.includes('cloudinary')) {
        const publicId = person.avatar.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
    }
    
    await Person.findByIdAndDelete(personId);
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Person deleted successfully"
    });
});

// Add tag to person
const addTag = asyncWrapper(async (req, res) => {
    const { personId } = req.params;
    const { tag } = req.body;
    const email_adder = req.decoded.email;
    
    const person = await Person.findById(personId);
    if (!person) {
        throw createError(404, httpStatusText.FAIL, "Person not found");
    }
    
    const adder = await Member.findOne({ email: email_adder });
    if (!adder) {
        throw createError(404, httpStatusText.FAIL, "Adder not found");
    }
    
    // Check permissions
    if (person.createdBy.toString() !== adder._id.toString() && 
        !['leader', 'viceLeader'].includes(adder.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    if (!person.tags.includes(tag)) {
        person.tags.push(tag);
        await person.save();
    }
    
    await person.populate('createdBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: person,
        message: "Tag added successfully"
    });
});

// Remove tag from person
const removeTag = asyncWrapper(async (req, res) => {
    const { personId, tag } = req.params;
    const email_remover = req.decoded.email;
    
    const person = await Person.findById(personId);
    if (!person) {
        throw createError(404, httpStatusText.FAIL, "Person not found");
    }
    
    const remover = await Member.findOne({ email: email_remover });
    if (!remover) {
        throw createError(404, httpStatusText.FAIL, "Remover not found");
    }
    
    // Check permissions
    if (person.createdBy.toString() !== remover._id.toString() && 
        !['leader', 'viceLeader'].includes(remover.role)) {
        throw createError(403, httpStatusText.FAIL, "Insufficient permissions");
    }
    
    person.tags = person.tags.filter(t => t !== tag);
    await person.save();
    
    await person.populate('createdBy', 'name email committee avatar');
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: person,
        message: "Tag removed successfully"
    });
});

// Get people by role
const getPeopleByRole = asyncWrapper(async (req, res) => {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const people = await Person.find({ role, isActive: true })
        .populate('createdBy', 'name email committee avatar')
        .sort({ name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Person.countDocuments({ role, isActive: true });
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            people,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }
    });
});

// Get people by tags
const getPeopleByTags = asyncWrapper(async (req, res) => {
    const { tags } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const tagArray = tags.split(',').map(tag => tag.trim());
    
    const people = await Person.find({ 
        tags: { $in: tagArray }, 
        isActive: true 
    })
        .populate('createdBy', 'name email committee avatar')
        .sort({ name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await Person.countDocuments({ 
        tags: { $in: tagArray }, 
        isActive: true 
    });
    
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            people,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }
    });
});

module.exports = {
    getAllPeople,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    addTag,
    removeTag,
    getPeopleByRole,
    getPeopleByTags
}; 