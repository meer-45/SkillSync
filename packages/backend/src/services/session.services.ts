import mongoose from "mongoose";
import Session, {
  SessionDocument,
  SessionStatus,
} from "../models/session.models.js";
import ApiError from "../utils/ApiError.js";
import { syncBadges } from "../controllers/badges.controller.js";
import { createNotification } from "./notification.service.js";
import Wallet from "../models/wallet.models.js";
import Transaction from "../models/transaction.models.js";
import Progress from "../models/progress.models.js";

type UserId = string | mongoose.Types.ObjectId;

type CreateSessionInput = {
  teacherId: UserId;
  learnerId: UserId;
  skillId: UserId;
  startTime: string | Date;
  endTime: string | Date;
};

export const getAllSessionsService = async (userId: UserId) => {
  return Session.find({
    $or: [{ teacherId: userId }, { learnerId: userId }],
  })
    .populate("teacherId", "fullName username email")
    .populate("learnerId", "fullName username email")
    .populate("skillId", "name category")
    .sort({ startTime: 1 });
};

export const createSessionService = async ({
  teacherId,
  learnerId,
  skillId,
  startTime,
  endTime,
}: CreateSessionInput): Promise<SessionDocument> => {
  if (teacherId.toString() === learnerId.toString()) {
    throw new ApiError(400, "Teacher and learner cannot be the same user");
  }

  const session = await Session.create({
    teacherId,
    learnerId,
    skillId,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    status: "scheduled",
  });

  await Promise.allSettled([
    createNotification({
      userId: learnerId,
      type: "session_created",
      message: "A new learning session has been scheduled for you 📅",
      link: "/sessions",
      fromUser: teacherId,
    }),
    createNotification({
      userId: teacherId,
      type: "session_created",
      message: "A new teaching session has been scheduled 📅",
      link: "/sessions",
      fromUser: learnerId,
    }),
  ]);

  return session;
};

export const getSessionByIdService = async (
  sessionId: UserId,
  userId: UserId,
) => {
  const session = await Session.findById(sessionId)
    .populate("teacherId", "fullName username email")
    .populate("learnerId", "fullName username email")
    .populate("skillId", "name category");

  if (!session) throw new ApiError(404, "Session not found");

  const isParticipant =
    session.teacherId.toString() === userId.toString() ||
    session.learnerId.toString() === userId.toString();

  if (!isParticipant) {
    throw new ApiError(403, "You are not authorized to view this session");
  }

  return session;
};

const handleSessionCompletion = async (
  session: SessionDocument,
): Promise<void> => {
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);
  const hours = Math.max(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60),
    0.5,
  );
  const tokens = Math.round(hours * 10);
  const xpEarned = Math.round(hours * 20);

  const teacherId = session.teacherId.toString();
  const learnerId = session.learnerId.toString();

  let teacherWallet = await Wallet.findOne({ userId: teacherId });
  if (!teacherWallet) {
    teacherWallet = await Wallet.create({ userId: teacherId, balance: 0 });
  }
  teacherWallet.balance += tokens;
  await teacherWallet.save();

  await Transaction.create({
    fromUser: null,
    toUser: teacherId,
    amount: tokens,
    transactionType: "earn",
  });

  const updateProgress = async (
    userId: string,
    role: "teacher" | "learner",
  ): Promise<void> => {
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = await Progress.create({
        userId,
        xp: 0,
        level: 1,
        weeklyHours: 0,
        weeklySessions: 0,
        weekStart: new Date(),
      });
    }
    progress.xp += role === "teacher" ? xpEarned : Math.round(xpEarned * 0.5);
    progress.level = Math.floor(progress.xp / 100) + 1;
    progress.weeklyHours += hours;
    progress.weeklySessions += 1;
    await progress.save();
  };

  await Promise.allSettled([
    updateProgress(teacherId, "teacher"),
    updateProgress(learnerId, "learner"),
  ]);

  await createNotification({
    userId: teacherId,
    type: "tokens_earned",
    message: `You earned ${tokens} tokens for completing a session! 🎉`,
    link: "/wallet",
    fromUser: learnerId,
  });
};

export const updateSessionService = async (
  sessionId: UserId,
  userId: UserId,
  status: SessionStatus,
): Promise<SessionDocument> => {
  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");

  if (!["scheduled", "completed", "cancelled"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Must be: scheduled, completed, or cancelled",
    );
  }

  const isParticipant =
    session.teacherId.toString() === userId.toString() ||
    session.learnerId.toString() === userId.toString();
  if (!isParticipant) {
    throw new ApiError(403, "You are not authorized to update this session");
  }

  if (session.status === "completed" && status === "completed") {
    throw new ApiError(400, "Session is already completed");
  }

  session.status = status;
  await session.save();

  if (status === "completed") {
    await Promise.allSettled([
      handleSessionCompletion(session),
      syncBadges(session.teacherId.toString()),
      syncBadges(session.learnerId.toString()),
      createNotification({
        userId: session.teacherId,
        type: "session_completed",
        message: "Session completed! Don't forget to rate your experience ⭐",
        link: "/sessions",
        fromUser: session.learnerId,
      }),
      createNotification({
        userId: session.learnerId,
        type: "session_completed",
        message: "Session completed! Don't forget to rate your experience ⭐",
        link: "/sessions",
        fromUser: session.teacherId,
      }),
    ]);
  }

  if (status === "cancelled") {
    const otherId =
      session.teacherId.toString() === userId.toString()
        ? session.learnerId
        : session.teacherId;

    await createNotification({
      userId: otherId,
      type: "session_cancelled",
      message: "A session has been cancelled 🚫",
      link: "/sessions",
      fromUser: userId,
    });
  }

  return session;
};

export const deleteSessionService = async (
  sessionId: UserId,
  userId: UserId,
): Promise<boolean> => {
  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");

  const isParticipant =
    session.teacherId.toString() === userId.toString() ||
    session.learnerId.toString() === userId.toString();
  if (!isParticipant) {
    throw new ApiError(403, "You are not authorized to cancel this session");
  }

  const otherId =
    session.teacherId.toString() === userId.toString()
      ? session.learnerId
      : session.teacherId;

  await Session.findByIdAndDelete(sessionId);
  await createNotification({
    userId: otherId,
    type: "session_cancelled",
    message: "A session has been cancelled 🚫",
    link: "/sessions",
    fromUser: userId,
  });

  return true;
};
