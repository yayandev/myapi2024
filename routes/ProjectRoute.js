import { Router } from "express";
import {
  createProject,
  getAllProjects,
  getAllProjectsPublic,
  getProjectById,
  getProjectByIdPublic,
  deleteProject,
  updateProject,
} from "../controllers/ProjectController.js";
import authenticate from "../middlewares/authenticate.js";
import upload from "../utils/multer.js";

const ProjectRoute = Router();

ProjectRoute.post(
  "/projects",
  authenticate,
  upload.single("file"),
  createProject
);

ProjectRoute.get("/projects", authenticate, getAllProjects);
ProjectRoute.get("/projects/:id", authenticate, getProjectById);
ProjectRoute.delete("/projects/:id", authenticate, deleteProject);
ProjectRoute.patch(
  "/projects/:id",
  authenticate,
  upload.single("file"),
  updateProject
);

// public
ProjectRoute.get("/public/projects", getAllProjectsPublic);
ProjectRoute.get("/public/projects/:id", getProjectByIdPublic);

export default ProjectRoute;
