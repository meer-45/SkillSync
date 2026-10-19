import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Profile } from "passport-google-oauth20";

import {
  registerUser,
  loginUser,
  generateAccessAndRefreshTokens,
  logoutUser,
  forgotPasswordService,
  resetPasswordService,
  sendVerificationEmailService,
  verifyEmailService,
} from "../services/auth.services.js";

import { setAuthCookies, clearAuthCookies } from "../utils/cookie.js";
import { User } from "../models/user.models.js";

import type { Request, Response } from "express";

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { fullName, username, email, password, age, role } = req.body;
    if (
      [fullName, username, email, password].some(
        (field) => typeof field !== "string" || !field.trim(),
      )
    )
      throw new ApiError(400, "All required fields must be filled");

    const user = await registerUser({
      fullName,
      username,
      email,
      password,
      age,
      role,
    });
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id.toString(),
    );
    setAuthCookies(res, accessToken, refreshToken);
    const safeUser = await User.findById(user._id).select(
      "-passwordHash -refreshTokenHash",
    );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: safeUser, accessToken },
          "User registered successfully",
        ),
      );
  },
);

export const loginUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    if (
      [identifier, password].some(
        (field) => typeof field !== "string" || !field.trim(),
      )
    )
      throw new ApiError(400, "All required fields must be filled");

    const user = await loginUser(identifier, password);
    if (!user) throw new ApiError(401, "Invalid credentials");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id.toString(),
    );
    setAuthCookies(res, accessToken, refreshToken);
    const safeUser = await User.findById(user._id).select(
      "-passwordHash -refreshTokenHash",
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: safeUser, accessToken },
          "Login successful",
        ),
      );
  },
);

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User fetched successfully"));
  },
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken)
      throw new ApiError(401, "Unauthorized: No refresh token");
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    );

    if (
      typeof decodedToken === "string" ||
      typeof decodedToken.id !== "string"
    ) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decodedToken.id);
    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (!user.refreshTokenHash) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const isRefreshTokenValid = await bcrypt.compare(
      incomingRefreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenValid)
      throw new ApiError(401, "Refresh token is expired or used");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id.toString(),
    );
    setAuthCookies(res, accessToken, refreshToken);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { accessToken }, "Token refreshed successfully"),
      );
  },
);

export const changePasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) throw new ApiError(400, "Wrong old password");
    user.passwordHash = newPassword;
    await user.save();
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  },
);

export const logoutUserController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    await logoutUser(req.user._id.toString());
    clearAuthCookies(res);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully"));
  },
);

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) throw new ApiError(400, "Email is required");
  await forgotPasswordService(email.trim());
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset email sent"));
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    throw new ApiError(400, "Token and new password are required");
  if (newPassword.length < 6)
    throw new ApiError(400, "Password must be at least 6 characters");
  await resetPasswordService(token, newPassword);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

export const sendVerificationEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    await sendVerificationEmailService(req.user._id.toString());
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Verification email sent"));
  },
);

export const verifyEmailController = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) throw new ApiError(400, "Token is required");
  await verifyEmailService(token.toString());
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Email verified successfully"));
});

// ─── Google OAuth ────────────────────────────────────────────────────────────

export const googleCallbackController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(400, "Invalid Google OAuth callback");
    }

    const profile = req.user as unknown as Profile;
    const { id, displayName, emails } = profile;
    if (!id || !displayName || !emails) {
      throw new ApiError(400, "Invalid Google OAuth callback");
    }

    const email = emails?.[0]?.value;
    if (!email) throw new ApiError(400, "No email from Google");

    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register
      user = await User.create({
        fullName: displayName,
        username:
          email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") +
          "_" +
          Date.now().toString().slice(-4),
        email,
        passwordHash: Math.random().toString(36) + Date.now(),
        isEmailVerified: true,
        role: "Learner",
      });
    }

    const { accessToken } = await generateAccessAndRefreshTokens(
      user._id.toString(),
    );
    const safeUser = await User.findById(user._id).select(
      "-passwordHash -refreshTokenHash",
    );

    // Redirect to frontend with token in URL — frontend picks it up
    const frontendURL = process.env.CORS_ORIGIN || "http://localhost:5173";
    res.redirect(
      `${frontendURL}/oauth/callback?token=${accessToken}&user=${encodeURIComponent(JSON.stringify(safeUser))}`,
    );
  },
);
