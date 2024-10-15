import { Router } from "express";
import UserRoute from "./UserRoute.js";
import SkillRoute from "./SkillRoute.js";
import ProjectRoute from "./ProjectRoute.js";
import ContactRoute from "./ContactRoute.js";
import SertiRoute from "./SertiRoute.js";
import sendEmailRoute from "./SendEmailRoute.js";
import PostRoute from "./PostRoute.js";
const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

router.use(UserRoute);
router.use(SkillRoute);
router.use(ProjectRoute);
router.use(ContactRoute);
router.use(SertiRoute);
router.use(sendEmailRoute);
router.use(PostRoute);
export default router;
