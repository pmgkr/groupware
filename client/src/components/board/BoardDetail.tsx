import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Edit, CircleX, Download, Delete, Enter, Send } from '@/assets/images/icons';
import { Textbox } from '../ui/textbox';
import { useState } from 'react';

// 스토리북 view
interface BoardDetailProps {
  id?: string;
}

export default function BoardDetail({ id }: BoardDetailProps) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const postId = id ?? routeId; // props > URL 순서로 id 사용

  const posts = [
    {
      id: 999,
      category: '전체공지',
      title: '📢 공지사항 제목',
      content: `
안녕하세요.
서비스 안정화를 위해 아래 일정으로 시스템 점검이 진행됩니다.

- 일시: 2025년 9월 1일(월) 00:00 ~ 02:00
- 영향: 점검 시간 동안 로그인 및 일부 기능 제한

이용에 불편을 드려 죄송합니다.
      `,
      writer: '관리자',
      views: 1000,
      createdAt: '2025-07-01',
      isNotice: true,
      attachments: ['첨부파일.pdf', '시스템점검안내.docx'],
    },
    {
      id: 3,
      category: '일반',
      title: '제목 제목 제목 제목 제목',
      content: '3번 글 내용입니다.',
      writer: '홍길동',
      views: 15,
      createdAt: '2025-07-01',
    },
    {
      id: 2,
      category: '프로젝트',
      title: '제목 제목 제목 제목',
      content: '2번 글 내용입니다.',
      writer: '박보검',
      views: 222,
      createdAt: '2025-07-25',
    },
    {
      id: 1,
      category: '기타',
      title: '제목 제목 제목',
      content: '1번 글 내용입니다.',
      writer: '윤도운',
      views: 825,
      createdAt: '2025-08-30',
      attachments: ['드럼 악보.pdf'],
    },
  ];

  const post = posts.find((p) => String(p.id) === postId);

  if (!post) return <div className="p-4">게시글을 찾을 수 없습니다.</div>;

  //의견 댓글
  const [comments, setComments] = useState([
    {
      id: 1,
      postId: 1,
      user: '박성진',
      team: 'CCP',
      content: '좋은 글 잘 읽었습니다!',
      createdAt: '2025-09-17 13:20',
    },
    {
      id: 2,
      postId: 2,
      user: '박보검',
      team: 'CCD',
      content: '공지사항 잘 읽었습니다~',
      createdAt: '2025-09-17 17:20',
    },
  ]);
  const [newComment, setNewComment] = useState('');

  // postId 기준으로 필터링
  const postComments = comments
    .filter((c) => c.postId === Number(postId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatted = new Date().toLocaleString('sv-SE').replace('T', ' ');
  const handleAddComment = (postId: number) => {
    if (!newComment.trim()) return;
    const now = new Date();
    const newItem = {
      id: comments.length + 1,
      postId,
      user: '홍길동', // 실제 로그인 유저 정보에 따라 변경 가능
      team: 'CCP', //
      content: newComment,
      createdAt: formatted,
    };
    setComments((prev) => [newItem, ...prev]); // 최신 댓글 위로
    setNewComment('');
  };

  const handleDeleteComment = (id: number) => {
    setComments(comments.filter((c) => c.id !== id));
  };

  return (
    <article>
      <h2 className="border-b border-gray-900 p-4 text-xl font-bold">{post.title}</h2>

      <div className="flex items-center justify-between border-b border-gray-300">
        <div className="flex divide-x divide-gray-300 p-4 text-sm leading-tight text-gray-500">
          <div className="px-3 pl-0">{post.category}</div>
          <div className="px-3">{post.writer}</div>
          <div className="px-3">{post.createdAt}</div>
          <div className="px-3">조회 {post.views}</div>
        </div>
        <div className="text-gray-700">
          <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="수정">
            <Edit className="size-4" />
          </Button>
          <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="삭제">
            <Delete className="size-4" />
          </Button>
        </div>
      </div>

      {post.attachments && post.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1 bg-gray-200 py-3 pl-4">
          {post.attachments.map((file, index) => (
            <Button
              key={index}
              variant="secondary"
              className="hover:text-primary-blue-500 hover:bg-primary-blue-100 text-sm [&]:border-gray-300 [&]:p-4"
              onClick={() => {
                console.log(`${file} 다운로드`);
              }}>
              <span className="font-normal">{file}</span>
              <Download className="size-4.5" />
            </Button>
          ))}
        </div>
      )}

      <div className="border-b border-gray-900 p-4 pb-10 leading-relaxed whitespace-pre-line">{post.content}</div>

      {/* 의견 댓글 영역 */}
      <div className="py-7 pr-0 pl-5">
        {/* 의견 작성 */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="w-[140px] font-bold">의견</h2>
          <div className="w-full flex-1">
            <Textbox
              className="w-full"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); //줄바꿈 방지
                  handleAddComment(Number(postId));
                }
              }}></Textbox>
          </div>
          <Button
            variant="svgIcon"
            size="icon"
            aria-label="의견 게시"
            className="h-[40px] border border-gray-950 px-6"
            onClick={() => handleAddComment(Number(postId))}>
            <Send />
          </Button>
        </div>

        {/* 의견 확인 */}
        <div className="flex flex-col gap-3">
          {postComments.map((c) => (
            <div className="flex items-center justify-between gap-4" key={c.id}>
              <div className="w-[140px] text-base">
                {c.user} <span>({c.team})</span>
              </div>
              <div className="flex w-full flex-1 items-center justify-between text-base">
                <p>{c.content}</p>
                <div className="text-gray-600">{c.createdAt}</div>
              </div>
              <Button
                variant="svgIcon"
                size="icon"
                aria-label="의견 삭제"
                className="px-6"
                onClick={() => {
                  if (window.confirm('삭제 하시겠습니까?')) {
                    handleDeleteComment(c.id);
                  }
                }}>
                <CircleX />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-right">
        <Button onClick={() => navigate('..')}>목록</Button>
      </div>
    </article>
  );
}
