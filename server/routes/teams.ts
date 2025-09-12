// server/src/routes/teams.ts
import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const teams = await prisma.teams.findMany({
      where: { level: 2 },
      select: { team_id: true, team_name: true },
      orderBy: [{ order: 'asc' }, { team_name: 'asc' }],
    });
    res.json(teams);
  } catch (e) {
    next(e);
  }
});

export default router;
