import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export interface ProgressFields {
  userId: mongoose.Types.ObjectId;
  xp: number;
  level: number;
  weeklyHours: number;
  weeklySessions: number;
  weekStart: Date;
}

export type ProgressDocument = HydratedDocument<ProgressFields>;
export type ProgressModel = Model<ProgressFields>;

const progressSchema = new Schema<ProgressFields>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    weeklyHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklySessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    weekStart: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const Progress = mongoose.model<ProgressFields, ProgressModel>(
  "Progress",
  progressSchema,
);

export default Progress;
