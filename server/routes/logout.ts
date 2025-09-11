// server/routes/logout.ts
import { Router, Request, Response } from "express";
const router = Router();

/**
 * POST /logout
 * - refresh_token HttpOnly 쿠키 제거
 * - 클라이언트 쪽 access token은 프론트에서 제거
 */
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: false,       // 쿠키 심을 때 secure:true였다면 동일하게
    sameSite: "lax", // 심을 때와 동일

    // 추후 HTTPS 환경일 때 적용
    // secure: true,       // 쿠키 심을 때 secure:true였다면 동일하게
    // sameSite: "strict", // 심을 때와 동일
  });
  return res.json({ message: "success" });
});

export default router;
