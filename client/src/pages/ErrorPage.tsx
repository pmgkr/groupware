import { useLocation, useNavigate, Link } from 'react-router';

import { Button } from '@components/ui/button';
import errorImage from '@/assets/images/common/error_image.svg';

export default function ErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const code = location.state?.code || '404 ERROR';
  const title = location.state?.title || 'Page Not Found';
  const message = location.state?.message || '페이지를 찾을 수 없습니다.';

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-200 p-25">
      <div
        className="flex w-full max-w-210 flex-col gap-[50px] p-3"
        style={{
          backgroundImage: `url(${errorImage})`,
          backgroundSize: 'auto 100%',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
        }}>
        <div className="flex flex-col gap-2">
          <h1 className="text-primary text-8xl font-bold tracking-tight">{code}</h1>
          <p className="text-primary text-4xl font-bold">{title}</p>
          <p className="mt-2 text-2xl font-medium text-gray-700">{message}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="lg" asChild className="w-[200px]">
            <Link to="/dashboard">메인으로</Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="w-[200px]">
            <button onClick={() => navigate(-1)}>이전 페이지</button>
          </Button>
        </div>
      </div>
    </div>
  );
}
