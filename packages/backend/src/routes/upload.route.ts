import { Router } from "express";
import multer from "multer";
import path from "path";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { User } from "../models/user.models.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, "public/uploads/avatars/");
  },
  filename: (req, file, callback) => {
    if (!req.user) {
      callback(new ApiError(401, "Unauthorized"), "");
      return;
    }

    const extension = path.extname(file.originalname);
    callback(null, `${req.user._id.toString()}_${Date.now()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
    } else {
      callback(new ApiError(400, "Only image files allowed"));
    }
  },
});

router.post(
  "/avatar",
  verifyJWT,
  upload.single("avatar"),
  async (req, res) => {
    if (!req.file) throw new ApiError(400, "No file uploaded");

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: { avatar: avatarUrl } },
      { new: true },
    ).select("-passwordHash -refreshTokenHash");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar uploaded successfully"));
  },
);

export default router;
