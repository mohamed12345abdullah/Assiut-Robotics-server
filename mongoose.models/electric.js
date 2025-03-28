const mongoose = require('mongoose');




const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  deadline: Date,
  points: Number,
  materialLink: String,
  score: Number,
  rate: Number,
});

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  tasks: [TaskSchema], 
  students: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    },
  ],
});





const TrackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  courses: [
    {
      course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    },
  ],
  students: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    },
  ],
});


const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email:{ type: String, required: true },
  info:{
    type: String,
  },

  tracks: [TrackSchema],

 
});

const assistantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email:{ type: String, required: true },
  info:{
    type: String,
  },
  course:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }
})


const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email:{ type: String, required: true },
  info:{
    type: String,
  },
  track:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }
})


const Track = mongoose.model('Track', TrackSchema);

const Course = mongoose.model('Course', CourseSchema);

const Task = mongoose.model('Task', TaskSchema);

const Assistant = mongoose.model('Assistant', assistantSchema);

const Student = mongoose.model('Student', StudentSchema);

const Admin = mongoose.model('Admin', adminSchema);




module.exports = {
  Track,
  Course,
  Task,
  Assistant,
  Student,
  Admin
};