import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/user", async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.substring("Bearer ".length);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
      select: {
        user_id: true,
        user_name: true,
        user_name_en: true,
        team_id: true,
        phone: true,
        job_role: true,
        birth_date: true,
        profile_image: true,
        user_level: true,
        user_status: true,
      },
    });

    if (!user) return res.status(404).json({ message: "사용자 없음" });
    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

export default router;