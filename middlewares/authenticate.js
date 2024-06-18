import jwt from "jsonwebtoken";
import { tokenBlacklist } from "../utils/Token.js";

const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (token == null) return res.status(401).json({ message: "Unauthorized" });
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = user;
    next();
  });
};

export default authenticate;
