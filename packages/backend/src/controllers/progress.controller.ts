import Progress from "../models/progress.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getProgressController = asyncHandler(async (req, res) => {
  let progress = await Progress.findOne({ userId: req.user!._id });

  if (!progress) {
    progress = await Progress.findOneAndUpdate(
      { userId: req.user!._id },
      {
        $setOnInsert: {
          userId: req.user!._id,
          xp: 0,
          level: 1,
          weeklyHours: 0,
          weeklySessions: 0,
          weekStart: new Date(),
        },
      },
      { upsert: true, new: true },
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, progress, "Progress fetched successfully"));
});

export const updateProgressController = asyncHandler(async (req, res) => {
  const { xp, weeklyHours, weeklySessions } = req.body;
  const progress = await Progress.findOne({ userId: req.user!._id });
  if (!progress) throw new ApiError(404, "Progress not found");

  if (xp) progress.xp += xp;
  progress.level = Math.floor(progress.xp / 100) + 1;
  if (weeklyHours) progress.weeklyHours += weeklyHours;
  if (weeklySessions) progress.weeklySessions += weeklySessions;

  await progress.save();
  return res
    .status(200)
    .json(new ApiResponse(200, progress, "Progress updated successfully"));
});

export const resetWeeklyProgressController = asyncHandler(async (req, res) => {
  const progress = await Progress.findOne({ userId: req.user!._id });
  if (!progress) throw new ApiError(404, "Progress not found");

  progress.weeklyHours = 0;
  progress.weeklySessions = 0;
  progress.weekStart = new Date();
  await progress.save();

  return res
    .status(200)
    .json(new ApiResponse(200, progress, "Weekly progress reset successfully"));
});
