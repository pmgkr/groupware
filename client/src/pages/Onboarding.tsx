import { useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';

import { Button } from '@components/ui/button';
import ProfileForm from '@components/features/Profile/ProfileForm';

import Logo from '@/assets/images/common/pmg_logo.svg?react';
import { Place, LeftArr } from '@/assets/images/icons';

export default function Onboarding() {
  const location = useLocation();
  const navigate = useNavigate();

  const { email: stateEmail, onboardingToken: stateToken } = (location.state as { email: string; onboardingToken: string }) || {};

  const email = stateEmail || sessionStorage.getItem('onboarding:email');
  const onboardingToken = stateToken || sessionStorage.getItem('onboarding:token');

  const hasAlertedRef = useRef(false);

  useEffect(() => {
    if (!email || !onboardingToken) {
      if (!hasAlertedRef.current) {
        hasAlertedRef.current = true;
        alert('지정시간이 만료 되었습니다.\n프로세스를 초기화 합니다.\n다시 시도해 주세요');
        navigate('/', { replace: true });
      }
      return;
    }

    try {
      const payload = JSON.parse(atob(onboardingToken.split('.')[1]));
      const token_user_id = payload.sub;
      const token_mode = payload.mode;

      if (token_user_id !== email || token_mode !== 'onboarding') {
        if (!hasAlertedRef.current) {
          hasAlertedRef.current = true;
          alert('지정시간이 만료 되었습니다.\n프로세스를 초기화 합니다.\n다시 시도해 주세요');
          navigate('/', { replace: true });
        }
      }
    } catch (e) {
      if (!hasAlertedRef.current) {
        hasAlertedRef.current = true;
        alert('지정시간이 만료 되었습니다.\n프로세스를 초기화 합니다.\n다시 시도해 주세요');
        navigate('/', { replace: true });
      }
    }
  }, [email, onboardingToken, navigate]);

  if (!email || !onboardingToken) return null;

  return (
    <div className="flex w-screen h-screen items-center justify-center bg-gray-200 p-10 overflow-hidden">
      <div className="flex w-full h-full max-w-250 rounded-2xl bg-white p-3">
        <div className="bg-primary-blue-100 flex w-[46%] shrink-0 flex-col gap-y-8 rounded-2xl p-10">
          <Logo />
          <div></div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">
            PMG Korea의 그룹웨어에
            <br />
            처음 접속하셨네요!
            <br />
            이용을 위해 프로필을 작성해 주세요 <span className="text-[.8em]">😊</span>
          </h1>
          <Button variant="ghost" className="w-fit gap-1 text-gray-700 transition-none hover:bg-transparent has-[>svg]:px-0" asChild>
            <Link to="/">
              <LeftArr />
              로그인 페이지로 이동
            </Link>
          </Button>

          <div className="text-primary-blue mt-auto flex items-center gap-x-2.5 text-xl font-bold tracking-tight">
            <Place className="size-7.5" />
            Seoul, Korea
          </div>
        </div>
        <div className="relative flex flex-1 flex-col gap-y-6 px-10 py-7 pr-7 overflow-y-auto">
          <h2 className="text-primary-blue text-3xl font-bold">프로필 작성하기</h2>
          <ProfileForm email={email} onboardingToken={onboardingToken} />
        </div>
      </div>
    </div>
  );
}
