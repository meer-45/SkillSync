import ms from "ms";
import type { CookieOptions, Response } from "express";
import type { StringValue } from "ms";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
  const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;

  if (!accessTokenExpiry || !refreshTokenExpiry) {
    throw new Error("Token expiry configuration is missing");
  }

  const options: CookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    domain: "localhost",
  };

  res.cookie("accessToken", accessToken, {
    ...options,
    maxAge: ms(accessTokenExpiry as StringValue),
  });

  res.cookie("refreshToken", refreshToken, {
    ...options,
    maxAge: ms(refreshTokenExpiry as StringValue),
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { path: "/", domain: "localhost" });
  res.clearCookie("refreshToken", { path: "/", domain: "localhost" });
};