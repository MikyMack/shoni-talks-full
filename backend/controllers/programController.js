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

// ================== CREATE ==================
exports.createProgram = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      shortDescription,
      description,
      duration,
      category,
      status,
      isFeatured,
      features,
      schedules,
    } = req.body;

    if (!title || !description) {
      return sendResponse(res, 400, "Title and description are required");
    }

    if (!req.file) {
      return sendResponse(res, 400, "Image is required");
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await Program.findOne({ slug });
    if (existing) {
      return sendResponse(res, 409, "Program with this title already exists");
    }

    const program = new Program({
      title,
      slug,
      subtitle,
      shortDescription,
      description,
      duration,
      category,
      status: status || "draft",
      isFeatured: isFeatured === "true",
      features:
        typeof features === "string"
          ? JSON.parse(features).map((f) => f.trim())
          : features || [],
      schedules: parseSchedules(schedules),
      image: req.file.filename,
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

    // SLUG UPDATE + DUPLICATE CHECK
    if (updates.title) {
      const newSlug = slugify(updates.title, {
        lower: true,
        strict: true,
      });

      const existing = await Program.findOne({
        slug: newSlug,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return sendResponse(res, 409, "Another program with this title exists");
      }

      updates.slug = newSlug;
    }

    // FEATURES
    if (updates.features) {
      if (typeof updates.features === "string") {
        try {
          updates.features = JSON.parse(updates.features).map((f) => f.trim());
        } catch {
          updates.features = updates.features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
        }
      }
    }

    // BOOLEAN FIX
    if (updates.isFeatured !== undefined) {
      updates.isFeatured = updates.isFeatured === "true";
    }

    // SCHEDULES
    if (updates.schedules) {
      updates.schedules = parseSchedules(updates.schedules);
    }

    // IMAGE UPDATE
    if (req.file) {
      updates.image = req.file.filename;
    }

    const program = await Program.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!program) {
      return sendResponse(res, 404, "Program not found");
    }

    return sendResponse(res, 200, "Program updated successfully", program);
  } catch (err) {
    console.error("UPDATE PROGRAM ERROR:", err);
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