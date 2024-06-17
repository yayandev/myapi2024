import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import rateLimit from "express-rate-limit";
dotenv.config();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    status: 429,
    message: "Terlalu banyak permintaan dari IP ini, harap coba lagi nanti.",
  },
  headers: true,
  statusCode: 429,
});

const app = express();

app.use(limiter);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(router);

app.listen(5000, () => console.log("Server running on port 5000"));
