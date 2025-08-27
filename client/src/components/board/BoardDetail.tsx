import { Button } from '../ui/button';

export default function BoardDetail() {
  const dummy = {
    id: 1,
    title: '📢 공지사항 제목',
    content: `
      안녕하세요.
      서비스 안정화를 위해 아래 일정으로 시스템 점검이 진행됩니다.

      - 일시: 2025년 9월 1일(월) 00:00 ~ 02:00
      - 영향: 점검 시간 동안 로그인 및 일부 기능 제한

      이용에 불편을 드려 죄송합니다.
    `,
    writer: '홍길동',
    views: '1000',
    createdAt: '2025-07-01',
  };

  return (
    <article className="">
      <h2 className="border-b border-gray-900 p-4 text-xl font-bold">{dummy.title}</h2>
      <div className="flex gap-5 border-b border-gray-300 p-4 text-sm text-gray-500">
        <div>{dummy.writer}</div>
        <div>{dummy.createdAt}</div>
        <div>조회 {dummy.views}</div>
      </div>
      <div className="border-b border-gray-900 p-4 pb-10 leading-relaxed whitespace-pre-line">{dummy.content}</div>
      <div className="mt-1 text-right">
        <Button>목록</Button>
      </div>
    </article>
  );
}
