const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // تاريخ الانتهاء وبعدها يتم الحذف
    dateOfDelete: {
        type: Date,
        default: Date.now
    },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }
});

const announcement = mongoose.model("announcement", announcementSchema);

module.exports = announcement;