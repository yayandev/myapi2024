import prisma from "../prisma/prisma.js";

export const onlyadmin = async (req, res, next) => {
  const userId = req.user.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (user.role !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
};
