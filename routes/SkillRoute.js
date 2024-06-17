import { Router } from "express";
import {
  createSkill,
  deleteSkill,
  getAllSkills,
  getAllSkillsPublic,
  getSkillByAuthorId,
  getSkillById,
  getSkillByIdPublic,
  updateSkill,
} from "../controllers/SkillController.js";
import authenticate from "../middlewares/authenticate.js";
import onlyadmin from "../middlewares/onlyadmin.js";
import upload from "../utils/multer.js";

const SkillRoute = Router();
SkillRoute.get("/skills", authenticate, onlyadmin, getAllSkills);
SkillRoute.get("/skills/:id", authenticate, onlyadmin, getSkillById);
SkillRoute.post("/skills", authenticate, upload.single("file"), createSkill);
SkillRoute.delete("/skills/:id", authenticate, deleteSkill);
SkillRoute.patch(
  "/skills/:id",
  authenticate,
  upload.single("file"),
  updateSkill
);
SkillRoute.get("/myskills", authenticate, getSkillByAuthorId);

// public
SkillRoute.get("/public/skills", getAllSkillsPublic);
SkillRoute.get("/public/skills/:id", getSkillByIdPublic);

export default SkillRoute;
