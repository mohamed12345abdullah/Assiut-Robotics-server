// const mongoose = require('mongoose');




// const TaskSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: String,
//   deadline: Date,
//   points: String,
//   materialLink: String,
// });

// const CourseSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   tasks: [TaskSchema], // كل كورس يحتوي على مجموعة من التاسكات
// });





// const TrackSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   courses: [
//     {
//       course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
//     },
//   ],
// });


// const MemberSchema = new mongoose.Schema({
//   name: { type: String, required: true },

//   tracks: [
//     { track: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' } },
//   ],

 
// });



// const Track = mongoose.model('Track', TrackSchema);

// const Course = mongoose.model('Course', CourseSchema);

// const Task = mongoose.model('Task', TaskSchema);




// module.exports = {TaskSchema,CourseSchema,TrackSchema};