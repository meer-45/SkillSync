import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {
  addUserSkillService,
  deleteUserSkillService,
  getCurrentUserSkillsService,
  updateUserProficiencyService,
} from "../services/userSkill.services.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const addUserSkillController = asyncHandler(async (req, res) => {
  const { skill, type } = req.body;
  if (
    typeof skill !== "string" ||
    !skill.trim() ||
    !["offer", "want"].includes(type)
  ) {
    throw new ApiError(400, "Skill and type are required");
  }

  const userSkill = await addUserSkillService(req.user!._id, skill, type);
  if (!userSkill) {
    throw new ApiError(500, "Failed to add skill to user. Please try again.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, userSkill, "Skill added to user successfully"));
});

export const getCurrentUserSkillsController = asyncHandler(async (req, res) => {
  const userSkills = await getCurrentUserSkillsService(req.user!._id);
  return res
    .status(200)
    .json(new ApiResponse(200, userSkills, "User skills retrieved successfully"));
});

export const updateUserSkillController = asyncHandler(async (req, res) => {
  const { proficiency } = req.body;
  if (typeof proficiency !== "number" || !Number.isInteger(proficiency)) {
    throw new ApiError(400, "Proficiency must be an integer");
  }
  if (proficiency < 1 || proficiency > 5) {
    throw new ApiError(400, "Proficiency must be between 1 and 5");
  }

  const userSkill = await updateUserProficiencyService(
    String(req.params.id),
    proficiency,
    req.user!._id,
  );
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid user skill ID");
  if (!userSkill) throw new ApiError(404, "User skill not found");

  return res
    .status(200)
    .json(new ApiResponse(200, userSkill, "User skill updated successfully"));
});

export const deleteUserSkillController = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid user skill ID");
  const userSkill = await deleteUserSkillService(
    String(req.params.id),
    req.user!._id,
  );
  if (!userSkill) throw new ApiError(404, "User skill not found");

  return res
    .status(200)
    .json(new ApiResponse(200, userSkill, "User skill deleted successfully"));
});
