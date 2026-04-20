const fs = require("fs");
const path = require("path");

const deleteImageFromUploads = (imageName) => {
  if (!imageName) return;

  try {
    const filePath = path.join(__dirname, "..", "uploads", imageName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};

exports.createNotice = async (req, res) => {
  try {
    const { date, title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Notice poster is required" });
    }

    const notice = new Notice({
      date,
      title,
      description,
      posterUrl: req.file.filename,
    });

    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create notice", error: error.message });
  }
};

exports.getAllNotices = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";
    let query = {};

    if (searchTerm) {
      query = {
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
        ],
      };
    }

    const notices = await Notice.find(query).sort({ date: -1 });
    res.json(notices);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch notices", error: error.message });
  }
};

exports.getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }
    res.json(notice);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch notice", error: error.message });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const { date, title, description } = req.body;
    const noticeId = req.params.id;

    const existingNotice = await Notice.findById(noticeId);
    if (!existingNotice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const updateData = {
      date,
      title,
      description,
    };

    if (req.file) {
      deleteImageFromUploads(existingNotice.posterUrl);
      updateData.posterUrl = req.file.filename;
    }

    const updatedNotice = await Notice.findByIdAndUpdate(noticeId, updateData, {
      new: true,
    });

    res.json(updatedNotice);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update notice", error: error.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const noticeId = req.params.id;
    const notice = await Notice.findById(noticeId);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Delete associated image from Cloudinary
    deleteImageFromUploads(notice.posterUrl);

    // Delete the notice from database
    await Notice.findByIdAndDelete(noticeId);

    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to delete notice", error: error.message });
  }
};

exports.toggleNoticeActive = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    notice.isActive = !notice.isActive;
    await notice.save();

    res.json(notice);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Failed to toggle notice status",
        error: error.message,
      });
  }
};
