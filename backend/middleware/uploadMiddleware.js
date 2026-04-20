const multer = require('multer');
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const uploadDir = path.join(__dirname, '..', 'uploads');

// Create uploads folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    const baseName =
      req.body.name ||
      req.body.title ||
      req.body.categoryName ||
      'file';

    const slug = slugify(baseName, {
      lower: true,
      strict: true,
    });

    const uniqueSuffix = Date.now();

    cb(null, `${slug}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
        fileSize: 15 * 1024 * 1024
  },
});

module.exports = upload;
