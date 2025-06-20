const mongoose = require('mongoose');
const validator = require('validator');

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: [validator.isEmail, "Enter a valid email"]
  },
  phoneNumber: {
    type: String,
    validate: [validator.isMobilePhone, "Enter a valid phone number"]
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'mentor', 'partner', 'guest', 'other'],
    default: 'other'
  },
  organization: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  socialLinks: {
    linkedin: String,
    github: String,
    twitter: String,
    website: String
  },
  skills: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
personSchema.index({ email: 1 });
personSchema.index({ role: 1, isActive: 1 });
personSchema.index({ name: 1 });
personSchema.index({ tags: 1 });

const Person = mongoose.model('Person', personSchema);

module.exports = Person; 