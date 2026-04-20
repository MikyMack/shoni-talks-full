const express = require('express');
const router = express.Router();
const { upload } = require('../utils/multer');
const blogController = require('../controllers/blogController');
const Blog = require('../models/Blog');



router.get('/', async (req, res) => {
  try {
      const {
          page = 1,
          limit = 12,
          status,
          category,
          tag,
          featured,
          search,
          sortBy = 'createdAt',
          sortOrder = 'desc'
      } = req.query;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (category) query.category = category;
      if (tag) query.tags = tag;
      if (featured !== undefined) query.featured = featured === 'true';
      if (search) {
          query.$or = [
              { title: { $regex: search, $options: 'i' } },
              { excerpt: { $regex: search, $options: 'i' } },
              { content: { $regex: search, $options: 'i' } }
          ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Fetch data
      const blogs = await Blog.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content');

      const total = await Blog.countDocuments(query);

      // Return JSON response
      res.json({
          success: true,
          data: blogs,
          pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / limit)
          }
      });
      
  } catch (error) {
      console.error('Error in /admin/blogs:', error);
      res.status(500).json({
          success: false,
          message: "Error retrieving blogs",
          error: error.message
      });
  }
});

// Admin routes (protected)
router.post("/", upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), blogController.createBlog);

router.put("/:id", upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), blogController.updateBlog);

router.get("/:id", blogController.getBlogById);
router.delete("/:id", blogController.deleteBlog);
router.delete("/:id/gallery/:imageUrl", blogController.deleteGalleryImage);

// Statistics
router.get("/blog-stats", blogController.getBlogStats);

// In your routes
router.get('/blog-categories', async (req, res) => {
    try {
        const categories = await Blog.distinct('category').where('category').ne(null).ne('');
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bulk update status
router.put('/blogs/bulk-status', async (req, res) => {
    try {
        const { ids, status } = req.body;
        await Blog.updateMany(
            { _id: { $in: ids } },
            { $set: { status, updatedAt: new Date() } }
        );
        res.json({ success: true, message: 'Blogs updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;