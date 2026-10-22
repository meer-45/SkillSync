import { User } from "../models/user.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getMatchesController = asyncHandler(async (req, res) => {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ message: "User not found" });

    const myTeachValues = me.skillsToTeach || [];
    const myLearnValues = me.skillsToLearn || [];
    const myTeach = myTeachValues.map(s => s.toLowerCase().trim());
    const myLearn = myLearnValues.map(s => s.toLowerCase().trim());

    const others = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { skillsToTeach: { $in: myLearnValues } },
        { skillsToLearn: { $in: myTeachValues } },
      ],
    })
      .select("fullName avatar bio skillsToTeach skillsToLearn")
      .lean();

    const matches = others
      .map(u => {
        const theyTeach    = (u.skillsToTeach || []).map(s => s.toLowerCase().trim());
        const theyLearn    = (u.skillsToLearn || []).map(s => s.toLowerCase().trim());
        const learnMatch   = myLearn.filter(s => theyTeach.includes(s));
        const teachMatch   = myTeach.filter(s => theyLearn.includes(s));
        const commonSkills = [...new Set([...learnMatch, ...teachMatch])];
        const total        = new Set([...myLearn, ...myTeach, ...theyTeach, ...theyLearn]).size;
        const matchScore   = total > 0
          ? Math.min(100, Math.round((commonSkills.length / total) * 200))
          : 0;

        return {
          user: {
            _id:    u._id,
            name:   u.fullName,   // user.models.js uses fullName not name
            avatar: u.avatar,
            bio:    u.bio,
          },
          matchScore,
          commonSkills: commonSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
          theyTeach: u.skillsToTeach || [],
          theyLearn: u.skillsToLearn || [],
        };
      })
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 50);

    return res.status(200).json(new ApiResponse(200, matches, "Matches retrieved successfully"));
});