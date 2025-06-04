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
  deleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  creation: { 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    createdAt: { type: Date, default: Date.now },
  },
  historyOfUpdate: [
    {
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
      updatedAt: { type: Date, default: Date.now },
    }
  ],
  requestToBorrow:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  } ,
  // إضافة حقول الاستعارة
  borrowedBy: { 
    type: {
      member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
      acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
      borrowDate: { type: Date, default: null },
      deadlineDate: { type: Date, default: null },
      returnDate: { type: Date, default: null },
    },
    default: null
  },
  history: {
    type: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        borrowDate: { type: Date, default: null },
        deadlineDate: { type: Date, default: null },
        returnDate: { type: Date, default: null },
        returnBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
      }
    ],
    default: []
  }
});

const componentModel = mongoose.model("Component", componentSchema);
module.exports = componentModel;