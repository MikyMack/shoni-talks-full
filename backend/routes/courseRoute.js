const express = require("express");
const router = express.Router();
const { upload } = require('../utils/multer');
const courseController = require("../controllers/courseController");


// ================= ROUTES =================

// CREATE COURSE (with image upload)
router.post("/", upload.single("image"), courseController.createCourse);

// GET ALL COURSES (with pagination + search)
router.get("/", courseController.getCourses);

// GET SINGLE COURSE
router.get("/:id", courseController.getCourse);

// UPDATE COURSE
router.put("/:id", upload.single("image"), courseController.updateCourse);

// DELETE COURSE (soft delete)
router.delete("/:id", courseController.deleteCourse);

// TOGGLE ACTIVE/INACTIVE
router.patch("/:id/toggle", courseController.toggleCourse);

module.exports = router;