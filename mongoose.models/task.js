const mongoose = require('mongoose');

const educationalTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Task title is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Task description is required"]
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EducationalCourse',
    required: [true, "Course reference is required"]
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EducationalTrack',
    required: [true, "Track reference is required"]
  },
  order: {
    type: Number,
    required: [true, "Task order is required"],
    min: 1
  },
  points: {
    type: Number,
    required: [true, "Task points are required"],
    min: 0
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },
  deadline: {
    type: Date,
    required: [true, "Deadline is required"]
  },
  taskUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  submissions: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    submissionLink: {
      type: String,
      default: "*"
    },
    submissionFileId: String,
    downloadSubmissionUrl: String,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    headEvaluation: {
      type: Number,
      default: -1
    },
    headPercent: {
      type: Number,
      default: 50
    },
    deadlineEvaluation: {
      type: Number,
      default: 0
    },
    deadlinePercent: {
      type: Number,
      default: 20
    },
    rate: Number,
    notes: String,
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    evaluatedAt: Date
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
educationalTaskSchema.index({ course: 1, order: 1 });
educationalTaskSchema.index({ track: 1, isActive: 1 });
educationalTaskSchema.index({ deadline: 1 });

const EducationalTask = mongoose.model('EducationalTask', educationalTaskSchema);

module.exports = EducationalTask; 