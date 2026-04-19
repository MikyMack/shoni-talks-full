const Course = require("../models/Course");
const Plan = require("../models/Plan");
const slugify = require("slugify");

// ================= HELPER =================
const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    success: status < 400,
    message,
    data,
  });
};

// sanitize arrays (important for form-data)
const parseArray = (data) => {
  if (!data) return [];

  if (typeof data === "string") {
    try {
      return JSON.parse(data).map((i) => i.trim()).filter(Boolean);
    } catch {
      return data.split(",").map((i) => i.trim()).filter(Boolean);
    }
  }

  return data;
};

// ================= CREATE =================
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      offerPrice,
    } = req.body;

    if (!title || !description || !category) {
      return sendResponse(res, 400, "Required fields missing");
    }

    const slug = slugify(title, { lower: true, strict: true });

    const exists = await Course.findOne({ slug });
    if (exists) {
      return sendResponse(res, 409, "Course already exists");
    }

    const course = await Course.create({
      title,
      slug,
      description,
      shortDescription: req.body.shortDescription,
      category,

      image: req.file?.filename || "",

      previewVideo: req.body.previewVideo,

      price,
      offerPrice,

      learnings: parseArray(req.body.learnings),
      includes: parseArray(req.body.includes),

      duration: req.body.duration,
      videoHours: req.body.videoHours,
      resourcesCount: req.body.resourcesCount,

      lifetimeAccess: req.body.lifetimeAccess === "true",
      hasCertificate: req.body.hasCertificate === "true",

    });

    return sendResponse(res, 201, "Course created", course);

  } catch (err) {
    console.error("CREATE COURSE ERROR:", err);
    return sendResponse(res, 500, "Server error");
  }
};

// ================= GET ALL =================
exports.getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;

    if (search) {
      query.$text = { $search: search };
    }

    const courses = await Course.find(query)
      .populate("plans")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    return sendResponse(res, 200, "Courses fetched", {
      courses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    console.error("GET COURSES ERROR:", err);
    return sendResponse(res, 500, "Failed to fetch courses");
  }
};

// ================= GET ONE =================
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("plans");

    if (!course || !course.isActive) {
      return sendResponse(res, 404, "Course not found");
    }

    return sendResponse(res, 200, "Course fetched", course);

  } catch (err) {
    console.error("GET COURSE ERROR:", err);
    return sendResponse(res, 500, "Failed to fetch course");
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const updates = { ...req.body };
    const mongoose = require("mongoose");

    console.log(updates.price , updates.offerPrice);
    

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, "Invalid course ID");
    }

    const existingCourse = await Course.findById(req.params.id);
    if (!existingCourse) {
      return sendResponse(res, 404, "Course not found");
    }

    // ================= SAFE NUMBER HANDLING =================
    const price =
      updates.price !== undefined && updates.price !== ""
        ? Number(updates.price)
        : existingCourse.price;

    const offerPrice =
      updates.offerPrice !== undefined && updates.offerPrice !== ""
        ? Number(updates.offerPrice)
        : existingCourse.offerPrice;

    // ================= VALIDATION =================
    if (
      offerPrice !== undefined &&
      price !== undefined &&
      offerPrice > price
    ) {
      return sendResponse(
        res,
        400,
        "Offer price cannot be greater than price"
      );
    }

    // ================= CLEAN EMPTY VALUES =================
    if (updates.price === "") delete updates.price;
    if (updates.offerPrice === "") delete updates.offerPrice;

    // ================= TYPE CAST =================
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    if (updates.offerPrice !== undefined) {
      updates.offerPrice = Number(updates.offerPrice);
    }
    

    if (updates.resourcesCount !== undefined && updates.resourcesCount !== "") {
      updates.resourcesCount = Number(updates.resourcesCount);
    }

    if (updates.videoHours !== undefined && updates.videoHours !== "") {
      updates.videoHours = Number(updates.videoHours);
    }

    // ================= BOOLEAN =================
    if (updates.lifetimeAccess !== undefined) {
      updates.lifetimeAccess =
        updates.lifetimeAccess === "true" || updates.lifetimeAccess === true;
    }

    if (updates.hasCertificate !== undefined) {
      updates.hasCertificate =
        updates.hasCertificate === "true" || updates.hasCertificate === true;
    }

    // ================= ARRAYS =================
    if (updates.learnings) {
      updates.learnings = parseArray(updates.learnings);
    }

    if (updates.includes) {
      updates.includes = parseArray(updates.includes);
    }

    // ================= SLUG =================
    if (updates.title) {
      updates.slug = slugify(updates.title, {
        lower: true,
        strict: true,
      });

      const existingSlug = await Course.findOne({
        slug: updates.slug,
        _id: { $ne: req.params.id },
      });

      if (existingSlug) {
        return sendResponse(res, 409, "Course already exists");
      }
    }

    // ================= IMAGE =================
    if (req.file) {
      updates.image = req.file.filename;
    }

    // ================= UPDATE =================
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    return sendResponse(res, 200, "Course updated successfully", course);

  } catch (err) {
    console.error("UPDATE COURSE ERROR:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return sendResponse(res, 400, messages.join(", "));
    }

    return sendResponse(res, 500, "Failed to update course");
  }
};

// ================= DELETE (SOFT) =================
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return sendResponse(res, 404, "Course not found");
    }

    return sendResponse(res, 200, "Course deleted");

  } catch (err) {
    console.error("DELETE COURSE ERROR:", err);
    return sendResponse(res, 500, "Failed to delete course");
  }
};

// ================= TOGGLE =================
exports.toggleCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return sendResponse(res, 404, "Course not found");
    }

    course.isActive = !course.isActive;
    await course.save();

    return sendResponse(res, 200, "Status updated", course);

  } catch (err) {
    console.error("TOGGLE COURSE ERROR:", err);
    return sendResponse(res, 500, "Failed to toggle course");
  }
};