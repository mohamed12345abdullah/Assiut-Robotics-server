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
  // إضافة حقول الاستعارة
  borrowedBy: { 
    type: {
      borrowerName: { type: String, required: true }, // اسم المستعير
      borrowedDate: { type: Date, default: Date.now }, // تاريخ الاستعارة
      returnDate: { type: Date }, // تاريخ الإرجاع
    },
    default: null // القيمة الافتراضية null تعني أن المكون غير معار
  }
  ,history:{
    type: Array,
    default: []
  }
});

const componentModel = mongoose.model("Component", componentSchema);
module.exports = componentModel;