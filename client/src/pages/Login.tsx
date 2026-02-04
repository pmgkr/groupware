import Logo from '@/assets/images/common/pmg_logo.svg?react';
import { Place } from '@/assets/images/icons';
import { LoginForm } from '@/components/features/Login/LoginForm';

export default function Login() {
  return (
    <div className="bg-primary-blue-100 flex min-h-screen w-screen items-center justify-center p-4 md:h-screen md:min-h-auto md:bg-gray-200 md:p-25">
      <div className="flex w-full max-w-110 flex-col rounded-2xl bg-white p-3 md:max-w-250 md:flex-row">
        <div className="md:bg-primary-blue-100 flex shrink-0 flex-col items-center gap-y-4 rounded-2xl pt-8 md:w-[46%] md:items-baseline md:gap-y-8 md:p-10">
          <Logo className="w-18 md:w-auto" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 max-md:hidden max-md:text-center">
            PMG Korea의 그룹웨어에
            <br />
            오신걸 환영합니다
          </h1>
          <div className="text-primary-blue mt-auto hidden items-center gap-x-2.5 text-3xl font-bold tracking-tight md:flex">
            <Place className="size-7.5" />
            Seoul, Korea
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-y-4 px-4 py-10 md:gap-y-8 md:px-10 md:py-14 md:pr-7">
          <h2 className="text-primary-blue text-2xl font-bold md:text-3xl">그룹웨어 지금 시작하기</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
