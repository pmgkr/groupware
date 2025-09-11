// src/layouts/PublicLayout.tsx
// AuthProvider 없이 동작하는 페이지 (로그인, 404에러 등)
import { Outlet } from 'react-router';

export default function PublicLayout() {
  return <Outlet />;
}
