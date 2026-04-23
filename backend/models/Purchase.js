const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    type: {
        type: String,
        enum: ["course", "plan"],
        required: true,
    },

    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    },

    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
    },

    amount: Number,

    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },

    paymentId: String, // Razorpay/Stripe

},
{ timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);