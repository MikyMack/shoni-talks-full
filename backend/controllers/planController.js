const mongoose = require("mongoose");
const Plan = require("../models/Plan");
const Course = require("../models/Course");

// ================= HELPER =================
const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    success: status < 400,
    message,
    data,
  });
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ================= CREATE PLAN =================
exports.createPlan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      title,
      course,
      price,
      offerPrice,
      duration,
      features,
      sessions,
      isPopular,
    } = req.body;

    // ===== VALIDATION =====
    if (!title || !course || !price || !duration?.value || !duration?.unit) {
      return sendResponse(res, 400, "Required fields missing");
    }

    if (!isValidId(course)) {
      return sendResponse(res, 400, "Invalid course ID");
    }

    const courseExists = await Course.findById(course).session(session);
    if (!courseExists) {
      return sendResponse(res, 404, "Course not found");
    }

    const numericPrice = Number(price);
    const numericOffer = offerPrice !== undefined ? Number(offerPrice) : undefined;

    if (numericOffer && numericOffer > numericPrice) {
      return sendResponse(res, 400, "Offer price must be <= price");
    }

    // ===== CREATE =====
    const plan = await Plan.create(
      [
        {
          title,
          course,
          price: numericPrice,
          offerPrice: numericOffer,
          duration,
          features: features || [],
          sessions: sessions ? Number(sessions) : undefined,
          isPopular: !!isPopular,
          createdBy: req.session?.user?.id,
        },
      ],
      { session }
    );

    // ===== LINK TO COURSE =====
    await Course.findByIdAndUpdate(
      course,
      { $addToSet: { plans: plan[0]._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 201, "Plan created successfully", plan[0]);

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("CREATE PLAN ERROR:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return sendResponse(res, 400, messages.join(", "));
    }

    return sendResponse(res, 500, "Failed to create plan");
  }
};


// ================= GET ALL =================
exports.getPlans = async (req, res) => {
  try {
    const { course, active } = req.query;

    const query = {};

    if (course && isValidId(course)) {
      query.course = course;
    }

    if (active !== undefined) {
      query.isActive = active === "true";
    }

    const plans = await Plan.find(query)
      .populate("course", "title category")
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, "Plans fetched", plans);

  } catch (err) {
    console.error("GET PLANS ERROR:", err);
    return sendResponse(res, 500, "Failed to fetch plans");
  }
};


// ================= GET ONE =================
exports.getPlanById  = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendResponse(res, 400, "Invalid plan ID");
    }

    const plan = await Plan.findById(req.params.id)
      .populate("course", "title");

    if (!plan) {
      return sendResponse(res, 404, "Plan not found");
    }

    return sendResponse(res, 200, "Plan fetched", plan);

  } catch (err) {
    console.error("GET PLAN ERROR:", err);
    return sendResponse(res, 500, "Failed to fetch plan");
  }
};


// ================= UPDATE =================
exports.updatePlan = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendResponse(res, 400, "Invalid plan ID");
    }

    const existing = await Plan.findById(req.params.id);
    if (!existing) {
      return sendResponse(res, 404, "Plan not found");
    }

    const updates = { ...req.body };

    // ===== NUMERIC SANITIZE =====
    const price =
      updates.price !== undefined
        ? Number(updates.price)
        : existing.price;

    const offerPrice =
      updates.offerPrice !== undefined
        ? Number(updates.offerPrice)
        : existing.offerPrice;

    if (offerPrice && price && offerPrice > price) {
      return sendResponse(res, 400, "Offer price must be <= price");
    }

    updates.price = price;
    updates.offerPrice = offerPrice;

    if (updates.sessions !== undefined) {
      updates.sessions = Number(updates.sessions);
    }

    if (updates.isPopular !== undefined) {
      updates.isPopular =
        updates.isPopular === true || updates.isPopular === "true";
    }

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    return sendResponse(res, 200, "Plan updated", plan);

  } catch (err) {
    console.error("UPDATE PLAN ERROR:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return sendResponse(res, 400, messages.join(", "));
    }

    return sendResponse(res, 500, "Failed to update plan");
  }
};


// ================= DELETE =================
exports.deletePlan = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendResponse(res, 400, "Invalid plan ID");
    }

    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return sendResponse(res, 404, "Plan not found");
    }

    await Course.findByIdAndUpdate(plan.course, {
      $pull: { plans: plan._id },
    });

    return sendResponse(res, 200, "Plan deleted");

  } catch (err) {
    console.error("DELETE PLAN ERROR:", err);
    return sendResponse(res, 500, "Failed to delete plan");
  }
};


// ================= TOGGLE ACTIVE =================
exports.togglePlan = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendResponse(res, 400, "Invalid plan ID");
    }

    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return sendResponse(res, 404, "Plan not found");
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    return sendResponse(res, 200, "Plan status updated", plan);

  } catch (err) {
    console.error("TOGGLE PLAN ERROR:", err);
    return sendResponse(res, 500, "Failed to toggle plan");
  }
};