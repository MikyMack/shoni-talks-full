const Program = require("../models/Program.js");

const fetchProgramsForHeader = async (req, res, next) => {
  try {
    const headerPrograms = await Program.find({
      status: "published",
      isActive: true,
    })
      .select("title slug")
      .limit(6)
      .sort({ createdAt: -1 });

    res.locals.allPrograms = headerPrograms;

    next();
  } catch (error) {
    console.error("Error fetching programs for header:", error);
    res.locals.allPrograms = [];
    next();
  }
};

module.exports = fetchProgramsForHeader;
