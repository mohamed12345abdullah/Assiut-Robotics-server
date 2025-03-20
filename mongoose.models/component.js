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

  requestToBorrow:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  } ,
  // إضافة حقول الاستعارة
  borrowedBy: { 
    type: {
      member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
      borrowDate: { type: Date, default: null },
      returnDate: { type: Date, default: null },
    },
    default: null
  },
  history: {
    type: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        borrowDate: { type: Date, default: null },
        returnDate: { type: Date, default: null },
      }
    ],
    default: []
  }
});

const componentModel = mongoose.model("Component", componentSchema);
module.exports = componentModel;