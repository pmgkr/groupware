// server/routes/onboarding.ts
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

// router.post("/", async (req: Request, res: Response) => {
//   try {
//     const { onboardingToken, user_name, birth_date, phone, team_id } = req.body;

//     if (!onboardingToken) {
//       return res.status(401).json({ message: "온보딩 토큰이 없습니다." });
//     }

//     // 토큰 검증
//     let payload: any;
//     try {
//       payload = jwt.verify(onboardingToken, JWT_SECRET);
//     } catch {
//       return res.status(401).json({ message: "온보딩 토큰이 유효하지 않습니다." });
//     }

//     if (payload.purpose !== "onboarding" || !payload.userId) {
//       return res.status(401).json({ message: "온보딩 토큰의 목적이 올바르지 않습니다." });
//     }

//     // 이미 프로필 있으면 막기(중복 생성 방지)
//     const exists = await prisma.user.findUnique({ where: { user_id: payload.userId } });
//     if (exists) {
//       return res.status(409).json({ message: "이미 프로필이 존재합니다." });
//     }

//     // 프로필 생성
//     const user = await prisma.user.create({
//       data: {
//         user_id: payload.userId,
//         user_name,
//         user_name_en,
//         birth_date,
//         phone,
//         team_id,
//       },
//     });

//     // 정상 로그인 상태로 전환: 액세스/리프레시 발급
//     const accessToken = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "1h" });
//     const refreshToken = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "7d" });

//     res.cookie("refresh_token", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
//       maxAge: 1000 * 60 * 60 * 24 * 7,
//     });

//     return res.json({ message: "onboarding-complete", accessToken, user });
//   } catch (e) {
//     console.error(e);
//     return res.status(500).json({ message: "서버 오류" });
//   }
// });

// export default router;
