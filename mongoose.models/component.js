const mongoose = require("mongoose");

const componentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number },
  taxes: { type: Number },
  ads: { type: Number },
  discount: { type: Number },
  total: { type: Number },
  category: { type: String },
  status: { 
    type: String, 
    enum: ['available', 'borrowed', 'maintenance', 'reserved'],
    default: 'available'
  },
  deleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  deletedAt: { type: Date },
  
  // Creation info
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  createdAt: { type: Date, default: Date.now },
  
  // Update history
  updateHistory: [{
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    updatedAt: { type: Date, default: Date.now },
    changes: { type: Object }
  }],
  
  // Borrowing system
  currentBorrower: {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    borrowedAt: { type: Date },
    expectedReturnDate: { type: Date },
    returnedAt: { type: Date },
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    condition: { type: String }
  },
  
  borrowRequests: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    requestedAt: { type: Date, default: Date.now },
    purpose: { type: String },
    expectedReturnDate: { type: Date },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    processedAt: { type: Date },
    rejectionReason: { type: String }
  }],
  
  borrowHistory: [{
    borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    borrowedAt: { type: Date },
    returnedAt: { type: Date },
    expectedReturnDate: { type: Date },
    actualReturnDate: { type: Date },
    conditionWhenBorrowed: { type: String },
    conditionWhenReturned: { type: String }
  }],
  
  maintenanceHistory: [{
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    performedAt: { type: Date, default: Date.now },
    description: { type: String },
    cost: { type: Number },
    duration: { type: String } // e.g., "2 hours", "1 day"
  }]
});

const componentModel = mongoose.model("Component", componentSchema);
module.exports = componentModel;