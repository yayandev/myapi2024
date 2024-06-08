import { Router } from "express";
import {
  createSkill,
  getAllSkills,
  getAllSkillsPublic,
  getSkillById,
  getSkillByIdPublic,
} from "../controllers/SkillController.js";
import authenticate from "../middlewares/authenticate.js";
import onlyadmin from "../middlewares/onlyadmin.js";
import upload from "../utils/multer.js";

const SkillRoute = Router();
SkillRoute.get("/skills", authenticate, onlyadmin, getAllSkills);
SkillRoute.get("/skills/:id", authenticate, onlyadmin, getSkillById);
SkillRoute.post("/skills", authenticate, upload.single("file"), createSkill);

// public
SkillRoute.get("/public/skills", getAllSkillsPublic);
SkillRoute.get("/public/skills/:id", getSkillByIdPublic);

export default SkillRoute;
