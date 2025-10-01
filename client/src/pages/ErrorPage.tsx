import { useLocation, useNavigate, Link } from 'react-router';

import { Button } from '@components/ui/button';
import errorImage from '@/assets/images/common/error_image.svg';

export default function ErrorPage() {
  return (
    <div className="flex w-screen h-screen items-center justify-center bg-[var(--color-gray-200)] p-25">
        <div
          className="flex flex-col gap-[50px] w-full max-w-210 p-3"
          style={{
            backgroundImage: `url(${errorImage})`,
            backgroundSize: 'auto 100%',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
          }} 
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-8xl font-bold tracking-tight text-[var(--color-primary-blue)]">
              404 ERROR<br /> 
            </h1>
            <p className="text-[var(--color-secondary-blue-500)] text-4xl font-bold">Page Not Found</p>
            <p className="text-[var(--color-gray-700)] text-2xl font-medium mt-2">세이브는 하셨나요?</p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" size="lg" asChild className="w-[200px]">
              <Link to="/dashboard">메인으로</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-[200px]">
              <button onClick={() => window.history.back()}>이전 페이지</button>
            </Button>
          </div>
        </div>
    </div>

  );
}
