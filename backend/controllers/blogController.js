const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const slugify = require("../utils/slugify");
const fs = require("fs");
const path = require("path");

// Helper for deleting images from uploads folder
const deleteLocalImage = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    // If it's a full URL, extract the path after the domain
    let relativePath = imageUrl;
    const uploadsIndex = imageUrl.indexOf("/uploads/");
    if (uploadsIndex !== -1) {
      relativePath = imageUrl.substring(uploadsIndex);
    }
    // Resolve absolute path from project root
    const filePath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error("Error deleting local image:", err);
  }
};

// Helper: Retrieves the file url relative to server's /uploads, matching logoController.js logic
const getFileUrl = (file) => {
  if (!file) return null;
  return `/uploads/${file.filename}`;
};

// =============================
// CREATE BLOG
// =============================
exports.createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      status,
      publishedAt,
      metaTitle,
      metaDescription,
      metaKeywords,
      author,
      featured,
      customFields,
      ...otherFields
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const slug = slugify(title);

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({
        success: false,
        message: "A blog with this title already exists",
      });
    }

    // Handle featured image upload
    let featuredImage = null;
    if (req.files && req.files.featuredImage) {
      featuredImage = getFileUrl(req.files.featuredImage[0]);
    }

    // Handle gallery images
    let galleryImages = [];
    if (req.files && req.files.gallery) {
      galleryImages = req.files.gallery.map((file) => getFileUrl(file));
    }

    // Calculate reading time (approx 200 words per minute)
    const wordCount =
      typeof content === "string" ? content.split(/\s+/).length : 0;
    const readingTime = Math.ceil(wordCount / 200);

    // Robustly parse tags and metaKeywords
    const parseStringArray = (input) => {
      if (Array.isArray(input)) return input;
      if (typeof input === "string") {
        return input
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean);
      }
      return [];
    };

    // Robustly parse customFields (fixes error: TypeError: Cannot convert object to primitive value)
    let parsedCustomFields = {};
    if (customFields && typeof customFields === "string") {
      try {
        parsedCustomFields = JSON.parse(customFields);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format for customFields",
        });
      }
    } else if (
      customFields &&
      typeof customFields === "object" &&
      !Array.isArray(customFields)
    ) {
      parsedCustomFields = customFields;
    }

    const blogData = {
      title,
      slug,
      excerpt,
      content,
      category,
      tags: parseStringArray(tags),
      status: status || "draft",
      publishedAt: publishedAt || (status === "published" ? new Date() : null),
      metaTitle: metaTitle || title,
      metaDescription:
        metaDescription || (excerpt ? excerpt.substring(0, 160) : ""),
      metaKeywords: parseStringArray(metaKeywords),
      author: typeof author === "string" ? { name: author } : author || {},
      featured: featured === "true" || featured === true,
      featuredImage,
      galleryImages,
      readingTime,
      customFields: parsedCustomFields,
      ...otherFields,
    };

    const blog = new Blog(blogData);
    await blog.save();

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Create Blog Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating blog",
      error: error.message,
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid blog ID" });

    const blog = await Blog.findById(id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    const updateData = { ...req.body };
    const parseStringArray = (input) => {
      if (Array.isArray(input)) return input;
      if (typeof input === "string") {
        return input
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean);
      }
      return [];
    };
    if (updateData.tags) {
  updateData.tags = parseStringArray(updateData.tags);
}

if (updateData.metaKeywords) {
  updateData.metaKeywords = parseStringArray(updateData.metaKeywords);
}

    // Handle title/slug update
    if (updateData.title && updateData.title !== blog.title) {
      updateData.slug = slugify(updateData.title);

      // Check if new slug exists for another blog
      const existingSlug = await Blog.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "A blog with this title already exists",
        });
      }
    }

    // Handle featured image update
    if (req.files && req.files.featuredImage) {
      // Delete old featured image
      if (blog.featuredImage) {
        await deleteLocalImage(blog.featuredImage);
      }
      // Upload new featured image
      updateData.featuredImage = getFileUrl(req.files.featuredImage[0]);
    }

    // Handle gallery images
    if (req.files && req.files.gallery) {
      const newGalleryImages = req.files.gallery.map((file) =>
        getFileUrl(file),
      );
      updateData.galleryImages = [
        ...(blog.galleryImages || []),
        ...newGalleryImages,
      ];
    }

    // Calculate reading time if content changed
    if (updateData.content) {
      const wordCount = updateData.content.split(/\s+/).length;
      updateData.readingTime = Math.ceil(wordCount / 200);
    }

    // Parse custom fields if present
    if (updateData.customFields) {
      try {
        updateData.customFields = JSON.parse(updateData.customFields);
      } catch (e) {
        // If parsing fails, retain existing customFields
        updateData.customFields = blog.customFields || {};
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    console.error("Update Blog Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating blog",
      error: error.message,
    });
  }
};

// =============================
// GET ALL BLOGS
// =============================
exports.getAllBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      tag,
      featured,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Status filter
    if (status) query.status = status;

    // Category filter
    if (category) query.category = category;

    // Tag filter
    if (tag) query.tags = tag;

    // Featured filter
    if (featured !== undefined) query.featured = featured === "true";

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const blogs = await Blog.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-content"); // Don't send full content in list

    const total = await Blog.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blogs",
      error: error.message,
    });
  }
};

// =============================
// GET BLOG BY ID
// =============================
exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid blog ID" });
    }

    const blog = await Blog.findById(id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    // Increment views
    blog.views += 1;
    await blog.save();

    return res.status(200).json({ success: true, data: blog });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blog",
      error: error.message,
    });
  }
};

// =============================
// DELETE BLOG
// =============================
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid blog ID" });

    const blog = await Blog.findById(id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    // Delete featured image
    if (blog.featuredImage) {
      await deleteLocalImage(blog.featuredImage);
    }
    // Delete gallery images
    if (blog.galleryImages && Array.isArray(blog.galleryImages)) {
      await Promise.all(
        blog.galleryImages.map(async (imgUrl) => {
          await deleteLocalImage(imgUrl);
        }),
      );
    }

    await Blog.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting blog",
      error: error.message,
    });
  }
};

exports.deleteGalleryImage = async (req, res) => {
  try {
    const { id, imageUrl } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // Remove image from gallery array
    blog.galleryImages = blog.galleryImages.filter((img) => img !== imageUrl);
    await blog.save();

    // Delete from uploads folder
    await deleteLocalImage(imageUrl);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting image",
      error: error.message,
    });
  }
};

// =============================
// BLOG STATISTICS
// =============================
exports.getBlogStats = async (req, res) => {
  try {
    const stats = await Blog.aggregate([
      {
        $group: {
          _id: null,
          totalBlogs: { $sum: 1 },
          publishedBlogs: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: "$likes" },
          avgReadingTime: { $avg: "$readingTime" },
        },
      },
      {
        $project: {
          _id: 0,
          totalBlogs: 1,
          publishedBlogs: 1,
          draftBlogs: { $subtract: ["$totalBlogs", "$publishedBlogs"] },
          totalViews: 1,
          totalLikes: 1,
          avgReadingTime: { $round: ["$avgReadingTime", 1] },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: stats[0] || {},
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};
