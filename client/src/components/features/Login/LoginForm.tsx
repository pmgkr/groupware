// client/src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { loginApi } from '@/api';
import { setToken as setTokenStore } from '@/lib/tokenStore';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';

// 로그인 입력값 스키마
const LoginSchema = z.object({
  user_id: z.string().email('이메일을 입력해 주세요.'),
  user_pw: z.string().nonempty({ message: '비밀번호를 입력해 주세요.' }).min(8, { message: '비밀번호는 8자 이상이어야 합니다.' }),
  remember: z.boolean().optional(),
});

export type LoginValues = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const storageRemember = 'remember_email'; // 로컬스토리지 이메일 기억하기 key 값
  const { setUserState } = useAuth();

  const remembered = localStorage.getItem(storageRemember) ?? '';

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      user_id: remembered,
      user_pw: '',
      remember: !!remembered,
    },
  });

  const rootError = form.formState.errors.root?.message;

  const onSubmit = async (values: LoginValues) => {
    form.clearErrors('root');

    try {
      // 로그인 → 토큰만 세팅 → /dashboard로 이동
      const res = await loginApi({ user_id: values.user_id, user_pw: values.user_pw });
      // 백엔드에서 202 (또는 Success 계열)로 code: "ONBOARDING"을 줄 때 처리
      if (res.code === 'ONBOARDING') {
        const token = res.onboardingToken;
        if (token) {
          // 온보딩 값 저장 키
          const ONBOARDING_EMAIL_KEY = 'onboarding:email';
          const ONBOARDING_TOKEN_KEY = 'onboarding:token';

          sessionStorage.setItem(ONBOARDING_EMAIL_KEY, values.user_id);
          sessionStorage.setItem(ONBOARDING_TOKEN_KEY, token);

          navigate('/onboarding', {
            replace: true,
            state: { email: values.user_id, onboardingToken: token },
          });
          return;
        }
      }
      setTokenStore(res.accessToken);
      setUserState(res.user ?? null);
      sessionStorage.removeItem('auth:logged_out');

      // 이메일 기억하기
      if (values.remember) localStorage.setItem(storageRemember, values.user_id);
      else localStorage.removeItem(storageRemember);

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login Failed:', err); // Debug log added

      const status = err?.status ?? err?.response?.status;
      const data = err?.data ?? err?.response?.data;

      form.setError('root', {
        type: 'manual',
        message: err instanceof Error ? err.message : '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      form.setFocus('user_pw');
      form.setValue('user_pw', '');
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <FormItem className="relative mb-2 pb-6">
                <FormLabel className="text-xl font-semibold data-[error=true]:text-gray-900">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="이메일을 입력해 주세요"
                    className="h-12"
                    onChange={(e) => {
                      form.clearErrors('root');
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage className="absolute bottom-0 left-0" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="user_pw"
            render={({ field }) => (
              <FormItem className="relative pb-6">
                <FormLabel className="text-xl font-semibold data-[error=true]:text-gray-900">Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="current-password"
                    placeholder="비밀번호를 입력해 주세요"
                    className="h-12"
                    onChange={(e) => {
                      form.clearErrors('root');
                      field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage className="absolute bottom-0 left-0" />
                {rootError && <p className="text-destructive absolute bottom-0 left-0 text-sm">{rootError}</p>}
              </FormItem>
            )}
          />

          <div className="mt-4 mb-6 flex items-center justify-between">
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex items-center gap-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="remember" />
                  </FormControl>
                  <FormLabel htmlFor="remember" className="cursor-pointer text-base font-normal text-gray-600">
                    이메일 기억하기
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link to="/forgot" className="text-primary-blue-500 text-sm font-medium hover:underline">
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <Button type="submit" size="full">
            로그인
          </Button>
        </form>
      </Form>
      <div>
        <div className="mb-8 flex items-center justify-between gap-x-2 text-xl text-gray-400 before:h-[1px] before:flex-1 before:bg-gray-400 after:h-[1px] after:flex-1 after:bg-gray-400">
          OR
        </div>
        <Button variant="outlinePrimary" size="full">
          Microsoft 로그인
        </Button>
      </div>
    </>
  );
}
