import { Router } from "express";
import UserRoute from "./UserRoute.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

router.use(UserRoute);

export default router;
