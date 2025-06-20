const mongoose = require('mongoose');

const educationalCourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Course name is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Course description is required"]
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EducationalTrack',
    required: [true, "Track reference is required"]
  },
  image: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    required: [true, "Course order is required"],
    min: 1
  },
  duration: {
    type: Number, // in hours
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  materials: [{
    title: String,
    type: {
      type: String,
      enum: ['video', 'document', 'link', 'file']
    },
    url: String,
    description: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
educationalCourseSchema.index({ track: 1, order: 1 });
educationalCourseSchema.index({ track: 1, isActive: 1 });

const EducationalCourse = mongoose.model('EducationalCourse', educationalCourseSchema);

module.exports = EducationalCourse; 