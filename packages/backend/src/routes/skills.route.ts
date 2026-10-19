import { Router } from "express";
import {
  addSkillsAppController,
  getAllSkillsAppController,
} from "../controllers/skills.controller.js";

const router = Router();

router.route("/").get(getAllSkillsAppController);
router.route("/add-skill").post(addSkillsAppController);

export default router;
