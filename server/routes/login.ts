// server/routes/login.ts
import { Router, Request, Response } from "express";
import prisma from "../lib/prisma"; 
// import bcrypt from "bcrypt"; // 패스워드 암호화를 고려한다면 필요
// import jwt from "jsonwebtoken"; // JWT 인증을 고려한다면 필요

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { user_id, user_pw } = req.body;

    if (!user_id || !user_pw) {
      return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    const login = await prisma.login.findUnique({ where : { user_id }});
    if(!login || login.user_pw !== user_pw) {
        return res.status(400).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.'})
    }

    const user = await prisma.user.findUnique({
        where: {user_id},
    });

    if(!user) {
        return res.status(400).json({ message: '사용자 정보를 찾을 수 없음. 프로필 작성 필요'})
    }

    return res.json({
        message: 'success',
        user, // 이 user 정보를 context에 저장해야함
    })

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
