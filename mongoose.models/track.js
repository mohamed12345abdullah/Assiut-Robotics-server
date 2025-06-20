const mongoose = require('mongoose');

const educationalTrackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Track name is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Track description is required"]
  },
  committee: {
    type: String,
    required: [true, "Committee is required"]
  },
  image: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  members: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    }
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
educationalTrackSchema.index({ committee: 1, isActive: 1 });
educationalTrackSchema.index({ name: 1 });

const EducationalTrack = mongoose.model('EducationalTrack', educationalTrackSchema);

module.exports = EducationalTrack; 