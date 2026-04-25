const cron = require("node-cron");
const UserAccess = require("../models/UserAccess");
const Course = require("../models/Course");

// Runs every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🔄 Running daily course unlock cron...");

    const accesses = await UserAccess.find({
      course: { $ne: null },
    });

    for (const access of accesses) {
      const course = await Course.findById(access.course);

      if (!course) continue;

      const totalVideos = course.videos.length;

      // calculate days since access started
      const startDate = access.createdAt;
      const daysPassed = Math.floor(
        (Date.now() - new Date(startDate)) / (1000 * 60 * 60 * 24)
      );

      // unlock rule: 1 video per day
      const shouldBeUnlocked = Math.min(daysPassed + 1, totalVideos);

      if (access.currentVideoIndex !== shouldBeUnlocked) {
        access.currentVideoIndex = shouldBeUnlocked;
        access.lastProcessedAt = new Date();

        await access.save();

        console.log(
          `✅ Updated user ${access.user} -> unlocked ${shouldBeUnlocked} videos`
        );
      }
    }

    console.log("✅ Cron job completed");
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});