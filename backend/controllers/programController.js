const Program = require("../models/program");
const slugify = require("slugify");

// ================== HELPERS ==================
const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    success: status < 400,
    message,
    data,
  });
};

// Clean schedules (important)
const parseSchedules = (schedules) => {
  if (!schedules) return [];

  // If coming from form-data (string)
  if (typeof schedules === "string") {
    try {
      schedules = JSON.parse(schedules);
    } catch {
      return [];
    }
  }

  return schedules.map((s) => ({
    startDate: s.startDate,
    endDate: s.endDate || null,
    location: s.location,
    venue: s.venue || "",
    price: s.price || 0,
    offerPrice: s.offerPrice || 0,
    seats: s.seats || 0,
    joinLink: s.joinLink || "",
    status: s.status || "upcoming",
    isActive: true,
  }));
};

// ================== CREATE ==================
exports.createProgram = async (req, res) => {
  try {
    const { title, description, duration, category, features, schedules } =
      req.body;

    if (!title || !description) {
      return sendResponse(res, 400, "Title and description are required");
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await Program.findOne({ slug });
    if (existing) {
      return sendResponse(res, 409, "Program with this title already exists");
    }

    const program = new Program({
      title,
      slug,
      description,
      duration,
      category,
      features:
        typeof features === "string"
          ? JSON.parse(features).map((f) => f.trim())
          : features,
      schedules: parseSchedules(schedules),
      image: req.file?.filename || "",
    });

    await program.save();

    return sendResponse(res, 201, "Program created successfully", program);
  } catch (err) {
    console.error("CREATE PROGRAM ERROR:", err);
    return sendResponse(res, 500, "Server error");
  }
};

// ================== GET ALL ==================
exports.getPrograms = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const programs = await Program.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Program.countDocuments(query);

    return sendResponse(res, 200, "Programs fetched", {
      programs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET PROGRAMS ERROR:", err);
    return sendResponse(res, 500, "Failed to fetch programs");
  }
};

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

    if (updates.title) {
      updates.slug = slugify(updates.title, {
        lower: true,
        strict: true,
      });
    }

    if (updates.schedules) {
      updates.schedules = parseSchedules(updates.schedules);
    }

    if (updates.features && typeof updates.features === "string") {
      try {
        updates.features = JSON.parse(updates.features).map((f) => f.trim());
      } catch {
        updates.features = updates.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
      }
    }

    if (req.file) {
      updates.image = req.file.filename;
    }

    const program = await Program.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!program) {
      return sendResponse(res, 404, "Program not found");
    }

    return sendResponse(res, 200, "Program updated successfully", program);
  } catch (err) {
    console.error("UPDATE PROGRAM ERROR:", err);
    return sendResponse(res, 500, "Failed to update program");
  }
};

// ================== DELETE ==================
exports.deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
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
