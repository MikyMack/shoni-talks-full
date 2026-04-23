const Program = require("../models/Program");
const slugify = require("slugify");

// ================== HELPERS ==================
const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    success: status < 400,
    message,
    data,
  });
};

// ================== PARSE SCHEDULES ==================
const parseSchedules = (schedules) => {
  if (!schedules) return [];

  if (typeof schedules === "string") {
    try {
      schedules = JSON.parse(schedules);
    } catch {
      return [];
    }
  }

  return schedules
    .filter((s) => s.startDate && s.location) // required fields
    .map((s) => ({
      startDate: s.startDate,
      endDate: s.endDate || null,
      location: s.location,
      venue: s.venue || "",
      price: Number(s.price) || 0,
      offerPrice: Number(s.offerPrice) || 0,
      seats: Number(s.seats) || 0,
      joinLink: s.joinLink || "",
      status: s.status || "upcoming",
      isActive: true,
    }));
};

// Helper to extract filenames from req.files
const getGalleryFiles = (req) => {
  if (req.files && req.files['gallery']) {
    return req.files['gallery'].map(file => file.filename);
  }
  return [];
};

// ================== CREATE ==================
exports.createProgram = async (req, res) => {
  try {
    const { title, description, isFeatured, features, schedules } = req.body;

    if (!title || !description) return sendResponse(res, 400, "Title and description required");

    // Check for main image in the new fields format
    const mainImage = req.files && req.files['image'] ? req.files['image'][0].filename : null;
    if (!mainImage) return sendResponse(res, 400, "Main image is required");

    const slug = slugify(title, { lower: true, strict: true });
    const existing = await Program.findOne({ slug });
    if (existing) return sendResponse(res, 409, "Program already exists");

    const program = new Program({
      ...req.body,
      slug,
      isFeatured: isFeatured === "true",
      features: typeof features === "string" ? JSON.parse(features) : features,
      schedules: parseSchedules(schedules),
      image: mainImage,
      gallery: getGalleryFiles(req) // NEW: Save the gallery array
    });

    await program.save();
    return sendResponse(res, 201, "Program created successfully", program);
  } catch (err) {
    return sendResponse(res, 500, "Server error");
  }
};

// ================== GET ALL ==================
exports.getPrograms = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const query = { isActive: true };

    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };

    const programs = await Program.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Program.countDocuments(query);

    return sendResponse(res, 200, "Programs fetched", {
      programs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("GET PROGRAMS ERROR:", err);
    return sendResponse(res, 500, "Failed to fetch programs");
  }
};

// ================== GET ONE ==================
exports.getProgram = async (req, res) => {
  try {
    const program = await Program.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!program) {
      return sendResponse(res, 404, "Program not found");
    }

    return sendResponse(res, 200, "Program fetched", program);
  } catch (err) {
    console.error("GET PROGRAM ERROR:", err);
    return sendResponse(res, 500, "Failed to fetch program");
  }
};

// ================== UPDATE ==================
exports.updateProgram = async (req, res) => {
  try {
    const updates = { ...req.body };
    const programId = req.params.id;

    // 1. Handle Main Image
    if (req.files && req.files['image']) {
      updates.image = req.files['image'][0].filename;
    }

    // 2. Handle Gallery Logic (The tricky part)
    let finalGallery = [];
    
    // Get filenames we want to KEEP (sent from frontend)
    if (updates.existingGallery) {
      finalGallery = JSON.parse(updates.existingGallery);
    }

    // Add NEWLY uploaded gallery images
    const newFiles = getGalleryFiles(req);
    finalGallery = [...finalGallery, ...newFiles];
    
    updates.gallery = finalGallery;

    // 3. Standard parsing (same as your original code)
    if (updates.title) updates.slug = slugify(updates.title, { lower: true, strict: true });
    if (updates.features) updates.features = typeof updates.features === "string" ? JSON.parse(updates.features) : updates.features;
    if (updates.schedules) updates.schedules = parseSchedules(updates.schedules);
    if (updates.isFeatured !== undefined) updates.isFeatured = updates.isFeatured === "true";

    const program = await Program.findByIdAndUpdate(programId, updates, { new: true });
    
    if (!program) return sendResponse(res, 404, "Program not found");
    return sendResponse(res, 200, "Program updated successfully", program);
  } catch (err) {
    return sendResponse(res, 500, "Failed to update program");
  }
};

// ================== DELETE (SOFT) ==================
exports.deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!program) {
      return sendResponse(res, 404, "Program not found");
    }

    return sendResponse(res, 200, "Program deleted successfully");
  } catch (err) {
    console.error("DELETE PROGRAM ERROR:", err);
    return sendResponse(res, 500, "Failed to delete program");
  }
};