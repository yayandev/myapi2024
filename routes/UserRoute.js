import { Router } from "express";
import {
  changeAvatar,
  changePassword,
  createUser,
  forgotPassword,
  getAllUsers,
  getUserById,
  login,
  logout,
  myStatistiks,
  profile,
  profilePublic,
  refreshToken,
  register,
  resetPassword,
  updateProfile,
  verifyToken,
} from "../controllers/UserController.js";
import authenticate from "../middlewares/authenticate.js";
import upload from "../utils/multer.js";
import onlyadmin from "../middlewares/onlyadmin.js";
const UserRoute = Router();

// all users
UserRoute.post("/register", register);
UserRoute.post("/login", login);
UserRoute.post("/forgot_password", forgotPassword);
UserRoute.post("/reset_password/:token", resetPassword);
// UserRoute.post("/refresh_token", refreshToken);
UserRoute.post("/verify_token", authenticate, verifyToken);
UserRoute.post("/profile", authenticate, profile);
UserRoute.post("/logout", authenticate, logout);
UserRoute.put(
  "/change_avatar",
  authenticate,
  upload.single("file"),
  changeAvatar
);
UserRoute.put("/change_password", authenticate, changePassword);
UserRoute.patch("/profile", authenticate, updateProfile);

// only admin
UserRoute.get("/users", authenticate, onlyadmin, getAllUsers);
UserRoute.get("/users/:id", authenticate, onlyadmin, getUserById);
UserRoute.post("/users", authenticate, onlyadmin, createUser);
UserRoute.get("/mystatistiks", authenticate, myStatistiks);

// public
UserRoute.get("/users/public/:id", profilePublic);
export default UserRoute;
