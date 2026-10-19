import mongoose from "mongoose";
import UserSkill, {
  UserSkillDocument,
} from "../models/userSkill.models.js";
import Skill from "../models/skill.models.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";

type UserId = string | mongoose.Types.ObjectId;
type UserSkillType = "offer" | "want";

export const addUserSkillService = async (
  userId: UserId,
  skill: string,
  type: UserSkillType,
): Promise<UserSkillDocument> => {
  const skillDoc = await Skill.findOne({ name: skill }).select("_id");
  if (!skillDoc) throw new ApiError(404, "Skill not found");

  const userSkill = await UserSkill.create({
    userId,
    skillId: skillDoc._id,
    name: skill,
    type,
    proficiency: 0,
  });

  if (!userSkill) {
    throw new ApiError(500, "Failed to add skill to user. Please try again.");
  }

  if (type === "offer") {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { skillsToTeach: skill },
    });
  } else {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { skillsToLearn: skill },
    });
  }

  return userSkill;
};

export const getCurrentUserSkillsService = async (
  userId: UserId,
) => {
  const userSkills = await UserSkill.find({ userId })
    .populate("skillId")
    .sort({ createdAt: -1 });
  if (!userSkills) throw new ApiError(404, "No skills found for the user");
  return userSkills;
};

export const updateUserProficiencyService = async (
  id: UserId,
  proficiency: number,
  userId: UserId,
) => {
  return UserSkill.findOneAndUpdate(
    { _id: id, userId },
    { proficiency },
    { new: true },
  );
};

export const deleteUserSkillService = async (
  id: UserId,
  userId: UserId,
) => {
  const userSkill = await UserSkill.findOneAndDelete({ _id: id, userId });

  if (userSkill) {
    const update =
      userSkill.type === "offer"
        ? { $pull: { skillsToTeach: userSkill.name } }
        : { $pull: { skillsToLearn: userSkill.name } };
    await User.findByIdAndUpdate(userId, update);
  }

  return userSkill;
};
