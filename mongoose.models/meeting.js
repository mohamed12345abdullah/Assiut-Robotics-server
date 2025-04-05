const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    //create tow dimemensional array form saturday to friday and 8:00 to 23:59
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    tableOfDates: {
        type: [[{
            time: String,
            isBooked: { type: Boolean, default: false },
            bookedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member',  }]
        }]],                                                                                                                                                  
        validate: {
            validator: function(array) {
                return array.length === 7 && array.every(day => Array.isArray(day));
            },
            message: "يجب أن يكون جدول التواريخ مصفوفة ثنائية الأبعاد تمثل أيام الأسبوع"
        }
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],

    
})

const Meeting = mongoose.model("Meeting", meetingSchema);

module.exports = Meeting;
