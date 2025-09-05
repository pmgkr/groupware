import { loginApi } from '@/api';
import { useAuth } from '@/contexts/AuthContext'; // setUser 제공

import { useNavigate, Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';

// 로그인 입력값 스키마
const LoginSchema = z.object({
  user_id: z.string().email('이메일을 입력해 주세요.'),
  user_pw: z.string().min(8, '비밀번호를 입력해 주세요.'),
  remember: z.boolean().optional(),
});

export type LoginValues = z.infer<typeof LoginSchema>;

type LoginFormProps = {
  /**
   * 실제 로그인 호출을 수행하는 비동기 함수.
   * 성공 시 아무 에러도 throw 하지 않고 resolve 해주세요.
   * 실패 시 Error 를 throw 하면 폼 에러로 표시됩니다.
   */
  onLogin?: (values: LoginValues) => Promise<void>;
  defaultEmail?: string;
  enableByPass?: boolean; // 디버그용 기본 true
};

export function LoginForm({ onLogin, defaultEmail }: LoginFormProps) {
  const navigate = useNavigate();
  // const { setUser } = useAuth();

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      user_id: defaultEmail ?? '',
      user_pw: '',
      remember: false,
    },
  });

  async function handleSubmit(values: LoginValues) {
    form.clearErrors('root');

    try {
      // 1) 백엔드 호출
      if (onLogin) {
        await onLogin(values); // 외부 주입 방식이면 이걸 사용
      } else {
        const res = await loginApi({ user_id: values.user_id, user_pw: values.user_pw });
        setUser(res.user); // 컨텍스트에 users row 저장
      }

      // 2) remember 옵션 처리 (이메일 저장 등)
      // if (values.remember) {
      //   localStorage.setItem('remember_email', values.user_id);
      // } else {
      //   localStorage.removeItem('remember_email');
      // }

      // 3) 성공 이동
      navigate('/dashboard', { replace: true });
      return;
    } catch (err) {
      form.setError('root', {
        type: 'manual',
        message: err instanceof Error ? err.message : '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      form.setFocus('user_pw');
      form.setValue('user_pw', '');
    }
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
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
