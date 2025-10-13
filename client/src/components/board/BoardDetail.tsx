// src/components/board/BoardDetail.tsx
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Edit, CircleX, Download, Delete, Send } from '@/assets/images/icons';
import { Textbox } from '../ui/textbox';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

import { deactivateBoard, getBoardDetail } from '@/api/office/notice';
import type { BoardDTO } from '@/api/office/notice';

interface BoardDetailProps {
  id?: string;
}

export default function BoardDetail({ id }: BoardDetailProps) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const postId = id ?? routeId;

  // Hook들은 최상단에서 선언
  const [post, setPost] = useState<BoardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  //댓글 hook
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

  //컨펌 다이얼로그 상태
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    confirmText?: string;
    confirmVariant?: 'default' | 'destructive' | 'secondary';
    action?: () => void;
  }>({ open: false, title: '' });

  // 컨펌 다이얼로그 열기
  const openConfirm = (
    title: string,
    action: () => void,
    confirmText = '확인',
    confirmVariant: 'default' | 'destructive' | 'secondary' = 'default'
  ) => {
    setConfirmState({ open: true, title, action, confirmText, confirmVariant });
  };

  // 게시글 상세 API 호출
  useEffect(() => {
    (async () => {
      if (!postId) {
        setPost(null);
        setLoading(false);
        return;
      }
      try {
        const data = await getBoardDetail(Number(postId));
        setPost(data);
      } catch (err) {
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  // 수정하기
  const handleEdit = () => {
    if (!post) return;
    navigate('../write', { state: { mode: 'edit', post } });
  };

  // 삭제하기 (비활성화 상태로 변경)
  const handleDelete = async () => {
    if (!routeId) return;
    await deactivateBoard(Number(routeId));
    navigate('/notice');
  };

  if (loading) return <div className="p-4">불러오는 중...</div>;
  if (!post) return <div className="p-4">게시글을 찾을 수 없습니다.</div>;

  // 댓글 필터링
  const postComments = comments
    .filter((c) => c.postId === Number(postId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatted = new Date().toLocaleString('sv-SE').replace('T', ' ');

  const handleAddComment = (postId: number) => {
    if (!newComment.trim()) return;
    const newItem = {
      id: comments.length + 1,
      postId,
      user: '홍길동', // TODO: 로그인 사용자 정보로 대체
      team: 'CCP',
      content: newComment,
      createdAt: formatted,
    };
    setComments((prev) => [newItem, ...prev]);
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
          <div className="px-3">{post.user_name}</div>
          <div className="px-3">{post.reg_date.substring(0, 10)}</div>
          <div className="px-3">조회 {post.v_count}</div>
        </div>
        <div className="text-gray-700">
          <Button variant="svgIcon" size="icon" onClick={handleEdit} className="hover:text-primary-blue-500" aria-label="수정">
            <Edit className="size-4" />
          </Button>
          <Button
            variant="svgIcon"
            size="icon"
            className="hover:text-primary-blue-500"
            aria-label="삭제"
            onClick={() => openConfirm('게시글을 삭제하시겠습니까?', handleDelete, '삭제', 'destructive')}>
            <Delete className="size-4" />
          </Button>
        </div>
      </div>

      {/* 본문 */}
      <div
        className="border-b border-gray-900 p-4 pb-10 leading-relaxed whitespace-pre-line"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

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
                  e.preventDefault();
                  handleAddComment(Number(postId));
                }
              }}
            />
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
                onClick={() => openConfirm('의견을 삭제하시겠습니까?', () => handleDeleteComment(c.id), '삭제', 'destructive')}>
                <CircleX />
              </Button>
            </div>
          ))}

          {/* 공통 다이얼로그 */}
          <ConfirmDialog
            open={confirmState.open}
            onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
            title={confirmState.title}
            confirmText={confirmState.confirmText ?? '확인'}
            confirmVariant={confirmState.confirmVariant ?? 'default'}
            onConfirm={() => confirmState.action?.()}
          />
        </div>
      </div>

      <div className="mt-3 text-right">
        <Button onClick={() => navigate('..')}>목록</Button>
      </div>
    </article>
  );
}
