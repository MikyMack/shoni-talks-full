const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const passport = require("passport");

router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

router.get('/logout', authController.logout);

//    GOOGLE LOGIN
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req, res) => {
    try {
      if (req.user.isBlocked) {
        req.session.user = null;
        return res.redirect('/');
      }

      req.session.user = req.user;

      res.redirect('/');
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('/auth/login?error=google_failed');
    }
  }
);

module.exports = router;