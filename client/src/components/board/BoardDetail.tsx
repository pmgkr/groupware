// src/components/board/BoardDetail.tsx
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Edit, CircleX, Download, Delete, Send, HeartFull, Check } from '@/assets/images/icons';
import { Textbox } from '../ui/textbox';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

import {
  deactivateBoard,
  editComment,
  getBoardDetail,
  getComment,
  getNoticeAttachments,
  registerComment,
  removeComment,
} from '@/api/office/notice';
import type { Attachment, BoardDTO, CommentDTO } from '@/api/office/notice';

import { useAuth } from '@/contexts/AuthContext';
import { formatKST } from '@/utils';
import { Textarea } from '../ui/textarea';
import { Heart, OctagonAlert } from 'lucide-react';
import { useAppAlert } from '../common/ui/AppAlert/AppAlert';
import { useAppDialog } from '../common/ui/AppDialog/AppDialog';

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

  //게시글 조아요
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  //댓글 상태
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editCommentMode, setEditCommentMode] = useState(false);
  const [editCommentModeId, setEditCommentModeId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState<{ [key: number]: string }>({});
  //첨부파일
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();
  /** 공용 삭제 확인 함수 */
  const confirmDelete = async (label: string, onConfirmAction: () => Promise<void> | void) => {
    addDialog({
      title: `<span class=" font-semibold">삭제 확인</span>`,
      message: `이 ${label}을(를) 정말 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          await onConfirmAction();
          addAlert({
            title: '삭제 완료',
            message: `${label}이(가) 성공적으로 삭제되었습니다.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        } catch (err) {
          addAlert({
            title: '삭제 실패',
            message: `${label} 삭제 중 오류가 발생했습니다.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        }
      },
    });
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

        //첨부파일 목록 불러오기
        const attachList = await getNoticeAttachments(Number(postId));
        setAttachments(attachList);

        //댓글 불러오기
        const commentData = await getComment(Number(postId));
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

  //첨부파일 다운로드
  const handleDownload = (fileUrl: string, fileName: string) => {
    const AfileDown = document.createElement('a');
    AfileDown.href = fileUrl;
    AfileDown.download = fileName;
    AfileDown.target = '_blank';
    AfileDown.click();
  };

  // 댓글 등록
  const { user } = useAuth();

  const handleAddComment = async (postId: number) => {
    if (!newComment.trim() || !user) return;

    try {
      //수정
      if (editCommentMode && editCommentModeId) {
        await editComment(editCommentModeId, { comment: newComment });
        setEditCommentMode(false);
        setEditCommentModeId(null);
      } else {
        await registerComment({
          n_seq: Number(postId),
          user_id: user.user_id,
          user_name: user.user_name!,
          comment: newComment,
        });
      }

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
  /* const handleDeleteComment = async (bc_seq: number) => {
    try {
      await removeComment(bc_seq);
      const updated = await getComment(Number(postId));
      setComments(updated);
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  }; */

  //게시글 조아요
  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked((prev) => !prev);
  };

  if (loading) return <div className="p-4">불러오는 중...</div>;
  if (!post) return <div className="p-4">게시글을 찾을 수 없습니다.</div>;

  return (
    <article>
      <div className="flex justify-between border-b p-4 pr-1">
        <h2 className="border-gray-900 text-2xl font-bold">{post.title}</h2>
        <div className="flex items-center">
          <p className="mr-2 w-[30px] text-right text-base">{likeCount}</p>
          <Button variant="svgIcon" size="icon" onClick={handleLike} className="size-5" aria-label="게시글 좋아요">
            {liked ? <HeartFull className="scale-110" /> : <Heart />}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-300">
        <div className="flex divide-x divide-gray-300 p-4 text-sm leading-tight text-gray-500">
          <div className="px-3 pl-0">{post.category}</div>
          <div className="px-3">{post.user_name}</div>
          <div className="px-3">{post.reg_date.substring(0, 10)}</div>
          <div className="px-3">조회 {post.v_count}</div>
        </div>

        {user?.user_id === post.user_id && (
          <div className="text-gray-700">
            <Button variant="svgIcon" size="icon" onClick={handleEdit} className="hover:text-primary-blue-500" aria-label="수정">
              <Edit className="size-4" />
            </Button>
            <Button
              variant="svgIcon"
              size="icon"
              className="hover:text-primary-blue-500"
              aria-label="삭제"
              /* onClick={() => openConfirm('게시글을 삭제하시겠습니까?', handleDelete, '삭제', 'destructive')} */
              onClick={() =>
                confirmDelete('게시글', async () => {
                  await deactivateBoard(Number(routeId));
                  navigate('/notice');
                })
              }>
              <Delete className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div
        className="border-b border-gray-900 p-4 pb-10 leading-relaxed whitespace-pre-line"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      {/* 첨부파일 목록 */}
      {attachments.length > 0 && (
        <div className="border-b border-gray-300 bg-gray-50 p-4">
          {attachments.map((file) => (
            <Button
              key={file.id}
              variant="secondary"
              className="hover:text-primary-blue-500 hover:bg-primary-blue-100 mr-2 text-sm [&]:border-gray-300 [&]:p-4"
              onClick={() => handleDownload(file.url, file.name)}>
              <div className="flex items-center gap-2">
                <span className="font-normal">{file.name}</span>
                <span className="text-xs text-gray-400">{file.createdAt?.slice(0, 10)}</span>
              </div>
              <Download className="size-4.5" />
            </Button>
          ))}
        </div>
      )}

      {/* 댓글 영역 */}
      <div className="bg-gray-100 p-7 pr-10">
        {/* 댓글 작성 */}
        <div className="mb-5 flex items-start justify-between gap-5">
          <h2 className="w-[100px] text-base font-bold">댓글</h2>
          <div className="w-full flex-1">
            <Textarea
              size="sm"
              className="w-full"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              /* onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddComment(Number(postId));
                }
              }} */
            />
          </div>
          <Button
            variant="svgIcon"
            size="icon"
            aria-label="댓글 게시"
            className="h-[64px] w-[64px] border border-gray-950 px-6"
            onClick={() => handleAddComment(Number(postId))}>
            <Send />
          </Button>
        </div>

        {/* 댓글 목록 */}
        <div className="flex flex-col">
          {comments.map((c) => (
            <div className="mb-3 flex items-start justify-between gap-5" key={c.bc_seq}>
              <div className="w-[100px] pt-1.5 text-base text-gray-700">{c.user_name}</div>
              {/* 댓글 내용 / 수정 */}
              <div className="flex w-[1200px] justify-start">
                {editCommentModeId === c.bc_seq ? (
                  //수정중
                  <div className="flex w-full flex-1 items-start justify-between text-base">
                    <Textarea
                      size="sm"
                      className="w-[1212px] flex-1"
                      value={editCommentText[c.bc_seq] ?? ''}
                      onChange={(e) => setEditCommentText((prev) => ({ ...prev, [c.bc_seq]: e.target.value }))}
                    />
                  </div>
                ) : (
                  //일반 댓글 목록
                  <div className="flex justify-start">
                    <p className="max-w-[1050px] pt-1 text-base whitespace-pre-line text-gray-700">{c.comment}</p>
                    {user?.user_id === c.user_id && (
                      <div className="pl-6 text-gray-600">
                        <Button
                          variant="svgIcon"
                          size="icon"
                          aria-label="댓글 수정"
                          onClick={() => {
                            setEditCommentMode(true);
                            setEditCommentModeId(c.bc_seq);
                            setEditCommentText((prev) => ({ ...prev, [c.bc_seq]: c.comment }));
                          }}>
                          <Edit />
                        </Button>

                        <Button
                          variant="svgIcon"
                          size="icon"
                          aria-label="댓글 삭제"
                          /* onClick={() =>
                            openConfirm('댓글을 삭제하시겠습니까?', () => handleDeleteComment(c.bc_seq), '삭제', 'destructive')
                          } */
                          onClick={() =>
                            confirmDelete('댓글', async () => {
                              await removeComment(c.bc_seq);
                              const updated = await getComment(Number(postId));
                              setComments(updated);
                            })
                          }>
                          <Delete />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 수정모드일때 일시 숨기기 */}
              {!(editCommentMode && editCommentModeId === c.bc_seq) && (
                <div className="w-[123px] pt-1.5 text-sm text-gray-600">{formatKST(c.created_at)}</div>
              )}
              {/* 수정 모드일 때 "댓글작성으로 돌아가기" 버튼 */}

              {editCommentModeId === c.bc_seq && (
                <div className="flex w-[64px]">
                  {user?.user_id === c.user_id && (
                    <div className="flex text-gray-600">
                      {/* 수정완료 버튼 */}
                      <Button
                        variant="svgIcon"
                        size="icon"
                        aria-label="댓글 수정완료"
                        onClick={async () => {
                          try {
                            const updatedText = editCommentText[c.bc_seq] ?? '';
                            await editComment(c.bc_seq, { comment: updatedText });
                            setEditCommentMode(false);
                            setEditCommentModeId(null);
                            setEditCommentText((prev) => ({ ...prev, [c.bc_seq]: '' }));
                            const updated = await getComment(Number(postId));
                            setComments(updated);
                          } catch (err) {
                            console.error('댓글 수정 실패:', err);
                            alert('댓글 수정 중 오류가 발생했습니다.');
                          }
                        }}>
                        <Check />
                      </Button>

                      {/* 나가기(수정 취소) 버튼 */}
                      <Button
                        variant="svgIcon"
                        size="icon"
                        aria-label="수정 취소"
                        onClick={() => {
                          setEditCommentMode(false);
                          setEditCommentModeId(null);
                          setNewComment('');
                        }}>
                        <CircleX />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {/* 공통 다이얼로그 */}
          {/* <ConfirmDialog
            open={confirmState.open}
            onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
            title={confirmState.title}
            confirmText={confirmState.confirmText ?? '확인'}
            confirmVariant={confirmState.confirmVariant ?? 'default'}
            onConfirm={() => confirmState.action?.()}
          /> */}
        </div>
      </div>

      <div className="mt-3 text-right">
        <Button onClick={() => navigate('..')}>목록</Button>
      </div>
    </article>
  );
}
