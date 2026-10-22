import {
  User,
  UserDocument,
  UserFields,
} from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/email.js";

/**
 * Generate Access + Refresh Tokens
 */

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateAccessAndRefreshTokens = async (
  userId: string,
): Promise<TokenResponse> => {
  const user = await User.findById(userId).select("+refreshTokenHash");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken: string = user.generateAccessToken();
  const refreshToken: string = user.generateRefreshToken();

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

type RegisterUserInput = {
  username: string;
  fullName: string;
  email: string;
  age?: number | null;
  role?: UserFields["role"];
  password: string;
};

/**
 * Register New User
 */
export const registerUser = async (
  userData: RegisterUserInput,
): Promise<UserDocument> => {
  const { password, ...userDetails } = userData;

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const allowedRoles: Array<Exclude<UserFields["role"], "Admin">> = [
    "Learner",
    "Mentor",
    "Hybrid",
  ];
  const role = allowedRoles.includes(userDetails.role as Exclude<UserFields["role"], "Admin">)
    ? userDetails.role
    : "Learner";
  const user = await User.create({
    ...userDetails,
    role,
    passwordHash: password,
  });
  return user;
};


/**
 * Login User
 * NOTE: returns null on failure (controller handles error)
 */
export const loginUser = async (
  identifier: string,
  password: string,
): Promise<UserDocument | null> => {
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
    ],
  }).select("+passwordHash");

  if (!user) return null;

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) return null;

  return user;
};


/**
 * Logout User
 * Clears the refreshTokenHash from DB so the refresh token is invalidated
 */
export const logoutUser = async (userId: string): Promise<boolean> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { refreshTokenHash: null } },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return true;
};

/**
 * Forgot Password — generate token and send email
 */
export const forgotPasswordService = async (email: string): Promise<boolean> => {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Do not disclose whether an email address is registered.
  if (!user) return true;

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  user.passwordResetToken = hashToken(token);
  user.passwordResetExpiry = expiry;
  await user.save({ validateBeforeSave: false });
  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (error) {
    console.error("Password reset email delivery failed:", error);
  }
  return true;
};
/**
 * Reset Password — verify token and update password
 */
export const resetPasswordService = async (
  token: string,
  newPassword: string,
): Promise<boolean> => {
  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpiry: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpiry");
  if (!user) throw new ApiError(400, "Reset link is invalid or has expired");

  user.passwordHash = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpiry = null;
  await user.save();
  return true;
};

/**
 * Send Verification Email
 */
export const sendVerificationEmailService = async (
  userId: string,
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.isEmailVerified) throw new ApiError(400, "Email already verified");

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerifyToken = hashToken(token);
  user.emailVerifyExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user.email, token);
  return true;
};

/**
 * Verify Email Token
 */
export const verifyEmailService = async (token: string): Promise<boolean> => {
  const user = await User.findOne({
    emailVerifyToken: hashToken(token),
    emailVerifyExpiry: { $gt: new Date() },
  }).select("+emailVerifyToken +emailVerifyExpiry");
  if (!user)
    throw new ApiError(400, "Verification link is invalid or has expired");

  user.isEmailVerified = true;
  user.emailVerifyToken = null;
  user.emailVerifyExpiry = null;
  await user.save({ validateBeforeSave: false });
  return true;
};
