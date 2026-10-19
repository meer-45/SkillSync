import Skill from "../models/skill.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAllSkillsAppController = asyncHandler(async (_req, res) => {
  const skills = await Skill.find({});
  if (!skills) {
    throw new ApiError(404, "No skills found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, skills, "Skills retrieved successfully"));
});

export const addSkillsAppController = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  if (!name) {
    throw new ApiError(400, "Skill name is required");
  }

  const skill = await Skill.create({ name, category });
  return res
    .status(201)
    .json(new ApiResponse(201, skill, "Skill added successfully"));
});
