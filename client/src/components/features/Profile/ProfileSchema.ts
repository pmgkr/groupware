// src/features/profile/ProfileSchema.ts
import { z } from 'zod';

export const ProfileSchema = z.object({
  user_id: z.string().email(), // 읽기 전용(숨김/disabled)
  user_pw: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/, '비밀번호는 영문과 숫자를 포함해야 합니다.'),
  user_name: z.string().trim().min(2, '이름을 입력해 주세요').max(30),
  user_name_en: z
    .string()
    .trim()
    .min(2, '영문 이름을 입력해 주세요')
    .max(50)
    .regex(/^[A-Za-z\s'-]+$/, "영문, 공백, 하이픈(-), '만 사용할 수 있어요."),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, '')) // 숫자만
    .refine((v) => v.length >= 10 && v.length <= 11, '휴대폰 번호(10~11자리)를 입력해 주세요'),
  team_id: z.number().optional(),
  job_role: z.string({ required_error: '포지션을 선택해 주세요' }),
  birth_date: z.coerce.date().optional(),
  hire_date: z.coerce.date().optional(),
  address: z.string().optional(),
  emergency_phone: z.string().trim().min(5, '비상 연락망을 입력해 주세요'),
});

export type ProfileValues = z.infer<typeof ProfileSchema>;
