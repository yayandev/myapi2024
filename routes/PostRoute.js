import express from "express";
import {
  getAllPosts,
  getPostBySlug,
  createPost,
  deletePost,
  updatePost,
} from "../controllers/PostController.js";
import authenticate from "../middlewares/authenticate.js";
import upload from "../utils/multer.js";
const PostRoute = express.Router();

PostRoute.get("/posts", getAllPosts);
PostRoute.post("/posts", authenticate, upload.single("file"), createPost);
PostRoute.get("/posts/:slug", getPostBySlug);
PostRoute.delete("/posts/:id", authenticate, deletePost);
PostRoute.patch("/posts/:id", authenticate, upload.single("file"), updatePost);

export default PostRoute;
