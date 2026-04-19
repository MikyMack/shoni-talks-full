const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../assets')));
app.set('view engine', 'ejs');

// Sessions
app.use(
  session({
      secret: process.env.SESSION_SECRET, 
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
  })
);
app.use('/uploads', express.static('uploads'));
// Routes
const adminRoutes = require('./routes/adminRoutes');
const programRoutes = require('./routes/programRoutes');
const blogRoutes = require('./routes/blogRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const courseRoutes = require('./routes/courseRoute');
const planRoutes = require('./routes/planRoute');
const bannerRoutes = require('./routes/bannerRoutes');
const publicRoutes = require('./routes/publicRoutes');

app.use('/admin', adminRoutes);
app.use('/admin/programs', programRoutes);
app.use('/banner', bannerRoutes);
app.use('/testimonial', testimonialRoutes);
app.use('/admin/courses', courseRoutes);
app.use('/admin/plans', planRoutes);
app.use('/admin/blogs', blogRoutes);
app.use('/', publicRoutes);


app.use(async (req, res) => {
  res.status(404).render('error', { title: 'Page Not Found' });
});

module.exports = app;
