const mongoose = require('mongoose');

const lapDateSchema = new mongoose.Schema({
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
})

const LapDate = mongoose.model('LapDate', lapDateSchema);

module.exports = LapDate;   

