const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    offerPrice: {
      type: Number,
      min: [0, "Offer price cannot be negative"],
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

    duration: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["days", "weeks", "months", "minutes", "hours"],
        required: true,
      },
    },

    features: {
      type: [String],
      default: [],
    },

    sessions: {
      type: Number,
      min: [0, "Sessions cannot be negative"],
    },

    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);