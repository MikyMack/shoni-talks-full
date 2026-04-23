const mongoose = require("mongoose");


const accessSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    },

    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
    },

    expiresAt: Date, // null = lifetime

}, { timestamps: true });

module.exports = mongoose.model("UserAccess", accessSchema);