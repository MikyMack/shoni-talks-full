const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { upload } = require('../utils/multer');

router.post('/',upload.single('banner'), bannerController.createBanner);
router.get('/', bannerController.getAllBanners);
router.get('/:id', bannerController.getBannerById);
router.put('/:id',upload.single('banner'), bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);
router.patch('/toggle/:id', bannerController.toggleBannerActive);

module.exports = router;
