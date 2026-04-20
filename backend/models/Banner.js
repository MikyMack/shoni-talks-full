const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    image: String,
    title: String,
    isActive: { type: Boolean, default: true }
  });
  module.exports = mongoose.model('Banner', bannerSchema);