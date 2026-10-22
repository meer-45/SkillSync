import "dotenv/config";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import { Server, Socket } from "socket.io";
import connectDB from "./db/index.js";
import app from "./app.js";
import Progress from "./models/progress.models.js";
import Message from "./models/chat.models.js";
import { User, UserDocument } from "./models/user.models.js";

type AuthenticatedSocket = Socket & { user: UserDocument };
type MessagePayload = { toUserId?: string; message?: string };
type TypingPayload = { toUserId?: string; isTyping?: boolean };

const requiredEnv = [
  "MONGO_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRY_JWT",
  "REFRESH_TOKEN_EXPIRY_JWT",
  "ACCESS_TOKEN_EXPIRY",
  "REFRESH_TOKEN_EXPIRY",
  "FRONTEND_URL",
] as const;
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET!;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      process.env.CORS_ORIGIN,
    ].filter((origin): origin is string => Boolean(origin)),
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string") return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, accessTokenSecret);
    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "string"
    ) {
      return next(new Error("Unauthorized"));
    }

    const user = await User.findById(decoded.id).select(
      "_id fullName username avatar",
    );
    if (!user) return next(new Error("Unauthorized"));

    (socket as AuthenticatedSocket).user = user;
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

const roomId = (first: string, second: string): string =>
  [first, second].sort().join("_");

io.on("connection", (socket) => {
  const authenticatedSocket = socket as AuthenticatedSocket;
  const userId = authenticatedSocket.user._id.toString();
  socket.join(userId);

  socket.on("join_room", (otherUserId: string) => {
    if (typeof otherUserId === "string" && otherUserId) {
      socket.join(roomId(userId, otherUserId));
    }
  });

  socket.on("send_message", async (payload: MessagePayload) => {
    const { toUserId, message } = payload;
    if (!toUserId || !message?.trim()) return;

    try {
      const room = roomId(userId, toUserId);
      const saved = await Message.create({
        roomId: room,
        sender: authenticatedSocket.user._id,
        message: message.trim(),
      });
      const populated = await saved.populate(
        "sender",
        "fullName username avatar",
      );
      io.to(room).emit("receive_message", populated);
      io.to(toUserId).emit("receive_message", populated);
    } catch {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", (payload: TypingPayload) => {
    if (!payload.toUserId) return;
    socket.to(roomId(userId, payload.toUserId)).emit("user_typing", {
      userId,
      isTyping: payload.isTyping,
    });
  });
});

cron.schedule("0 0 * * 1", async () => {
  try {
    const now = new Date();
    const result = await Progress.updateMany(
      {},
      { $set: { weeklyHours: 0, weeklySessions: 0, weekStart: now } },
    );
    console.log(`Weekly progress reset for ${result.modifiedCount} users`);
  } catch (error) {
    console.error("Weekly reset cron failed:", error);
  }
});

connectDB()
  .then(() => {
    const port = process.env.PORT ?? 8000;
    httpServer.listen(port, () => {
      console.log(`Server is running at port : ${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error("MONGODB connection failed !!!", error);
  });
