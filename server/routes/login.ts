// server/routes/login.ts
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma"; 
import jwt, { SignOptions, Secret, JwtPayload } from "jsonwebtoken";
// import bcrypt from "bcrypt"; // 패스워드 암호화를 고려한다면 필요

const router = Router();

const JWT_SECRET: Secret = process.env.JWT_SECRET as string;
const accessOpts: SignOptions = { expiresIn: process.env.JWT_ACCESS_EXPIRES || "1h" } as Object;
const refreshOpts: SignOptions = { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" } as Object;

router.post("/", async (req: Request, res: Response) => {
  try {
    const { user_id, user_pw } = req.body;

    if (!user_id || !user_pw) {
      return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    // 로그인 검증
    const loginCred = await prisma.login.findUnique({ where : { user_id }});
    if(!loginCred || loginCred.user_pw !== user_pw) {
        return res.status(400).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.'})
    }

    // user 테이블에서 유저 프로필 조회
    const user = await prisma.user.findUnique({
        where: {user_id},
    });
    
    // 프로필 없으면 온보딩 페이지로 이동 (온보딩 토큰 발급 후 409 반환)
    if(!user) {
      const onboardingToken = jwt.sign({ userId: user_id, purpose: 'onboarding'}, JWT_SECRET, { expiresIn: '30m'});

      return res.status(409).json({ message: '사용자 정보를 찾을 수 없음. 프로필 작성 필요', code: 'PROFILE_NOT_FOUND', onboardingToken, email: user_id});
    }

    // 토큰 발급
    const accessToken = jwt.sign({ userId: user.user_id }, JWT_SECRET, accessOpts);
    const refreshToken = jwt.sign({ userId: user.user_id }, JWT_SECRET, refreshOpts);


    // 리프레시 토큰 HttpOnly 쿠키로 세팅
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false, // HTTP 환경에선 false, 'lax'로 
      sameSite: 'lax', // HTTPS 환경에선 true, 'strict'로 CSRF 보호
      maxAge: 1000 * 60 * 60 * 24 * 7 
    });

    // 프론트에 액세스 토큰과 프로필 반환
    return res.json({ message: 'success', accessToken, user });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
