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
    <div className="bg-primary-blue-100 flex min-h-screen w-screen items-center justify-center overflow-hidden p-4 md:h-screen md:min-h-auto md:bg-gray-200 md:p-10">
      <div className="flex w-full max-w-110 flex-col rounded-2xl bg-white p-4 md:h-full md:max-w-250 md:flex-row md:p-3">
        <div className="md:bg-primary-blue-100 relative flex shrink-0 flex-col items-center gap-y-4 rounded-2xl pt-12 md:w-[46%] md:items-start md:gap-y-8 md:p-10 md:pt-8">
          <Logo className="w-18 md:w-auto" />
          <div></div>
          <h1 className="text-center text-xl font-bold tracking-tight text-gray-950 md:text-left md:text-3xl">
            PMG Korea의 그룹웨어에
            <br />
            처음 접속하셨네요!
            <br />
            이용을 위해 프로필을 작성해 주세요 <span className="text-[.8em]">😊</span>
          </h1>
          <Button
            variant="ghost"
            className="absolute top-0 left-0 w-fit gap-1 text-gray-700 transition-none hover:bg-transparent has-[>svg]:px-0 md:relative md:top-auto md:left-auto md:mt-4 md:self-start"
            asChild>
            <Link to="/">
              <LeftArr />
              로그인 페이지로 이동
            </Link>
          </Button>

          <div className="text-primary-blue mt-auto hidden items-center gap-x-2.5 text-xl font-bold tracking-tight md:flex">
            <Place className="size-7.5" />
            Seoul, Korea
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-y-4 py-10 md:gap-y-6 md:overflow-y-auto md:px-10 md:py-7 md:pr-7">
          <h2 className="text-primary-blue text-3xl font-bold max-md:hidden">프로필 작성하기</h2>
          <ProfileForm email={email} onboardingToken={onboardingToken} />
        </div>
      </div>
    </div>
  );
}
