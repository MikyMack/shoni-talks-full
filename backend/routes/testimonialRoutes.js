const express = require('express');
const router = express.Router();
const { upload } = require('../utils/multer');
const testimonialController = require('../controllers/testimonialController');

router.post('/', upload.single('image'), testimonialController.createTestimonial);

router.get('/', testimonialController.getAllTestimonials);

router.get('/:id', testimonialController.getTestimonialById);

router.put('/:id', upload.single('image'), testimonialController.updateTestimonial);

router.delete('/:id', testimonialController.deleteTestimonial);

module.exports = router;