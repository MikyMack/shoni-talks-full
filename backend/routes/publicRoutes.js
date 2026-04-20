const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const Blog = require('../models/Blog');
const Testimonial = require('../models/Testimonial');



// home page
router.get('/', async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // today at 00:00:00

        const [banners, blogs, testimonials] = await Promise.all([
            Banner.find({ isActive: true }).sort({ createdAt: -1 }),
            Blog.find().sort({ createdAt: -1 }),
            Testimonial.find().sort({ date: -1 })
        ]);

        res.render('user/home', {
            title: 'Home',
            banners,
            blogs,
            testimonials
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading home page data');
    }
});

// about page
router.get('/about', async (req, res) => {
    try {
        const testmonials = await Testimonial.find().sort({ date: -1 })
        res.render('user/about', { title: 'About us',testmonials});        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading about page data');
    }
});

// programs page
router.get('/programs', async (req, res) => {
    try {

        res.render('user/programs', {
            title: 'Programs',
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading program page data');
    }
});

// program details page
router.get('/program-details/:slug', async (req, res) => {
    try {
        res.render('user/programDetails', { title: 'program details'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading program details page data');
    }
});

// course page
router.get('/courses', async (req, res) => {
    try {
        res.render('user/courses', { title: 'Courses'}); 
    } catch (error) {
      console.error(error);
      res.status(500).send('Error loading couse page data');
    }
});

router.get('/course-details/:slug', async (req, res) => {
    try {
        res.render('user/courseDetails', { title: 'Course Details'});
    } catch (error) {
      console.error(error);
      res.status(500).send('Error loading course details page data');
    }
});

// blog page
router.get('/blogs', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Current page
      const limit = 6; // Items per page
  
      const total = await Blog.countDocuments();
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;
  
      const blogs = await Blog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      res.render('user/blogs', {
        title: 'Blogs',
        blogs,
        currentPage: page,
        totalPages
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).send('Error loading blogs page data');
    }
  });

// blog details page
router.get('/blog/:slug', async (req, res) => {
  try {

    const blog = await Blog.findOne({ slug: req.params.slug }).lean();

    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    res.render('user/blogDetails', {
      title: blog.metaTitle || blog.title,
      blog
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading blog details");
  }
});
  
// contact page
router.get('/contact', async (req, res) => {
    try {
        res.render('user/contact', { title: 'contact us'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading contact page data');
    }
});

// account page
router.get('/account', async (req, res) => {
    try {
        res.render('user/account', { title: 'Account'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading account page data');
    }
});

// Services pages
router.get('/services', async (req, res) => {
    try {
        res.render('user/services', { title: 'Services'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading services page data');
    }
});

router.get('/personal-services', async (req, res) => {
    try {
        res.render('user/personalServices', { title: 'Personal Services'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading personal services page data');
    }
});

router.get('/family-service', async (req, res) => {
    try {
        res.render('user/familyServices', { title: 'Family Services'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading family services page data');
    }
});

router.get('/student-service', async (req, res) => {
    try {
        res.render('user/studentServices', { title: 'Student Services'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading student services page data');
    }
});

router.get('/organization-service', async (req, res) => {
    try {
        res.render('user/organizationServices', { title: 'Organization Services'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading organization services page data');
    }
});

router.get('/workspace-service', async (req, res) => {
    try {
        res.render('user/workspaceService', { title: 'Workspace Services'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading workspace services page data');
    }
});

router.get('/frontline-service', async (req, res) => {
    try {
        res.render('user/frontlineServices', { title: 'Frontline Services'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading frontline services page data');
    }
});


module.exports = router;