const express = require("express");
const router = express.Router();
const Banner = require("../models/Banner");
const Blog = require("../models/Blog");
const Testimonial = require("../models/Testimonial");
const Program = require("../models/program");
const Course = require("../models/Course");

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
router.get("/account", async (req, res) => {
  try {
    res.render("user/account", { title: "Account" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading account page data");
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

module.exports = router;
