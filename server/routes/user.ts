import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

const JWT_SECRET: Secret = process.env.JWT_SECRET as string;
const accessOpts: SignOptions = { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' } as Object;
const refreshOpts: SignOptions = { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' } as Object;

// DateType YYYY-MM-DD
function parseYyyyMmDdToUTC(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const [, y, mm, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mm) - 1, Number(d)));
  return isNaN(date.getTime()) ? null : date;
}

const OnboardingDto = z.object({
  user_id: z.string().email(), // 실제 값은 token에 저장된 값으로 저장
  user_name: z.string().trim().optional(),
  user_name_en: z.string().trim().optional(),
  team_id: z.number().optional(),
  phone: z.string().trim().nullable().optional(),
  job_role: z.string().trim().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  hire_date: z.string().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  emergency_phone: z.string().trim().nullable().optional(),
});

router.get('/user', async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'AUTH_HEADER_MISSING, Unauthorized' });
    }

    const token = header.substring('Bearer '.length);
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
      },
    });

    if (user) {
      // User 정보 조회 후 정제해서 프론트로 전송
      const fomattedUser = {
        ...user,
        birth_date: user.birth_date ? user.birth_date.toISOString().substring(0, 10) : null,
        hire_date: user.hire_date ? user.hire_date.toISOString().substring(0, 10) : null,
      };

      return res.json({ user: fomattedUser });
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

router.post('/onboarding', async (req: Request, res: Response) => {
  // 서버 설정 점검: JWT_SECRET 필수
  if (!process.env.JWT_SECRET) {
    console.error('Missing JWT_SECRET');
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  // Auth 헤더 체크
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized Onboarding' });
  }

  const token = header.substring('Bearer '.length);
  let decoded: { userId: string; purpose?: string };

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
  } catch (e) {
    console.error('jwt.verify error:', e);
    return res.status(401).json({ message: 'Invalid token' });
  }
  if (decoded.purpose && decoded.purpose !== 'onboarding') {
    return res.status(403).json({ message: 'Invalid token purpose' });
  }

  // 3) 바디 검증(400으로 분기)
  const parsed = OnboardingDto.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.issues });
  }
  const dto = parsed.data;

  // 4) 정규화
  const normalizedPhone = dto.phone ? dto.phone.replace(/\D/g, '') : null;
  const birthDate = parseYyyyMmDdToUTC(dto.birth_date);
  const hireDate = parseYyyyMmDdToUTC(dto.hire_date);
  const userIdFromToken = decoded.userId; // Token에 저장해뒀던 userId 값

  // upsert로 저장 (이미 row 있으면 update, 없으면 create)
  try {
    const saved = await prisma.user.upsert({
      where: { user_id: userIdFromToken },
      update: {
        user_name: dto.user_name ?? undefined,
        user_name_en: dto.user_name_en ?? undefined,
        team_id: dto.team_id ?? undefined,
        phone: normalizedPhone ?? undefined,
        job_role: dto.job_role ?? undefined,
        birth_date: birthDate ?? undefined,
        hire_date: hireDate ?? undefined,
        address: dto.address ?? undefined,
        emergency_phone: dto.emergency_phone ?? undefined,
        user_status: 'active',
      },
      create: {
        user_id: userIdFromToken,
        user_name: dto.user_name ?? '',
        user_name_en: dto.user_name_en ?? '',
        team_id: dto.team_id ?? null,
        phone: normalizedPhone,
        job_role: dto.job_role ?? null,
        birth_date: birthDate,
        hire_date: hireDate,
        address: dto.address ?? null,
        emergency_phone: dto.emergency_phone ?? null,
        user_level: 'staff',
        user_status: 'active',
      },
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
        address: true,
        emergency_phone: true,
      },
    });

    // 토큰 발급
    const accessToken = jwt.sign({ userId: userIdFromToken }, JWT_SECRET, accessOpts);
    const refreshToken = jwt.sign({ userId: userIdFromToken }, JWT_SECRET, refreshOpts);

    // 리프레시 토큰 HttpOnly 쿠키로 세팅
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false, // HTTP 환경에선 false, 'lax'로
      sameSite: 'lax', // HTTPS 환경에선 true, 'strict'로 CSRF 보호
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.json({
      message: 'saved',
      user: saved,
      accessToken,
    });
  } catch (err) {
    console.error(err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid payload', issues: err.issues });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
