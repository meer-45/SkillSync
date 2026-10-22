import { UserBadge } from "../models/userBadge.models.js";
import Session from "../models/session.models.js";
import Wallet from "../models/wallet.models.js";
import { User } from "../models/user.models.js";
import Feedback from "../models/feedback.models.js";
import Request from "../models/request.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const BADGE_DEFS = [
  { id: "first_session", threshold: 1, category: "sessions" },
  { id: "five_sessions", threshold: 5, category: "sessions" },
  { id: "ten_sessions", threshold: 10, category: "sessions" },
  { id: "first_teach", threshold: 1, category: "teaching" },
  { id: "five_teach", threshold: 5, category: "teaching" },
  { id: "skill_diverse", threshold: 3, category: "skills" },
  { id: "wallet_100", threshold: 100, category: "wallet" },
  { id: "top_rated", threshold: 5, category: "rating" },
  { id: "early_adopter", threshold: 1, category: "special" },
  { id: "profile_complete", threshold: 1, category: "profile" },
  { id: "request_sent_5", threshold: 5, category: "requests" },
] as const;

export async function syncBadges(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const [
    totalSessions,
    teachSessions,
    distinctSkills,
    wallet,
    user,
    feedbacks,
    requestsSent,
  ] = await Promise.all([
    Session.countDocuments({ learnerId: userId, status: "completed" }),
    Session.countDocuments({ teacherId: userId, status: "completed" }),
    Session.distinct("skillId", {
      $or: [{ learnerId: userId }, { teacherId: userId }],
      status: "completed",
    }),
    Wallet.findOne({ userId }),
    User.findById(userId),
    Feedback.find({ toUser: userId }, "rating"),
    Request.countDocuments({ fromUserId: userId }),
  ]);

  const averageRating = feedbacks.length
    ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) /
      feedbacks.length
    : 0;
  const profileComplete =
    user?.fullName && user.bio && user.skillsToTeach?.length ? 1 : 0;
  const launchDate = new Date("2024-11-01");
  const earlyAdopter =
    user?.createdAt &&
    new Date(user.createdAt).getTime() - launchDate.getTime() >= 0 &&
    new Date(user.createdAt).getTime() - launchDate.getTime() < 30 * 86400000
      ? 1
      : 0;

  const progressMap: Record<string, number> = {
    first_session: totalSessions,
    five_sessions: totalSessions,
    ten_sessions: totalSessions,
    first_teach: teachSessions,
    five_teach: teachSessions,
    skill_diverse: distinctSkills.length,
    wallet_100: wallet?.balance ?? 0,
    top_rated: averageRating,
    early_adopter: earlyAdopter,
    profile_complete: profileComplete,
    request_sent_5: requestsSent,
  };

  await UserBadge.bulkWrite(
    BADGE_DEFS.map((definition) => {
      const progress = progressMap[definition.id] ?? 0;
      const earned = progress >= definition.threshold;
      return {
        updateOne: {
          filter: { user: userObjectId, badgeId: definition.id },
          update: [
            {
              $set: {
                user: userObjectId,
                badgeId: definition.id,
                progress,
                earned,
                earnedAt: earned
                  ? {
                      $cond: [
                        { $eq: [{ $ifNull: ["$earned", false] }, false] },
                        new Date(),
                        "$earnedAt",
                      ],
                    }
                  : "$earnedAt",
              },
            },
          ],
          upsert: true,
        },
      };
    }),
  );
}

export const getMyBadgesController = asyncHandler(async (req, res) => {
  await syncBadges(req.user!._id.toString());
  const badges = await UserBadge.find({ user: req.user!._id });
  return res.json({ badges });
});

export const getUserBadgesController = asyncHandler(async (req, res) => {
  const badges = await UserBadge.find({ user: req.params.id, earned: true });
  return res.json({ badges });
});

export const syncBadgesController = asyncHandler(async (req, res) => {
  await syncBadges(req.user!._id.toString());
  return res.json({ message: "Badges synced" });
});
