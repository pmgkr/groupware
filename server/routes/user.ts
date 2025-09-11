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
        profile_image: true,
        user_level: true,
        user_status: true,
        birth_date: true,
        hire_date: true,
      }
    });

    // login 테이블엔 유저 정보가 있는데 user 테이블엔 정보가 없는 경우 (그룹웨어 초기 세팅 > 프로필 업데이트 페이지 등으로 리다이렉트)
    if (user) {
      // User 정보 조회 후 정제해서 프론트로 전송
      const fomattedUser = {
        ...user, 
        birth_date: user.birth_date ? user.birth_date.toISOString().substring(0, 10) : null,
        hire_date: user.hire_date ? user.hire_date.toISOString().substring(0, 10) : null,
      }

      return res.json({user: fomattedUser});
    }
    
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

export default router;