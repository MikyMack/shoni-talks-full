const mongoose = require("mongoose");
const slugify = require("slugify");

const courseSchema = new mongoose.Schema(
  {
    // ================= BASIC =================
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    shortDescription: {
      type: String,
      maxlength: [300, "Short description too long"],
    },

    category: {
      type: String,
      enum: [
        "personal",
        "student",
        "family",
        "organization",
        "office",
        "hospital",
      ],
      required: true,
    },

    // ================= MEDIA =================
    image: {
      type: String,
      default: "",
    },

    videos: [
      {
        title: String,
        url: {
          type: String,
          required: true,
        },
        isPreview: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          required: true,
        },
      },
    ],

    // ================= PRICING =================
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      default: 0,
    },

    offerPrice: {
      type: Number,
      validate: {
        validator: function (value) {
          // When using update
          if (this instanceof mongoose.Query) {
            const update = this.getUpdate();

            const price = update.price ?? update.$set?.price;
            if (!price) return true;

            return value <= price;
          }

          // Normal document validation
          return value <= this.price;
        },
        message: "Offer price must be less than or equal to price",
      },
    },

    // ================= COURSE CONTENT =================
    learnings: [
      {
        type: String,
        trim: true,
      },
    ],

    // ================= STRUCTURED INCLUDES =================
    duration: {
      type: String, // "12 hours"
    },

    videoHours: {
      type: Number,
      min: 0,
    },

    resourcesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    directAccessType: {
      type: String,
      enum: ["lifetime", "limited"],
      default: "lifetime",
    },
    directAccessDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ["days", "weeks", "months"],
      },
    },

    hasCertificate: {
      type: Boolean,
      default: false,
    },

    // ================= FLEXIBLE EXTRAS =================
    includes: [
      {
        type: String,
        trim: true,
      },
    ],
    allowDirectPurchase: {
      type: Boolean,
      default: true,
    },

    // ================= FLAGS =================
    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// ================= INDEXES =================
courseSchema.index({ title: "text", description: "text" });

// ================= SLUG GENERATION =================
courseSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
    });
  }
  next();
});

// ================= EXPORT =================
module.exports = mongoose.model("Course", courseSchema);
