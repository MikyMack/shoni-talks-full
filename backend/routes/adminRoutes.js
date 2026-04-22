const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Blog = require("../models/Blog");
const Banner = require("../models/Banner");
const Testimonial = require("../models/Testimonial");
const { isAuthenticated } = require("../middleware/auth");
const Program = require("../models/Program");
const authController = require("../controllers/authController");
const Course = require("../models/Course");
const Plan = require("../models/Plan");

// Login Page
router.get("/login", (req, res) => {
  res.render("login");
});

// Login Submit
router.post("/login", authController.login);

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

router.get("/admin-dashboard", isAuthenticated, async (req, res) => {
  try {
    const [banner, blog, testimonials, enquiries] =
      await Promise.all([
        Banner.find().sort({ createdAt: -1 }),
        Blog.find().sort({ createdAt: -1 }),    
        Testimonial.find().sort({ createdAt: -1 }),
        AdmissionEnquiry.find().sort({ createdAt: -1 }),
      ]);

    res.render("admin-dashboard", {
      title: "Admin Dashboard",
      banner,
      blog,
      testimonials,
      enquiries
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("admin-dashboard", {
      title: "Admin Dashboard",
      banner: [],
      blog: [],
      testimonials: [],
      error: "Failed to load dashboard data",
    });
  }
});

router.get("/admin-blogs", isAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (searchTerm) {
      query = {
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { metaTitle: { $regex: searchTerm, $options: "i" } },
          { author: { $regex: searchTerm, $options: "i" } },
          { content: { $regex: searchTerm, $options: "i" } },
        ],
      };
    }

    // 🔥 TOTAL COUNT
    const totalBlogs = await Blog.countDocuments(query);

    // 🔥 PAGINATED DATA
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin-blogs", {
      title: "Blog Management",
      blogs,
      searchTerm,
      currentPage: page,
      totalPages: Math.ceil(totalBlogs / limit),
      totalBlogs,
      limit,
      error: null,
    });

  } catch (error) {
    console.error("Admin Blog Load Error:", error);

    res.status(500).render("admin-blogs", {
      title: "Blog Management",
      blogs: [],
      searchTerm: "",
      currentPage: 1,
      totalPages: 1,
      totalBlogs: 0,
      limit: 10,
      error: "Failed to load blogs",
    });
  }
});


router.get("/admin-testimonials", isAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let query = {};

    if (searchTerm) {
      query = {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { designation: { $regex: searchTerm, $options: "i" } },
          { content: { $regex: searchTerm, $options: "i" } },
        ],
      };
    }

    const total = await Testimonial.countDocuments(query);

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.render("admin-testimonials", {
      title: "Testimonials Management",
      testimonials,
      searchTerm,
      currentPage: page,
      totalPages,
      limit
    });

  } catch (error) {
    console.error(error);
    res.status(500).render("admin-testimonials", {
      title: "Testimonials Management",
      testimonials: [],
      searchTerm: "",
      currentPage: 1,
      totalPages: 1,
      error: "Failed to load testimonials",
    });
  }
});

router.get("/admin-banner", isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // 🔍 Optional search
    const searchTerm = req.query.search || "";
    let query = {};

    if (searchTerm) {
      query.title = { $regex: searchTerm, $options: "i" };
    }

    const totalBanners = await Banner.countDocuments(query);

    const banners = await Banner.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin-banner", {
      title: "Banner Management",
      banners,
      currentPage: page,
      totalPages: Math.ceil(totalBanners / limit),
      totalBanners,
      limit,
      searchTerm,
      error: null,
    });

  } catch (error) {
    console.error(error);
    res.status(500).render("admin-banner", {
      error: "Failed to load banners",
      banners: [],
      currentPage: 1,
      totalPages: 1,
      totalBanners: 0,
      limit: 10,
      searchTerm: "",
    });
  }
});


router.get("/admin-programs", isAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    // 🔍 Search support
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { subtitle: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // 🔥 Count
    const totalPrograms = await Program.countDocuments(query);

    // 🔥 Fetch programs
    const programs = await Program.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalPrograms / limit);

    res.render("admin-programs", {
      title: "Program Management",
      programs,
      searchTerm,
      currentPage: page,
      totalPages,
      totalPrograms,
      limit,
      error: null,
    });

  } catch (error) {
    console.error("ADMIN PROGRAM LOAD ERROR:", error);

    res.status(500).render("admin-programs", {
      title: "Program Management",
      programs: [],
      searchTerm: "",
      currentPage: 1,
      totalPages: 1,
      totalPrograms: 0,
      limit: 10,
      error: "Failed to load programs",
    });
  }
});

router.get("/admin-courses", isAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { };

    // 🔍 SEARCH (optimized for your schema)
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { shortDescription: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // 🔢 COUNT
    const totalCourses = await Course.countDocuments(query);

    // 📦 FETCH
    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalCourses / limit);

    res.render("admin-course", {
      title: "Course Management",
      courses,
      searchTerm,
      currentPage: page,
      totalPages,
      totalCourses,
      limit,
      error: null,
    });

  } catch (error) {
    console.error("ADMIN COURSE LOAD ERROR:", error);

    res.status(500).render("admin-course", {
      title: "Course Management",
      courses: [],
      searchTerm: "",
      currentPage: 1,
      totalPages: 1,
      totalCourses: 0,
      limit: 10,
      error: "Failed to load courses",
    });
  }
});

router.get("/admin-plans", isAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.search || "";
    const courseFilter = req.query.course || "";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // 🔍 SEARCH
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } }
      ];
    }

    // 🎯 FILTER BY COURSE
    if (courseFilter) {
      query.course = courseFilter;
    }

    // 🔢 COUNT
    const totalPlans = await Plan.countDocuments(query);

    // 📦 FETCH PLANS
    const plans = await Plan.find(query)
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 📚 GET COURSES (for dropdown filter)
    const courses = await Course.find().select("title");

    const totalPages = Math.ceil(totalPlans / limit);

    res.render("admin-plans", {
      title: "Plan Management",
      plans,
      courses,
      searchTerm,
      courseFilter,
      currentPage: page,
      totalPages,
      totalPlans,
      limit,
      error: null,
    });

  } catch (error) {
    console.error("ADMIN PLAN LOAD ERROR:", error);

    res.status(500).render("admin-plans", {
      title: "Plan Management",
      plans: [],
      courses: [],
      searchTerm: "",
      courseFilter: "",
      currentPage: 1,
      totalPages: 1,
      totalPlans: 0,
      limit: 10,
      error: "Failed to load plans",
    });
  }
});

module.exports = router;
