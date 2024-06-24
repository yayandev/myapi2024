import {
  createSerti,
  deleteSerti,
  getAllSerti,
} from "../controllers/SertiController.js";
import { Router } from "express";
import authenticate from "../middlewares/authenticate.js";
import upload from "../utils/multer.js";

const SertiRoute = Router();

SertiRoute.get("/sertis", getAllSerti);
SertiRoute.post("/sertis", upload.single("file"), authenticate, createSerti);
SertiRoute.delete("/sertis/:id", authenticate, deleteSerti);

export default SertiRoute;
