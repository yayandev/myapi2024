import { Router } from "express";
import {
  createContact,
  getContact,
  updateContact,
} from "../controllers/ContactController.js";
import authenticate from "../middlewares/authenticate.js";
const ContactRoute = Router();

ContactRoute.post("/contact", authenticate, createContact);

ContactRoute.get("/contact", getContact);

ContactRoute.patch("/contact/:id", authenticate, updateContact);

export default ContactRoute;
