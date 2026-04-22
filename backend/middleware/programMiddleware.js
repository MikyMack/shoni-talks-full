const Program = require("../models/Program.js");

const fetchProgramsForHeader = async (req, res, next) => {
  try {
    const headerPrograms = await Program.find({}).select("title slug");

    res.locals.allPrograms = headerPrograms;

    next();
  } catch (error) {
    console.error("Error fetching programs for header:", error);
    res.locals.allPrograms = [];
    next();
  }
};

module.exports = fetchProgramsForHeader;
