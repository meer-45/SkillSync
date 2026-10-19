import mongoose, {
  Model,
  Schema,
  HydratedDocument,
} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

export type UserRole = "Learner" | "Mentor" | "Hybrid" | "Admin";

export interface UserFields {
  createdAt?: Date;
  updatedAt?: Date;
  fullName: string;
  username: string;
  email: string;
  age: number | null;
  passwordHash: string;
  role: UserRole;
  avatar: string | null;
  bio: string;
  xp: number;
  refreshTokenHash: string | null;
  skillsToTeach: string[];
  skillsToLearn: string[];
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  emailVerifyToken: string | null;
  emailVerifyExpiry: Date | null;
  isEmailVerified: boolean;
}

export interface UserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export type UserDocument = HydratedDocument<UserFields, UserMethods>;

export type UserModel = Model<UserFields, {}, UserMethods>;

const userSchema = new Schema<UserFields, UserModel, UserMethods>(
  {
    fullName: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    age: {
      type: Number,
      default: null,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Learner", "Mentor", "Hybrid", "Admin"],
      default: "Learner",
    },

    avatar: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      default: "",
    },

    xp: {
      type: Number,
      default: 0,
    },

    refreshTokenHash: {
      type: String,
      default: null,
    },

    skillsToTeach: [
      {
        type: String,
        trim: true,
      },
    ],

    skillsToLearn: [
      {
        type: String,
        trim: true,
      },
    ],

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpiry: {
      type: Date,
      default: null,
    },

    emailVerifyToken: {
      type: String,
      default: null,
    },

    emailVerifyExpiry: {
      type: Date,
      default: null,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) {
    return;
  }

  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

userSchema.methods.isPasswordCorrect = function (
  this: UserDocument,
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateAccessToken = function (
  this: UserDocument,
): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY_JWT;

  if (!secret || !expiresIn) {
    throw new Error(
      "ACCESS_TOKEN_SECRET or ACCESS_TOKEN_EXPIRY_JWT is not configured",
    );
  }

  return jwt.sign(
    {
      id: this._id.toString(),
      role: this.role,
    },
    secret,
    {
      expiresIn: expiresIn as StringValue,
    },
  );
};

userSchema.methods.generateRefreshToken = function (
  this: UserDocument,
): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY_JWT;

  if (!secret || !expiresIn) {
    throw new Error(
      "REFRESH_TOKEN_SECRET or REFRESH_TOKEN_EXPIRY_JWT is not configured",
    );
  }

  return jwt.sign(
    {
      id: this._id.toString(),
    },
    secret,
    {
      expiresIn: expiresIn as StringValue,
    },
  );
};

export const User = mongoose.model<UserFields, UserModel>(
  "User",
  userSchema,
);