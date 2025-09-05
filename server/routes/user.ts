import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export default function createRouter(prisma: PrismaClient) {
  const router = Router();

  // 모든 사용자 목록을 가져오는 API
  // GET /api/users
  router.get('/', async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: '사용자 정보를 가져오는 데 실패했습니다.' });
    }
  });

  // 특정 사용자 정보를 가져오는 API
  // GET /api/users/:id
  router.get('/:id', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.user_id);
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: userId.toString() },
      });
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: '사용자 정보를 가져오는 데 실패했습니다.' });
    }
  });

  // 새로운 사용자를 생성하는 API
  // POST /api/users
  router.post('/', async (req: Request, res: Response) => {
    const { user_id, user_name } = req.body;
    try {
      const newUser = await prisma.user.create({
        data: {
          user_id,
          user_name,
          team_id: req.body.team_id, // Ensure this field is provided in the request body
          user_pw: req.body.user_pw, // Ensure this field is provided in the request body
          user_name_en: req.body.user_name_en, // Ensure this field is provided in the request body
        },
      });
      res.status(201).json(newUser);
    } catch (error) {
      // Prisma 오류 유형 확인
      console.error('Error creating user:', error);
    }
  });

  return router;
}
