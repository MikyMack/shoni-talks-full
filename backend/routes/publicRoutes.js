const express = require("express");
const router = express.Router();
const Banner = require("../models/Banner");
const Blog = require("../models/Blog");
const Testimonial = require("../models/Testimonial");
const Program = require("../models/Program");
const Course = require("../models/Course");
const Plan = require("../models/Plan");
const { isAuthenticated } = require("../middleware/auth");
const Purchase = require("../models/Purchase");
const UserAccess = require("../models/UserAccess");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { default: mongoose } = require("mongoose");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// home page
router.get("/", async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // today at 00:00:00

    const [banners, blogs, testimonials, programs] = await Promise.all([
      Banner.find({ isActive: true }).sort({ createdAt: -1 }),
      Blog.find({ status: "published" }).sort({ createdAt: -1 }).limit(3),
      Testimonial.find().sort({ date: -1 }).limit(4),
      Program.find({ status: "published", isActive: true })
        .sort({ createdAt: -1 })
        .limit(3),
    ]);

    res.render("user/home", {
      title: "Home",
      banners,
      blogs,
      testimonials,
      programs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading home page data");
  }
});

// about page
router.get("/about", async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ date: -1 });
    res.render("user/about", { title: "About us", testimonials });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading about page data");
  }
});

// programs page
router.get("/programs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    const query = {
      isActive: true,
      status: "published",
    };

    const programs = await Program.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Program.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.render("user/programs", {
      title: "Programs",
      programs,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Programs Pagination Error:", error);
    res.status(500).send("Error loading programs");
  }
});

// program details page
router.get("/program/:slug", async (req, res) => {
  try {
    const program = await Program.findOne({
      slug: req.params.slug,
      isActive: true,
      status: "published",
    });

    if (!program) {
      return res.status(404).send("Program not found");
    }

    // 👉 pick first upcoming schedule (or fallback)
    const today = new Date();

    let schedule =
      program.schedules.find(
        (s) => new Date(s.startDate) >= today && s.isActive,
      ) ||
      program.schedules[0] ||
      null;

    res.render("user/programDetails", {
      title: program.title,
      program,
      schedule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading program details page data");
  }
});

// course page
router.get("/courses", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    const search = req.query.search || "";
    const sort = req.query.sort || "newest";

    const query = { isActive: true };

    // 🔍 SEARCH
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // 🔽 SORTING
    let sortOption = { createdAt: -1 }; // newest default

    if (sort === "priceLow") sortOption = { price: 1 };
    if (sort === "priceHigh") sortOption = { price: -1 };

    // 📊 PAGINATION
    const total = await Course.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const courses = await Course.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("user/courses", {
      title: "Courses",
      courses,
      currentPage: page,
      totalPages,
      search,
      sort,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading course page data");
  }
});

// course details page
router.get("/course/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({
      slug,
      isActive: true,
    });

    if (!course) {
      return res.status(404).send("Course not found");
    }

    res.render("user/courseDetails", {
      title: course.title,
      course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading course details page data");
  }
});

// blog page
router.get("/blogs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    const query = { status: "published" };

    const total = await Blog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("user/blogs", {
      title: "Blogs",
      blogs,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading blogs page data");
  }
});

// blog details page
router.get("/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Fetch the blog using slug
    const blog = await Blog.findOne({ slug, status: "published" });
    if (!blog) {
      return res.status(404).render("error", { message: "Blog not found" });
    }
    const allTags = await Blog.distinct("metaKeywords");

    // Fetch related blogs (excluding the current one)
    const relatedBlogs = await Blog.find({ _id: { $ne: blog._id } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Render the blog details page
    res.render("user/blogDetails", {
      user: req.user || null,
      blog,
      relatedBlogs,
      allTags,
    });
  } catch (err) {
    console.error("Error loading blog details:", err);
    res.status(500).render("error", { message: "Failed to load blog details" });
  }
});

// contact page
router.get("/contact", async (req, res) => {
  try {
    res.render("user/contact", { title: "contact us" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading contact page data");
  }
});

// account page
router.get("/account", isAuthenticated, async (req, res) => {
  try {
    // =========================
    // 1. GET USER ACCESS
    // =========================
    const accesses = await UserAccess.find({
      user: req.user._id,
    })
      .populate("course")
      .populate("plan"); // ⚠️ IMPORTANT (for source tracking)

    // =========================
    // 2. BUILD COURSE MAP (MERGE LOGIC)
    // =========================
    const courseMap = {};

    accesses.forEach((a) => {
      if (!a.course) return;

      const courseId = a.course._id.toString();

      const sourceType = a.plan ? "plan" : "direct";
      const sourceName = a.plan?.title || "Direct Purchase";

      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          _id: a.course._id,
          title: a.course.title,
          image: a.course.image,
          expiresAt: a.expiresAt || null,
          sources: [
            {
              type: sourceType,
              name: sourceName,
            },
          ],
        };
      } else {
        const existing = courseMap[courseId];

        // ✅ BEST EXPIRY LOGIC
        if (!existing.expiresAt || !a.expiresAt) {
          existing.expiresAt = null; // lifetime wins
        } else if (a.expiresAt > existing.expiresAt) {
          existing.expiresAt = a.expiresAt;
        }

        // ✅ ADD SOURCE (avoid duplicates)
        const alreadyExists = existing.sources.some(
          (s) => s.name === sourceName
        );

        if (!alreadyExists) {
          existing.sources.push({
            type: sourceType,
            name: sourceName,
          });
        }
      }
    });

    const courses = Object.values(courseMap).map((c) => ({
      ...c,
      isExpired: c.expiresAt && c.expiresAt < new Date(),
    }));

    // =========================
    // 3. PURCHASED PLANS
    // =========================
    const purchases = await Purchase.find({
      user: req.user._id,
      type: "plan",
      status: "completed",
    }).populate({
      path: "plan",
      populate: {
        path: "courses",
        model: "Course",
      },
    });

    const purchasedPlans = purchases.map((p) => {
      const plan = p.plan;

      const coursesWithAccess = plan.courses.map((course) => {
        const access = accesses.find(
          (a) =>
            a.course &&
            a.course._id.toString() === course._id.toString()
        );

        return {
          _id: course._id,
          title: course.title,
          image: course.image,
          expiresAt: access?.expiresAt || null,
          isExpired: access?.expiresAt && access.expiresAt < new Date(),
        };
      });

      const expiryDates = coursesWithAccess
        .map((c) => c.expiresAt)
        .filter(Boolean);

      const planExpiry = expiryDates.length
        ? new Date(Math.max(...expiryDates.map((d) => new Date(d))))
        : null;

      return {
        ...plan.toObject(),
        courses: coursesWithAccess,
        expiresAt: planExpiry,
        isExpired: planExpiry && planExpiry < new Date(),
      };
    });

    // =========================
    // 4. ALL AVAILABLE PLANS (FIXED)
    // =========================
    const allPlans = await Plan.find({ isActive: true }).populate("courses");

    // =========================
    // 5. RENDER
    // =========================
    res.render("user/account", {
      title: "Account",
      user: req.user,
      courses,
      purchasedPlans,
      allPlans,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading account page");
  }
});

// Services pages
router.get("/services", async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ date: -1 });

    res.render("user/services", { title: "Services", testimonials });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading services page data");
  }
});

router.get("/personal-service", async (req, res) => {
  try {
    res.render("user/personalServices", { title: "Personal Services" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading personal services page data");
  }
});

router.get("/family-service", async (req, res) => {
  try {
    res.render("user/familyServices", { title: "Family Services" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading family services page data");
  }
});

router.get("/student-service", async (req, res) => {
  try {
    res.render("user/studentServices", { title: "Student Services" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading student services page data");
  }
});

router.get("/organization-service", async (req, res) => {
  try {
    res.render("user/organizationServices", { title: "Organization Services" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading organization services page data");
  }
});

router.get("/workspace-service", async (req, res) => {
  try {
    res.render("user/workspaceService", { title: "Workspace Services" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading workspace services page data");
  }
});

router.get("/frontline-service", async (req, res) => {
  try {
    res.render("user/frontlineServices", { title: "Frontline Services" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading frontline services page data");
  }
});

// checkout page
router.get("/checkout/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;

    let item = null;

    if (type === "course") {
      item = await Course.findById(id);
    } else if (type === "plan") {
      item = await Plan.findById(id);
    }

    if (!item) {
      return res.status(404).send("Item not found");
    }

    res.render("user/checkout", {
      type,
      item,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ================= CREATE ORDER =================
router.post("/create-order", isAuthenticated, async (req, res) => {
  try {
    const { type, id } = req.body;

    if (!["course", "plan"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    let item;

    if (type === "course") {
      item = await Course.findById(id);
    } else {
      item = await Plan.findById(id);
    }

    if (!item || !item.isActive) {
      return res.status(404).json({ message: "Item not found" });
    }

    const amount = item.offerPrice || item.price;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    // ✅ Prevent duplicate purchase
    const alreadyPurchased = await Purchase.findOne({
      user: req.user._id,
      ...(type === "course" ? { course: id } : { plan: id }),
      status: "completed",
    });

    if (alreadyPurchased) {
      return res.status(400).json({ message: "Already purchased" });
    }

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        type,
        itemId: id,
        userId: req.user._id.toString(),
      },
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount,
      key: process.env.RAZORPAY_KEY,
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
});

// ================= VERIFY PAYMENT =================
router.post("/verify-payment", isAuthenticated, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // ===== SIGNATURE VERIFY =====
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // ===== FETCH ORDER FROM RAZORPAY =====
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (!order) {
      return res.status(400).json({ message: "Invalid order" });
    }

    // ===== VALIDATE USER =====
    if (order.notes.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized order" });
    }

    const type = order.notes.type;
    const id = order.notes.itemId;

    let item;

    if (type === "course") {
      item = await Course.findById(id);
    } else {
      item = await Plan.findById(id).populate("courses");
    }

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const amount = item.offerPrice || item.price;

    // ===== AMOUNT CHECK =====
    if (order.amount !== amount * 100) {
      return res.status(400).json({ message: "Amount mismatch" });
    }

    // ===== PREVENT DUPLICATE PAYMENT =====
    const existingPayment = await Purchase.findOne({
      paymentId: razorpay_payment_id,
    });

    if (existingPayment) {
      return res.json({ message: "Already processed" });
    }

    // ===== PREVENT DUPLICATE PURCHASE =====
    const alreadyPurchased = await Purchase.findOne({
      user: req.user._id,
      ...(type === "course" ? { course: id } : { plan: id }),
      status: "completed",
    });

    if (alreadyPurchased) {
      return res.json({ message: "Already purchased" });
    }

    // ===== CREATE PURCHASE =====
    const purchase = await Purchase.create(
      [
        {
          user: req.user._id,
          type,
          course: type === "course" ? id : null,
          plan: type === "plan" ? id : null,
          amount,
          status: "completed",
          paymentId: razorpay_payment_id,
        },
      ],
      { session },
    );

    // ===== GRANT ACCESS =====
    if (type === "course") {
      await grantCourseAccess(req.user._id, item, session);
    } else {
      await grantPlanAccess(req.user._id, item, session);
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      purchase: purchase[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

// ================= ACCESS HELPERS =================

// COURSE ACCESS
async function grantCourseAccess(userId, course, session) {
  let expiresAt = null;

  if (course.directAccessType === "limited") {
    const { value, unit } = course.directAccessDuration;

    const now = new Date();

    if (unit === "days") now.setDate(now.getDate() + value);
    if (unit === "weeks") now.setDate(now.getDate() + value * 7);
    if (unit === "months") now.setMonth(now.getMonth() + value);

    expiresAt = now;
  }

  const existing = await UserAccess.findOne({
    user: userId,
    course: course._id,
  }).session(session);

  if (existing) {
    // extend expiry
    if (existing.expiresAt && expiresAt) {
      existing.expiresAt = expiresAt;
      await existing.save({ session });
    }
  } else {
    await UserAccess.create(
      [
        {
          user: userId,
          course: course._id,
          expiresAt,
        },
      ],
      { session },
    );
  }
}

// PLAN ACCESS
async function grantPlanAccess(userId, plan, session) {
  const { value, unit } = plan.duration;

  let expiresAt = new Date();

  if (unit === "days") expiresAt.setDate(expiresAt.getDate() + value);
  if (unit === "weeks") expiresAt.setDate(expiresAt.getDate() + value * 7);
  if (unit === "months") expiresAt.setMonth(expiresAt.getMonth() + value);
  if (unit === "hours") expiresAt.setHours(expiresAt.getHours() + value);

  for (let course of plan.courses) {
    const existing = await UserAccess.findOne({
      user: userId,
      course: course._id,
    }).session(session);

    if (existing) {
      existing.expiresAt = expiresAt;
      await existing.save({ session });
    } else {
      await UserAccess.create(
        [
          {
            user: userId,
            course: course._id,
            plan: plan._id,
            expiresAt,
          },
        ],
        { session },
      );
    }
  }
}

// get course videos (with access check)
router.get("/course/:id/videos", isAuthenticated, async (req, res) => {
  try {
    const access = await UserAccess.findOne({
      user: req.user._id,
      course: req.params.id,
    });

    if (!access) {
      return res.status(403).json({ message: "No access" });
    }

    const isExpired = access.expiresAt && access.expiresAt < new Date();

    const course = await Course.findById(req.params.id);

    const videos = course.videos.map((v) => ({
      title: v.title,
      url: v.url,
      isPreview: v.isPreview,
      isUnlocked: !isExpired,
    }));

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ message: "Error loading videos" });
  }
});

module.exports = router;
