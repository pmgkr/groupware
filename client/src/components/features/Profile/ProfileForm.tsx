// src/features/profile/ProfileForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileSchema, type ProfileValues } from './ProfileSchema';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';

import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { DayPicker } from '@components/daypicker';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from '@components/ui/select';
import { format } from 'date-fns';
import { Calendar } from '@/assets/images/icons';

type ProfileFormProps = {
  email: string; // 로그인 409 응답에서 받은 email
  onboardingToken: string; // 로그인 409 응답에서 받은 onboardingToken
  className?: string;
  onSuccess?: () => void; // 성공 후 콜백 (선택)
};

export default function ProfileForm({ email, onboardingToken, className, onSuccess }: ProfileFormProps) {
  const navigate = useNavigate();
  const [dobOpen, setDobOpen] = useState(false); // 생년월일 팝오버용
  const [hireOpen, setHireOpen] = useState(false); // 입사일 팝오버용
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      user_id: email,
      user_name: '',
      user_name_en: '',
      phone: '',
      birth_date: undefined,
    },
    mode: 'onChange',
  });

  // 사용자에게 010-1234-5678 포맷으로 보여주기 (내부 전송은 숫자만)
  const formatPhone = (raw: string) => {
    const v = raw.replace(/\D/g, '');
    if (v.length <= 3) return v;
    if (v.length <= 7) return `${v.slice(0, 3)}-${v.slice(3)}`;
    return `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
  };

  // 생년월일 포맷
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  const onSubmit = async (values: ProfileValues) => {
    try {
      setSubmitting(true);

      // 서버에는 숫자만 전달 (Schema.transform으로 이미 숫자만)
      const payload = {
        ...values,
        phone: values.phone.replace(/\D/g, ''),
      };

      const res = await fetch('http://localhost:3001/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 온보딩 토큰으로 인증 (서버에서 purpose='onboarding' 검증)
          Authorization: `Bearer ${onboardingToken}`,
        },
        credentials: 'include', // 쿠키 기반 세션/리프레시 토큰 사용 시
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `프로필 저장 실패 (${res.status})`);
      }

      // 성공 처리: 토스트/리다이렉트/전역 상태 업데이트 등
      onSuccess?.();
      navigate('/'); // 원하는 초기 페이지로
    } catch (e: any) {
      alert(e.message ?? '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('max-w-xl space-y-5', className)} noValidate>
        {/* 이메일 (읽기 전용) */}
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 이름 */}
        <FormField
          control={form.control}
          name="user_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름(한글)</FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 이름 (영문) */}
        <FormField
          control={form.control}
          name="user_name_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름(영문)</FormLabel>
              <FormControl>
                <Input placeholder="Gildong Hong" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 휴대폰 & 직무 */}
        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="mb-auto">
                <FormLabel>휴대폰 번호</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    placeholder="'-' 없이 입력해 주세요"
                    value={formatPhone(field.value)}
                    onChange={(e) => field.onChange(e.target.value)}
                    maxLength={13}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job_role"
            render={({ field }) => (
              <FormItem className="mb-auto">
                <FormLabel>포지션</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                  <FormControl>
                    <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                      <SelectValue placeholder="포지션 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-80 w-full">
                    <SelectItem value="Account Executive">Account Executive</SelectItem>
                    <SelectItem value="Account Manager">Account Manager</SelectItem>
                    <SelectItem value="Senior Account Manager">Senior Account Manager</SelectItem>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Senior Designer">Senior Designer</SelectItem>
                    <SelectItem value="Creative Director">Creative Director</SelectItem>
                    <SelectItem value="Front-end Developer">Front-end Developer</SelectItem>
                    <SelectItem value="Back-end Developer">Back-end Developer</SelectItem>
                    <SelectItem value="Producer">Producer</SelectItem>
                    <SelectItem value="Copywriter">Copywriter</SelectItem>
                    <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                    <SelectItem value="GA Specialist">GA Specialist</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 생년월일 & 입사일 */}
        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>생년월일</FormLabel>
                <Popover open={dobOpen} onOpenChange={setDobOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'border-input text-accent-foreground h-11 w-full px-3 text-left text-base font-normal hover:bg-[none]',
                          !field.value && 'text-muted-foreground hover:text-muted-foreground'
                        )}>
                        {field.value ? formatDate(field.value) : <span>YYYY-MM-DD</span>}
                        <Calendar className="ml-auto size-4.5 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      captionLayout="dropdown"
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date ?? undefined);
                        if (date) setDobOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hire_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>입사일</FormLabel>
                <Popover open={hireOpen} onOpenChange={setHireOpen}>
                  <div className="relative w-full">
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'border-input text-accent-foreground h-11 w-full px-3 text-left text-base font-normal hover:bg-[none]',
                            !field.value && 'text-muted-foreground hover:text-muted-foreground'
                          )}>
                          {field.value ? formatDate(field.value) : <span>YYYY-MM-DD</span>}
                          <Calendar className="ml-auto size-4.5 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                  </div>

                  <PopoverContent className="w-auto p-0" align="start">
                    <DayPicker
                      captionLayout="dropdown"
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date ?? undefined);
                        if (date) setHireOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 주소 */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>거주지 주소</FormLabel>
              <FormControl>
                <Input placeholder="서울 강남구 테헤란로 132" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비상연락망 */}
        <FormField
          control={form.control}
          name="emergency_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                비상 연락망 <small>(이름, 관계, 연락처)</small>
              </FormLabel>
              <FormControl>
                <Input placeholder="홍희동, 아버지, 010-0000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <Button type="submit" size="full" disabled={submitting}>
            {submitting ? '저장 중...' : '프로필 저장'}
          </Button>
          {/* 필요시 돌아가기/로그아웃 버튼 */}
        </div>
      </form>
    </Form>
  );
}
