const Announcement = require("../mongoose.models/announcement");

const asyncWrapper = require("../middleware/asyncWrapper");

const httpStatusText = require("../utils/httpStatusText");

const createError = require("../utils/createError");

const bcrypt = require("../middleware/bcrypt");


const addAnnouncement = asyncWrapper(async (req, res, next) => {
    const { title, content ,dateOfDelete} = req.body;
    const newAnnouncement = new Announcement({
        title,
        content,
        dateOfDelete
    });
    await newAnnouncement.save();
    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: newAnnouncement,
        message: "Announcement added successfully"
    });
})

const getAnnouncements = asyncWrapper(async (req, res, next) => {
    let announcements = await Announcement.find();
    // delete announcement that dateOfDelete is passed
    announcements.forEach(async (announcement) => {
        if (announcement.dateOfDelete < new Date()) {
            await announcement.deleteOne();
        }
    });

    announcements = await Announcement.find();
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

module.exports = {
    addAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
}
