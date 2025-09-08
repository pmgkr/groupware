import { Outlet } from 'react-router';

export default function Notice() {
  return (
    <div>
      {/* Outlet -> 자녀 라우트 요소들 렌더링 */}
      <Outlet />
    </div>
  );
}
