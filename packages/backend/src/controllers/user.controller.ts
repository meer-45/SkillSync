import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAllUsersController = asyncHandler(async (_req, res) => {
  const users = await User.find({}).select("-passwordHash -refreshTokenHash");
  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const getUserByIdController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-passwordHash -refreshTokenHash",
  );
  if (!user) throw new ApiError(404, "User not found");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

export const updateUserController = asyncHandler(async (req, res) => {
  const { fullName, bio, age } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: { fullName, bio, age } },
    { new: true },
  ).select("-passwordHash -refreshTokenHash");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

export const deleteUserController = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});
