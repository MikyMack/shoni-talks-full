const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  // Basic Fields
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  
  // Content Fields
  excerpt: { type: String, trim: true },
  content: { type: String, required: true }, // Main content with HTML
  featuredImage: { type: String, trim: true },
  galleryImages: [{ type: String, trim: true }],
  
  // SEO Fields
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  metaKeywords: [{ type: String, trim: true }],
  
  // Categorization
  category: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  
  // Author Info
  author: {
    name: { type: String, trim: true },
    avatar: { type: String, trim: true },
    bio: { type: String, trim: true }
  },
  
  // Publishing
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  publishedAt: { type: Date ,default:null},
  scheduledAt: { type: Date },
  
  // Reading Experience
  readingTime: { type: Number }, // in minutes
  featured: { type: Boolean, default: false },
  
  // Custom Fields (Dynamic)
  customFields: mongoose.Schema.Types.Mixed,
  
  // Statistics
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  
  // Relations
  relatedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, publishedAt: 1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ featured: 1 });

// In Blog.js - Fix the virtual getter
BlogSchema.virtual('formattedDate').get(function() {
  const date = this.publishedAt || this.createdAt;
  if (!date) return 'Not published';
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
});

module.exports = mongoose.model('Blog', BlogSchema);