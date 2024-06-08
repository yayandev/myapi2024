import { Router } from "express";
import UserRoute from "./UserRoute.js";
import SkillRoute from "./SkillRoute.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

router.use(UserRoute);
router.use(SkillRoute);

export default router;
