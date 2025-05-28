const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema({
    f_sno: { type: Number, required: true, unique: true },
    f_userName: { type: String, required: true },
    f_Pwd: { type: String, required: true }, // Store hashed password
});

module.exports = mongoose.model("Login", loginSchema);
