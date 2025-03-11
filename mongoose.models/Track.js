const mongoose = require('mongoose');
const validator = require('validator');





const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  time: String,
  score: String,
  materialLink: String,
  evaluation: String, // تقييم المسؤول
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  tasks: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }

  ], // كل كورس يحتوي على مجموعة من التاسكات
  members: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }
  ]
});

const trackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  courses: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }

  ], // كل تراك يحتوي على مجموعة من الكورسات
  committee: String,

});

const Track = mongoose.model('Track', trackSchema);
const Course = mongoose.model('Course', courseSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = { Track, Course, Task };