import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export type SessionStatus = "scheduled" | "completed" | "cancelled";

export interface SessionFields {
  teacherId: mongoose.Types.ObjectId;
  learnerId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  meetLink: string | null;
  status: SessionStatus;
}

export type SessionDocument = HydratedDocument<SessionFields>;
export type SessionModel = Model<SessionFields>;

const sessionSchema = new Schema<SessionFields>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    learnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    meetLink: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
  },
  { timestamps: true },
);

sessionSchema.pre("save", function (this: SessionDocument) {
  if (this.endTime <= this.startTime) {
    throw new Error("endTime must be after startTime");
  }
});

const Session = mongoose.model<SessionFields, SessionModel>(
  "Session",
  sessionSchema,
);

export default Session;
