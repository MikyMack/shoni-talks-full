const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.originalname
      .replace(ext, "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

module.exports = { upload };