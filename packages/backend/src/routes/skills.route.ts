import { Router } from "express";
import {
  addSkillsAppController,
  getAllSkillsAppController,
} from "../controllers/skills.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/").get(getAllSkillsAppController);
router.route("/add-skill").post(verifyJWT, verifyAdmin, addSkillsAppController);

export default router;
