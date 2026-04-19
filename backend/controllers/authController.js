const User = require("../models/User");
const nodemailer = require("nodemailer");

// mail config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// helper: generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// =========================
// SEND OTP
// =========================
exports.sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ status: "error", message: "Email is required" });
    }

    const otp = generateOTP();

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name,
      });
    }

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 min
    user.otpVerified = false;

    await user.save();

    await transporter.sendMail({
      from: `"Shony Talks" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP is: ${otp}</h2>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ status: "error", message: "Failed to send OTP" });
  }
};


// =========================
// VERIFY OTP
// =========================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ status: "error", message: "User is blocked" });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ status: "error", message: "No OTP found" });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ status: "error", message: "OTP expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ status: "error", message: "Invalid OTP" });
    }

    // success
    user.otp = null;
    user.otpExpires = null;
    user.otpVerified = true;

    await user.save();

    // session login
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({
      status: "success",
      message: "Login successful",
      redirect: user.role === "admin" 
        ? "/admin/admin-dashboard" 
        : "/",
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ status: "error", message: "Verification failed" });
  }
};


// admin login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email === adminEmail && password === adminPassword) {
        req.session.user = { email };
        res.redirect('/admin/admin-dashboard');
    } else {
        res.render('login', { title: 'Admin Login', error: 'Invalid email or password' });
    }
};