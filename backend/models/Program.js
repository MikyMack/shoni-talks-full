const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },

  endDate: Date,

  location: {
    type: String,
    required: true,
  },

  venue: String,

  price: Number,
  offerPrice: Number,

  seats: Number,

  joinLink: String,

  status: {
    type: String,
    enum: ["upcoming", "completed", "cancelled"],
    default: "upcoming",
  },

  isActive: {
    type: Boolean,
    default: true,
  }
});

const programSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    subtitle: String,

    description: {
      type: String,
      required: true,
    },

    shortDescription: String,

    image: {
      type: String,
      required: true,
    },

    gallery: [String],

    duration: String,

    category: {
      type: String,
      enum: ["student", "family", "mentoring", "workshop"],
    },

    features: [String],

    schedules: [scheduleSchema], 

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto slug
programSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-");
  }
  next();
});

module.exports = mongoose.model("Program", programSchema);