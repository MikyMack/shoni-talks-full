require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const passport = require('passport');
// require('./config/passport'); 
const programMiddleware = require('./middleware/programMiddleware');
require("./utils/courseUnlockCron");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../assets")));
app.set("view engine", "ejs");
app.use(programMiddleware);

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 60 * 60 * 24 * 7 
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, 
    httpOnly: true,
    secure: false, 
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());


app.use("/uploads", express.static("uploads"));

app.use((req, res, next) => {
  const user = req.session.user || null;

  res.locals.user = user; // for EJS
  req.user = user;        // for backend routes

  next();
});


// Routes
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const programRoutes = require("./routes/programRoutes");
const blogRoutes = require("./routes/blogRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const courseRoutes = require("./routes/courseRoute");
const planRoutes = require("./routes/planRoute");
const bannerRoutes = require("./routes/bannerRoutes");
const publicRoutes = require("./routes/publicRoutes");

app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/admin/programs", programRoutes);
app.use("/banner", bannerRoutes);
app.use("/testimonial", testimonialRoutes);
app.use("/admin/courses", courseRoutes);
app.use("/admin/plans", planRoutes);
app.use("/admin/blogs", blogRoutes);
app.use("/", publicRoutes);


app.use(async (req, res) => {
  res.status(404).render("error", { title: "Page Not Found" });
});

module.exports = app;
