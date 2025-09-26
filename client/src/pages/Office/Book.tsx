import { NavLink, Outlet, useLocation } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookList from '@/components/book/BookList';
import BookWish from '@/components/book/BookWish';

/* export default function Book() {
  const location = useLocation();

  // 경로에 따라 탭 활성화
  let currentPath: 'list' | 'wish';
  if (location.pathname.includes('/book/wish')) currentPath = 'wish';
  else currentPath = 'list'; // /notice, /notice/:id → "list" 탭 활성화
  return (
    <div className="p-4">
      <Tabs value={currentPath} className="w-full">
        <TabsList>
          <TabsTrigger asChild value="list">
            <NavLink to="/book">도서 목록</NavLink>
          </TabsTrigger>
          <TabsTrigger asChild value="write">
            <NavLink to="/book/wish">도서 신청</NavLink>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
} */

export default function Book() {
  return (
    <Tabs defaultValue="list">
      <TabsList>
        <TabsTrigger value="list">도서 목록</TabsTrigger>
        <TabsTrigger value="wish">도서 신청</TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <BookList></BookList>
      </TabsContent>
      <TabsContent value="wish">
        <BookWish></BookWish>
      </TabsContent>
    </Tabs>
  );
}
