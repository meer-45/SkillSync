import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  createFeedbackController,
  getFeedbackForUserController,
  deleteFeedbackController,
} from "../controllers/feedback.controller.js";
import { getFeedbackForUserService } from "../services/feedback.services.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.route("/").post(verifyJWT, createFeedbackController);

router.route("/me").get(
  verifyJWT,
  asyncHandler(async (req, res) => {
    const result = await getFeedbackForUserService(req.user!._id);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Feedback fetched successfully"));
  }),
);

router.route("/:userId").get(verifyJWT, getFeedbackForUserController);
router.route("/:id").delete(verifyJWT, deleteFeedbackController);

export default router;
