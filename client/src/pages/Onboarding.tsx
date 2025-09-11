import { useLocation, useNavigate } from 'react-router';

import Logo from '@/assets/images/common/pmg_logo.svg?react';
import { Place } from '@/assets/images/icons';
import ProfileForm from '@components/features/Profile/ProfileForm';

export default function Onboarding() {
  const location = useLocation();
  const navigate = useNavigate();

  const { email, onboardingToken } = (location.state as { email: string; onboardingToken: string }) || {};

  // 데이터가 올바르게 전달되었는지 확인 (선택 사항)
  if (!email || !onboardingToken) {
    // 필수 데이터가 없을 경우 로그인 페이지로 리다이렉트
    navigate('/login', { replace: true });
    // 또는 에러 메시지를 표시
    return <div>로그인 정보가 유효하지 않습니다.</div>;
  }

  return (
    <div className="flex w-screen items-center justify-center bg-gray-200 p-25">
      <div className="flex w-full max-w-250 rounded-2xl bg-white p-3">
        <div className="bg-primary-blue-100 flex w-[46%] shrink-0 flex-col gap-y-8 rounded-2xl p-10">
          <Logo />
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">
            PMG Korea의 그룹웨어에
            <br />
            처음 접속하셨네요.
            <br />
            이용을 위해 프로필을 작성해 주세요 😊
          </h1>
          <div className="text-primary-blue mt-auto flex items-center gap-x-2.5 text-3xl font-bold tracking-tight">
            <Place className="size-7.5" />
            Seoul, Korea
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-y-8 px-10 py-14 pr-7">
          <h2 className="text-primary-blue text-3xl font-bold">프로필 작성하기</h2>
          <ProfileForm
            email={email}
            onboardingToken={onboardingToken}
            onSuccess={() => {
              navigate('/dashboard', { replace: true });
            }}
          />
        </div>
      </div>
    </div>
  );
}
