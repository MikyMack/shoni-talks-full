const express = require("express");
const router = express.Router();
const { upload } = require("../utils/multer");
const programController = require("../controllers/programController");

router.post("/", upload.single("image"), programController.createProgram);
router.get("/", programController.getPrograms);
router.get("/:id", programController.getProgram);
router.put("/:id", upload.single("image"), programController.updateProgram);
router.delete("/:id", programController.deleteProgram);

module.exports = router;