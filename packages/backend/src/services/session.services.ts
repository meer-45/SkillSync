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
import { User } from "../models/user.models.js";
import Skill from "../models/skill.models.js";
import Request from "../models/request.models.js";

type UserId = string | mongoose.Types.ObjectId;

type CreateSessionInput = {
  requesterId: UserId;
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
  requesterId,
  teacherId,
  learnerId,
  skillId,
  startTime,
  endTime,
}: CreateSessionInput): Promise<SessionDocument> => {
  if (teacherId.toString() === learnerId.toString()) {
    throw new ApiError(400, "Teacher and learner cannot be the same user");
  }
  if (
    requesterId.toString() !== teacherId.toString() &&
    requesterId.toString() !== learnerId.toString()
  ) {
    throw new ApiError(403, "You must be a session participant");
  }
  const [teacher, learner, skill] = await Promise.all([
    User.exists({ _id: teacherId }),
    User.exists({ _id: learnerId }),
    Skill.exists({ _id: skillId }),
  ]);
  if (!teacher || !learner || !skill) {
    throw new ApiError(400, "Invalid session participant or skill");
  }
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = end.getTime() - start.getTime();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid session time");
  }
  if (start.getTime() <= Date.now()) throw new ApiError(400, "Session must start in the future");
  if (duration < 15 * 60 * 1000 || duration > 4 * 60 * 60 * 1000) {
    throw new ApiError(400, "Session duration must be between 15 minutes and 4 hours");
  }
  const acceptedRequest = await Request.exists({
    $or: [
      { fromUserId: teacherId, toUserId: learnerId },
      { fromUserId: learnerId, toUserId: teacherId },
    ],
    skillId,
    status: "accepted",
  });
  if (!acceptedRequest) throw new ApiError(400, "An accepted request is required before scheduling");

  const session = await Session.create({
    teacherId,
    learnerId,
    skillId,
    startTime: start,
    endTime: end,
    status: "scheduled",
  });

  try {
    await Promise.all([
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
  } catch (error) {
    console.error("Session creation notifications failed:", error);
  }

  return session;
};

export const getSessionByIdService = async (
  sessionId: UserId,
  userId: UserId,
) => {
  const session = await Session.findOne({
    _id: sessionId,
    $or: [{ teacherId: userId }, { learnerId: userId }],
  })
    .populate("teacherId", "fullName username email")
    .populate("learnerId", "fullName username email")
    .populate("skillId", "name category");

  if (!session) throw new ApiError(404, "Session not found");

  return session;
};

const handleSessionCompletion = async (
  session: SessionDocument,
  dbSession: mongoose.ClientSession,
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

  await Wallet.findOneAndUpdate(
    { userId: teacherId },
    { $inc: { balance: tokens }, $setOnInsert: { userId: teacherId } },
    { upsert: true, new: true, session: dbSession },
  );
  await Transaction.create([{
    fromUser: null,
    toUser: teacherId,
    amount: tokens,
    transactionType: "earn",
  }], { session: dbSession });

  const updateProgress = async (
    userId: string,
    role: "teacher" | "learner",
  ): Promise<void> => {
    let progress = await Progress.findOne({ userId }).session(dbSession);
    if (!progress) {
      [progress] = await Progress.create([{
        userId,
        xp: 0,
        level: 1,
        weeklyHours: 0,
        weeklySessions: 0,
        weekStart: new Date(),
      }], { session: dbSession });
    }
    progress.xp += role === "teacher" ? xpEarned : Math.round(xpEarned * 0.5);
    progress.level = Math.floor(progress.xp / 100) + 1;
    progress.weeklyHours += hours;
    progress.weeklySessions += 1;
    await progress.save({ session: dbSession });
  };

  await updateProgress(teacherId, "teacher");
  await updateProgress(learnerId, "learner");
};

export const updateSessionService = async (
  sessionId: UserId,
  userId: UserId,
  status: SessionStatus,
): Promise<SessionDocument> => {
  if (!["scheduled", "completed", "cancelled"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Must be: scheduled, completed, or cancelled",
    );
  }

  const existing = await Session.findById(sessionId);
  if (!existing) throw new ApiError(404, "Session not found");
  const isParticipant =
    existing.teacherId.toString() === userId.toString() ||
    existing.learnerId.toString() === userId.toString();
  if (!isParticipant) {
    throw new ApiError(403, "You are not authorized to update this session");
  }

  if (existing.status !== "scheduled" || status === "scheduled") {
    throw new ApiError(400, "Only scheduled sessions can be completed or cancelled");
  }
  if (status === "completed" && existing.learnerId.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the learner can complete a session");
  }
  if (status === "completed" && Date.now() < existing.endTime.getTime()) {
    throw new ApiError(400, "Session can only be completed after it ends");
  }

  if (status === "completed") {
    const dbSession = await mongoose.startSession();
    let completedSession: SessionDocument;
    try {
      completedSession = await dbSession.withTransaction(async () => {
        const session = await Session.findOneAndUpdate(
          { _id: sessionId, status: "scheduled" },
          { $set: { status: "completed" } },
          { new: true, session: dbSession },
        );
        if (!session) throw new ApiError(409, "Session was already updated");
        await handleSessionCompletion(session, dbSession);
        return session;
      });
    } finally {
      await dbSession.endSession();
    }
    try {
      await Promise.all([
        syncBadges(completedSession.teacherId.toString()),
        syncBadges(completedSession.learnerId.toString()),
        createNotification({
          userId: completedSession.teacherId,
          type: "tokens_earned",
          message: `You earned tokens for completing a session! 🎉`,
          link: "/wallet",
          fromUser: completedSession.learnerId,
        }),
        createNotification({
          userId: completedSession.teacherId,
          type: "session_completed",
          message: "Session completed! Don't forget to rate your experience ⭐",
          link: "/sessions",
          fromUser: completedSession.learnerId,
        }),
        createNotification({
          userId: completedSession.learnerId,
          type: "session_completed",
          message: "Session completed! Don't forget to rate your experience ⭐",
          link: "/sessions",
          fromUser: completedSession.teacherId,
        }),
      ]);
    } catch (error) {
      console.error("Session completion side effects failed:", error);
    }
    return completedSession;
  }

  if (status === "cancelled") {
    const session = await Session.findOneAndUpdate(
      { _id: sessionId, status: "scheduled" },
      { $set: { status: "cancelled" } },
      { new: true },
    );
    if (!session) throw new ApiError(409, "Session was already updated");
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
    return session;
  }

  throw new ApiError(400, "Invalid session status");
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
