import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Textbox } from '@/components/ui/textbox';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // ✅ 로그인 로직 성공 처리 후
    navigate('/dashboard'); // 대시보드로 이동
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl">로그인 페이지</h1>
      {/* 로그인 폼 추가 예정 */}
      <Button onClick={handleLogin}>로그인</Button>
      <Textbox></Textbox>
    </div>
  );
}
