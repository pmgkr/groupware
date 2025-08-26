import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
//import { AppPagination } from '@/components/ui/AppPagination';
//import { useState } from 'react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // ✅ 로그인 로직 성공 처리 후
    navigate('/dashboard'); // 대시보드로 이동
  };
  //const [page, setPage] = useState(1);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl">로그인 페이지</h1>
      {/* 로그인 폼 추가 예정 */}
      <Button onClick={handleLogin}>로그인</Button>

      {/* 
      페이지네이션 예시
      <AppPagination page={page} totalPages={10} onPageChange={setPage} /> 
      */}
    </div>
  );
}
