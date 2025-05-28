const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    f_Id: { type: Number, required: true, unique: true },
    f_Image: { type: String },
    f_Name: { type: String, required: true },
    f_Email: { type: String, required: true },
    f_Mobile: { type: String, required: true },
    f_Designation: { type: String, required: true },
    f_gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    f_Course: { type: String },
    f_Createdate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Employee", employeeSchema);
