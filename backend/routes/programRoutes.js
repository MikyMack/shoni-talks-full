const express = require("express");
const router = express.Router();
const { upload } = require("../utils/multer");
const programController = require("../controllers/programController");

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  programController.createProgram,
);
router.get("/", programController.getPrograms);
router.get("/:id", programController.getProgram);
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  programController.updateProgram,
);
router.delete("/:id", programController.deleteProgram);

module.exports = router;