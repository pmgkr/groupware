// src/components/board/BoardDetail.tsx
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Edit, CircleX, Download, Delete, Send } from '@/assets/images/icons';
import { Textbox } from '../ui/textbox';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

import { deactivateBoard, getBoardDetail, getComment, registerComment, removeComment } from '@/api/office/notice';
import type { BoardDTO, CommentDTO } from '@/api/office/notice';

import { useAuth } from '@/contexts/AuthContext';
import { formatKST } from '@/utils';

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

  //댓글 상태
  const [comments, setComments] = useState<CommentDTO[]>([]);
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

        //댓글 불러오기
        const commentData = await getComment(Number(postId));
        //console.log('댓글 API 응답:', commentData);
        setComments(commentData);
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

  // 댓글 등록
  const { user } = useAuth();

  const handleAddComment = async (postId: number) => {
    if (!newComment.trim() || !user) return;

    try {
      await registerComment({
        n_seq: Number(postId),
        user_id: user.user_id,
        user_name: user.user_name!,
        comment: newComment,
      });

      // 등록 성공 후 댓글 다시 불러오기
      const updated = await getComment(postId);
      setComments(updated);
      setNewComment('');
    } catch (err) {
      console.error('댓글 등록 실패:', err);
      alert('댓글 등록 중 오류가 발생했습니다.');
    }
  };

  //댓글 삭제
  const handleDeleteComment = async (bc_seq: number) => {
    try {
      await removeComment(bc_seq);
      const updated = await getComment(Number(postId));
      setComments(updated);
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className="p-4">불러오는 중...</div>;
  if (!post) return <div className="p-4">게시글을 찾을 수 없습니다.</div>;

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
      <div className="py-7 pr-0 pl-6">
        {/* 의견 작성 */}
        <div className="mb-5 flex items-center justify-between gap-5">
          <h2 className="w-[120px] text-base font-bold">댓글</h2>
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

        {/* 의견 목록 */}
        <div className="flex flex-col gap-1">
          {comments.map((c) => (
            <div className="flex items-center justify-between gap-4" key={c.bc_seq}>
              <div className="w-[140px] text-base">
                {c.user_name} {/* <span>({c.team})</span> */}
              </div>
              <div className="flex w-full flex-1 items-center justify-between text-base">
                <p>{c.comment}</p>
                <div className="text-sm text-gray-600">{formatKST(c.created_at)}</div>
              </div>
              <Button
                variant="svgIcon"
                size="icon"
                aria-label="의견 삭제"
                className="px-6"
                onClick={() => openConfirm('댓글을 삭제하시겠습니까?', () => handleDeleteComment(c.bc_seq), '삭제', 'destructive')}>
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
