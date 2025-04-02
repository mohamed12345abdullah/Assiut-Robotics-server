const Announcement = require("../mongoose.models/announcement");

const asyncWrapper = require("../middleware/asyncWrapper");

const httpStatusText = require("../utils/httpStatusText");

const createError = require("../utils/createError");

const bcrypt = require("../middleware/bcrypt");

const Member=require("../mongoose.models/member");

const addAnnouncement = asyncWrapper(async (req, res, next) => {
    const { title, content ,dateOfDelete} = req.body;
    const email= req.decoded.email;
    const member= await Member.findOne({email});
    if (!member) {
        const error = createError(404, httpStatusText.FAIL, "Member not found");
        throw error;
    }


    const newAnnouncement = new Announcement({
        title,
        content,
        dateOfDelete,
        creator:member._id
    });
    await newAnnouncement.save();
    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: newAnnouncement,
        message: "Announcement added successfully"
    });
})

const getAnnouncements = asyncWrapper(async (req, res, next) => {
    let announcements = await Announcement.find({})
    // delete announcement that dateOfDelete is passed

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    announcements.forEach(async (announcement) => {
        if (announcement.dateOfDelete < now) {
            console.log("Announcement deleted: ", announcement.title);
            await announcement.deleteOne();
        }
    });

    announcements = await Announcement.find()
    .populate('creator', 'name email role committee phoneNumber avatar');

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: announcements,
        message: "Announcements fetched successfully"
    });
})

const updateAnnouncement = asyncWrapper(async (req, res, next) => {
    const { title, content ,dateOfDelete} = req.body;
    const announcementId = req.params.id;
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
        const error = createError(404, httpStatusText.FAIL, "Announcement not found");
        throw error;
    }
    announcement.title = title;
    announcement.content = content;
    announcement.dateOfDelete = dateOfDelete;
    await announcement.save();
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: announcement,
        message: "Announcement updated successfully"
    });
})

const deleteAnnouncement = asyncWrapper(async (req, res, next) => {
    const announcementId = req.params.id;
    const announcement = await Announcement.findByIdAndDelete(announcementId);
    if (!announcement) {
        const error = createError(404, httpStatusText.FAIL, "Announcement not found");
        throw error;
    }
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: announcement,
        message: "Announcement deleted successfully"
    });
})



const deleteAll = asyncWrapper(async (req, res, next) => {
    const announcements = await Announcement.deleteMany();
    console.log("Announcements deleted: ", announcements);
})

// deleteAll()

module.exports = {
    addAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
}
