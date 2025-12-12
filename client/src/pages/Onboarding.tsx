import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';

import { Button } from '@components/ui/button';
import ProfileForm from '@components/features/Profile/ProfileForm';

import Logo from '@/assets/images/common/pmg_logo.svg?react';
import { Place, LeftArr, Upload } from '@/assets/images/icons';
import { cn } from '@/lib/utils';
import { onboardingUploadApi } from '@/api/auth';

export default function Onboarding() {
  const location = useLocation();
  const navigate = useNavigate();

  const { email: stateEmail, onboardingToken: stateToken } = (location.state as { email: string; onboardingToken: string }) || {};

  const email = stateEmail || sessionStorage.getItem('onboarding:email');
  const onboardingToken = stateToken || sessionStorage.getItem('onboarding:token');

  // 이미지 업로드 관련 상태
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 드래그 이벤트 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 1. 프리뷰 설정
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 2. 서버 업로드
    try {
      const res = await onboardingUploadApi(file, onboardingToken);
      if (res.result && res.path) {
        console.log('Uploaded:', res.path);
        setUploadedPath(res.path);
      } else {
        // 실패 시 초기화
        console.warn('Upload failed, resetting...');
        if (!res.result && res.path === 'failed') {
          // specific logic requested: { result: false, path: "failed" }
        }
        setImagePreview(null);
        setUploadedPath(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert('이미지 업로드에 실패했습니다.');
      }
    } catch (e) {
      console.error('Upload failed:', e);
      // 에러 발생 시 초기화
      setImagePreview(null);
      setUploadedPath(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  return (
    <div className="flex w-screen items-center justify-center bg-gray-200 p-25">
      <div className="flex w-full max-w-250 rounded-2xl bg-white p-3">
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
              로그인 돌아가기
            </Link>
          </Button>

          {/* 사진 업로드 영역 */}
          <div className="mt-4 flex flex-col gap-2">
            <h3 className="font-semibold text-gray-900">개인 사진 업로드</h3>
            <div
              className={cn(
                'flex size-[350px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors',
                isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 bg-white/50 hover:bg-white/80',
                imagePreview && 'border-none bg-black'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="size-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload className="size-12 opacity-50" />
                  <p className="text-sm">클릭하거나 이미지를 드래그하세요</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-primary-blue mt-auto flex items-center gap-x-2.5 text-3xl font-bold tracking-tight">
            <Place className="size-7.5" />
            Seoul, Korea
          </div>
        </div>
        <div className="relative flex flex-1 flex-col gap-y-8 px-10 py-14 pr-7">
          <h2 className="text-primary-blue text-3xl font-bold">프로필 작성하기</h2>
          <ProfileForm email={email} onboardingToken={onboardingToken} profileImage={uploadedPath} />
        </div>
      </div>
    </div>
  );
}
