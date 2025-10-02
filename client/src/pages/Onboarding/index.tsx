import Logo from '@/assets/images/common/pmg_logo.svg?react';
import { Place } from '@/assets/images/icons';

export default function Onboarding() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-200 p-25">
      <div className="flex w-full max-w-250 rounded-2xl bg-white p-3">
        <div className="bg-primary-blue-100 flex w-[46%] shrink-0 flex-col gap-y-8 rounded-2xl p-10">
          <Logo />
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">
            PMG Korea의 그룹웨어에
            <br />
            오신걸 환영합니다
          </h1>
          <div className="text-primary-blue mt-auto flex items-center gap-x-2.5 text-3xl font-bold tracking-tight">
            <Place className="size-7.5" />
            Seoul, Korea
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-y-8 px-10 py-14 pr-7">
          <h2 className="text-primary-blue text-3xl font-bold">프로필 작성하기</h2>
        </div>
      </div>
    </div>
  );
}
