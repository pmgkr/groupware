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

// ============= Schedule API =============

// 스케줄 조회 (년-월 기준)
router.get('/user/schedule/:yearMonth', async (req: Request, res: Response) => {
  try {
    const { yearMonth } = req.params; // YYYY-MM 형식
    const [year, month] = yearMonth.split('-').map(Number);
    
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ message: 'Invalid year-month format' });
    }

    // 해당 월의 시작일과 종료일 계산
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const schedules = await prisma.schedule.findMany({
      where: {
        sch_sdate: {
          gte: startDate,
          lte: endDate,
        },
        sch_status: 'Y', // 활성 상태만
      },
      orderBy: {
        sch_sdate: 'asc',
      },
    });

    // 날짜/시간 형식 변환
    const formattedSchedules = schedules.map(schedule => ({
      ...schedule,
      sch_sdate: schedule.sch_sdate.toISOString().substring(0, 10),
      sch_stime: schedule.sch_stime.toISOString().substring(11, 19),
      sch_edate: schedule.sch_edate.toISOString().substring(0, 10),
      sch_etime: schedule.sch_etime.toISOString().substring(11, 19),
      sch_created_at: schedule.sch_created_at.toISOString(),
      sch_modified_at: schedule.sch_modified_at?.toISOString() || null,
    }));

    return res.json({ items: formattedSchedules });
  } catch (err) {
    console.error('Schedule fetch error:', err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// 스케줄 등록
router.post('/user/schedule/register', async (req: Request, res: Response) => {
  try {
    console.log('=== Schedule Register Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      user_id,
      team_id,
      sch_type,
      sch_vacation_type,
      sch_event_type,
      sch_sdate,
      sch_stime,
      sch_edate,
      sch_etime,
      sch_isAllday,
      sch_description,
      sch_status,
    } = req.body;

    // 필수 필드 검증
    if (!user_id || !team_id || !sch_type || !sch_sdate || !sch_stime || !sch_edate || !sch_etime || !sch_isAllday || !sch_status) {
      console.error('Missing required fields:', {
        user_id: !!user_id,
        team_id: !!team_id,
        sch_type: !!sch_type,
        sch_sdate: !!sch_sdate,
        sch_stime: !!sch_stime,
        sch_edate: !!sch_edate,
        sch_etime: !!sch_etime,
        sch_isAllday: !!sch_isAllday,
        sch_status: !!sch_status,
      });
      return res.status(400).json({ message: 'required fields missing' });
    }

    // 날짜/시간 변환 (문자열 -> DateTime)
    const parseDateTime = (dateStr: string, timeStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute, second] = timeStr.split(':').map(Number);
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
    };

    const startDateTime = parseDateTime(sch_sdate, sch_stime);
    const endDateTime = parseDateTime(sch_edate, sch_etime);
    
    console.log('Parsed dates:', {
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    });

    // user_id 존재 여부 확인
    const userExists = await prisma.user.findUnique({
      where: { user_id },
    });
    
    if (!userExists) {
      console.error('User not found:', user_id);
      return res.status(400).json({ 
        message: 'User not found',
        details: `user_id ${user_id} does not exist in users table`
      });
    }
    
    console.log('User found:', userExists.user_id);

    // sch_year 계산 (시작 날짜의 연도)
    const schYear = startDateTime.getUTCFullYear();
    
    // sch_vacation_used 계산
    let schVacationUsed: number | null = null;
    if (sch_type === 'vacation' && sch_vacation_type) {
      switch (sch_vacation_type) {
        case 'day':
          // 연차: 날짜 차이 계산 (종료일 - 시작일 + 1)
          const diffTime = Math.abs(endDateTime.getTime() - startDateTime.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          schVacationUsed = diffDays;
          break;
        case 'half':
          schVacationUsed = 0.5;
          break;
        case 'quarter':
          schVacationUsed = 0.25;
          break;
        case 'official':
          schVacationUsed = 0;
          break;
      }
    }

    // Prisma create 데이터 준비
    const createData: any = {
      user_id,
      team_id: Number(team_id),
      sch_year: schYear,
      sch_type,
      sch_sdate: new Date(Date.UTC(startDateTime.getUTCFullYear(), startDateTime.getUTCMonth(), startDateTime.getUTCDate())),
      sch_stime: startDateTime,
      sch_edate: new Date(Date.UTC(endDateTime.getUTCFullYear(), endDateTime.getUTCMonth(), endDateTime.getUTCDate())),
      sch_etime: endDateTime,
      sch_isAllday,
      sch_description: sch_description || null,
      sch_status,
    };
    
    // vacation 타입일 때만 추가
    if (sch_vacation_type) {
      createData.sch_vacation_type = sch_vacation_type;
      createData.sch_vacation_used = schVacationUsed;
    }
    
    // event 타입일 때만 추가
    if (sch_event_type) {
      createData.sch_event_type = sch_event_type;
    }
    
    console.log('Create data:', JSON.stringify(createData, null, 2));

    // Prisma create
    const newSchedule = await prisma.schedule.create({
      data: createData,
    });
    
    console.log('Schedule created successfully:', newSchedule.seq);

    // 응답 형식 변환
    const formattedSchedule = {
      ...newSchedule,
      sch_sdate: newSchedule.sch_sdate.toISOString().substring(0, 10),
      sch_stime: newSchedule.sch_stime.toISOString().substring(11, 19),
      sch_edate: newSchedule.sch_edate.toISOString().substring(0, 10),
      sch_etime: newSchedule.sch_etime.toISOString().substring(11, 19),
      sch_created_at: newSchedule.sch_created_at.toISOString(),
      sch_modified_at: newSchedule.sch_modified_at?.toISOString() || null,
    };

    return res.status(201).json(formattedSchedule);
  } catch (err: any) {
    console.error('=== Schedule Create Error ===');
    console.error('Error name:', err?.name);
    console.error('Error message:', err?.message);
    console.error('Error code:', err?.code);
    console.error('Error meta:', err?.meta);
    console.error('Full error:', err);
    console.error('Stack trace:', err?.stack);
    
    return res.status(500).json({ 
      message: 'internal error', 
      error: err?.message || String(err),
      code: err?.code,
      details: err?.meta
    });
  }
});

// 스케줄 상세 조회
router.get('/user/schedule/content/:seq', async (req: Request, res: Response) => {
  try {
    const seq = Number(req.params.seq);
    
    if (isNaN(seq)) {
      return res.status(400).json({ message: 'Invalid seq' });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { seq },
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const formattedSchedule = {
      ...schedule,
      sch_sdate: schedule.sch_sdate.toISOString().substring(0, 10),
      sch_stime: schedule.sch_stime.toISOString().substring(11, 19),
      sch_edate: schedule.sch_edate.toISOString().substring(0, 10),
      sch_etime: schedule.sch_etime.toISOString().substring(11, 19),
      sch_created_at: schedule.sch_created_at.toISOString(),
      sch_modified_at: schedule.sch_modified_at?.toISOString() || null,
    };

    return res.json(formattedSchedule);
  } catch (err) {
    console.error('Schedule fetch error:', err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// 스케줄 수정
router.patch('/user/schedule/patch/:seq', async (req: Request, res: Response) => {
  try {
    const seq = Number(req.params.seq);
    
    if (isNaN(seq)) {
      return res.status(400).json({ message: 'Invalid seq' });
    }

    const updateData: any = {};
    
    if (req.body.sch_title) updateData.sch_title = req.body.sch_title;
    if (req.body.sch_type) updateData.sch_type = req.body.sch_type;
    if (req.body.sch_vacation_type !== undefined) updateData.sch_vacation_type = req.body.sch_vacation_type;
    if (req.body.sch_event_type !== undefined) updateData.sch_event_type = req.body.sch_event_type;
    if (req.body.sch_description !== undefined) updateData.sch_description = req.body.sch_description;
    if (req.body.sch_status) updateData.sch_status = req.body.sch_status;
    if (req.body.sch_isAllday) updateData.sch_isAllday = req.body.sch_isAllday;
    if (req.body.sch_isHoliday) updateData.sch_isHoliday = req.body.sch_isHoliday;

    // 날짜/시간 업데이트
    if (req.body.sch_sdate && req.body.sch_stime) {
      const parseDateTime = (dateStr: string, timeStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, minute, second] = timeStr.split(':').map(Number);
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
      };

      const startDateTime = parseDateTime(req.body.sch_sdate, req.body.sch_stime);
      updateData.sch_sdate = new Date(Date.UTC(startDateTime.getUTCFullYear(), startDateTime.getUTCMonth(), startDateTime.getUTCDate()));
      updateData.sch_stime = startDateTime;
    }

    if (req.body.sch_edate && req.body.sch_etime) {
      const parseDateTime = (dateStr: string, timeStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, minute, second] = timeStr.split(':').map(Number);
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
      };

      const endDateTime = parseDateTime(req.body.sch_edate, req.body.sch_etime);
      updateData.sch_edate = new Date(Date.UTC(endDateTime.getUTCFullYear(), endDateTime.getUTCMonth(), endDateTime.getUTCDate()));
      updateData.sch_etime = endDateTime;
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { seq },
      data: updateData,
    });

    const formattedSchedule = {
      ...updatedSchedule,
      sch_sdate: updatedSchedule.sch_sdate.toISOString().substring(0, 10),
      sch_stime: updatedSchedule.sch_stime.toISOString().substring(11, 19),
      sch_edate: updatedSchedule.sch_edate.toISOString().substring(0, 10),
      sch_etime: updatedSchedule.sch_etime.toISOString().substring(11, 19),
      sch_created_at: updatedSchedule.sch_created_at.toISOString(),
      sch_modified_at: updatedSchedule.sch_modified_at?.toISOString() || null,
    };

    return res.json(formattedSchedule);
  } catch (err) {
    console.error('Schedule update error:', err);
    return res.status(500).json({ message: 'internal error' });
  }
});

// 스케줄 삭제
router.delete('/user/schedule/remove/:seq', async (req: Request, res: Response) => {
  try {
    const seq = Number(req.params.seq);
    
    if (isNaN(seq)) {
      return res.status(400).json({ message: 'Invalid seq' });
    }

    await prisma.schedule.delete({
      where: { seq },
    });

    return res.status(204).send();
  } catch (err) {
    console.error('Schedule delete error:', err);
    return res.status(500).json({ message: 'internal error' });
  }
});

export default router;
