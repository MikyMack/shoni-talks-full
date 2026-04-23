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
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// =========================
// SEND OTP
// =========================
exports.sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
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
        <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding:20px;">
          <div style="max-width:500px; margin:auto; background:#ffffff; padding:25px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">

            <h2 style="color:#333; text-align:center;"> Verification Code</h2>

            <p style="font-size:16px; color:#555;">
              Hi ${name || "there"},
            </p>

            <p style="font-size:15px; color:#555;">
              Use the OTP below to complete your verification. This code is valid for <b>5 minutes</b>.
            </p>

            <div style="text-align:center; margin:25px 0;">
              <span style="
                display:inline-block;
                font-size:28px;
                letter-spacing:6px;
                font-weight:bold;
                background:#f0f0f0;
                padding:12px 20px;
                border-radius:8px;
                color:#111;
              ">
                ${otp}
              </span>
            </div>

            <p style="font-size:14px; color:#777;">
              If you didn’t request this, you can safely ignore this email.
            </p>

            <hr style="margin:20px 0;" />

            <p style="font-size:12px; color:#aaa; text-align:center;">
              © ${new Date().getFullYear()} Shony Talks. All rights reserved.
            </p>

          </div>
        </div>
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
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ status: "error", message: "User is blocked" });
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
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({
      status: "success",
      message: "Login successful",
      redirect: user.role === "admin" ? "/admin/admin-dashboard" : "/",
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
    res.redirect("/admin/admin-dashboard");
  } else {
    res.render("login", {
      title: "Admin Login",
      error: "Invalid email or password",
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/account");
    }

    return res.redirect("/");
  });
};