const mongoose = require("mongoose");


const visitsSchema = new mongoose.Schema({
    ip: { type: String, required: true , unique: true},
    history: [
        {
           visitStart: { type: Date, default: null },
           visitEnd: { type: Date, default: null },
        }
    ]
})

const Visits = mongoose.model("Visits", visitsSchema);

module.exports = Visits;
