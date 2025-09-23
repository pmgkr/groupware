import { NavLink, Outlet, useLocation } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookList from '@/components/book/BookList';
import BookWish from '@/components/book/BookWish';

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
