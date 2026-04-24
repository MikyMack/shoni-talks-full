const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: Date, // for plans like 30 days, 60 days

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: { type: String, unique: true, sparse: true },

    password: String,

    googleId: String,

    mobile: { type: String },

    otp: String,
    otpExpires: Date,
    otpVerified: { type: Boolean, default: false },

    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "guest"],
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isGuest: { type: Boolean, default: false },

    isBlocked: { type: Boolean, default: false },

    // 🔥 IMPORTANT PART
    enrollments: [enrollmentSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
