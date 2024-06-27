import { Router } from "express";
import { sendEmail } from "../controllers/SendEmailController.js";
const sendEmailRoute = Router();

sendEmailRoute.post("/sendemail", sendEmail);

export default sendEmailRoute;
