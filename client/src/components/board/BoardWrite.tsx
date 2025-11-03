import { useEffect, useState } from 'react';
import { Checkbox } from '@components/ui/checkbox';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { useLocation, useNavigate } from 'react-router';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { ConfirmDialog } from '../ui/ConfirmDialog';

import { useAuth } from '@/contexts/AuthContext';
import {
  deleteNoticeAttachment,
  getNoticeAttachments,
  pinBoard,
  registerBoard,
  updateBoard,
  uploadNoticeAttachments,
} from '@/api/office/notice';
import { BoardAttachFile, type PreviewFile } from './BoardAttachFile';
import ReactQuillEditor from './ReactQuillEditor';
import { useAppDialog } from '../common/ui/AppDialog/AppDialog';
import { useAppAlert } from '../common/ui/AppAlert/AppAlert';
import { OctagonAlert } from 'lucide-react';

export default function BoardWrite() {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isNotice, setIsNotice] = useState<'Y' | 'N'>('N');
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const editMode = location.state?.mode === 'edit';
  const post = location.state?.post;
  const { user } = useAuth();

  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();

  const confirmAction = (label: string, message: string, action: () => Promise<void> | void) => {
    addDialog({
      title: `<span class= "font-semibold">${label} 확인</span>`,
      message: `${label}을 ${message}`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          await action();
          addAlert({
            title: `${label} 완료`,
            message: `${label}이 성공적으로 ${message.replace('하시겠습니까?', '되었습니다.')}`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        } catch (err) {
          addAlert({
            title: `${label} 실패`,
            message: `${label} ${message.replace('하시겠습니까?', ' 중 오류가 발생했습니다.')}`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        }
      },
    });
  };

  // 수정 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (editMode && post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setCategory(post.category || '');
      setIsNotice(post.pinned === 'Y' ? 'Y' : 'N');

      // 기존 첨부파일 불러오기
      (async () => {
        try {
          const attachList = await getNoticeAttachments(post.n_seq);
          const previews = attachList.map((a) => ({
            id: a.id,
            name: a.name,
            url: a.url,
            size: 0,
            type: a.type,
          }));
          setFiles(previews);
        } catch (err) {
          console.error('❌ 기존 첨부파일 불러오기 실패:', err);
        }
      })();
    } else {
      // 신규 작성일 때 초기화
      setTitle('');
      setContent('');
      setCategory('');
      setIsNotice('N');
      setFiles([]);
    }
  }, [editMode, post]);

  // 게시글 등록/수정
  const handleSubmit = async () => {
    if (!user) {
      alert('로그인 후 이용해주세요.');
      return;
    }

    try {
      if (editMode && post) {
        // 수정 모드
        await updateBoard(post.n_seq, { category, title, content });

        if (isNotice !== post.pinned) {
          await pinBoard(post.n_seq, isNotice);
        }
        // 첨부파일 삭제 반영
        if (setDeletedFileIds.length > 0) {
          await Promise.all(deletedFileIds.map((id) => deleteNoticeAttachment(id)));
        }
        console.log('삭제 대상 ID 목록:', deletedFileIds);

        // File 객체만 업로드 (기존 파일 제외)
        const uploadableFiles = files.filter((f): f is File => f instanceof File);
        if (uploadableFiles.length > 0) {
          await uploadNoticeAttachments(post.n_seq, uploadableFiles);
        }

        navigate(`/notice/${post.n_seq}`);
      } else {
        // 등록 모드
        const res = await registerBoard({
          category,
          title,
          content,
          user_id: user.user_id,
          user_name: user.user_name!,
        });

        const n_seq = res.n_seq;

        // 신규 업로드만 업로드
        const uploadableFiles = files.filter((f): f is File => f instanceof File);
        if (uploadableFiles.length > 0 && n_seq) {
          await uploadNoticeAttachments(n_seq, uploadableFiles);
        }

        if (isNotice === 'Y' && n_seq) {
          await pinBoard(n_seq, 'Y');
        }

        navigate('..');
      }
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Checkbox id="notice" label="공지 설정" checked={isNotice === 'Y'} onCheckedChange={(v) => setIsNotice(v === true ? 'Y' : 'N')} />
      </div>

      <div className="mb-3 flex gap-1.5">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="!h-[50px] w-[180px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="전체공지">전체공지</SelectItem>
              <SelectItem value="일반">일반</SelectItem>
              <SelectItem value="프로젝트">프로젝트</SelectItem>
              <SelectItem value="복지">복지</SelectItem>
              <SelectItem value="기타">기타</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Input
          className="h-[50px] [&]:bg-white [&]:text-lg"
          placeholder="제목을 입력해주세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* 본문 에디터 */}
      <ReactQuillEditor value={content} onChange={setContent} />

      <div className="mt-2 flex justify-between">
        {/* 첨부파일 업로더 컴포넌트 */}
        <BoardAttachFile files={files} setFiles={setFiles} onRemoveExisting={(id) => setDeletedFileIds((prev) => [...prev, id])} />

        <div className="flex justify-end gap-1.5">
          <Button
            onClick={() => {
              const isEmptyContent = !content || content.trim() === '' || content === '<p><br></p>' || content === '<p></p>';

              if (!category.trim() || !title.trim() || isEmptyContent) {
                addAlert({
                  title: '입력오류',
                  message: '카테고리, 제목, 내용을 모두 입력해주세요.',
                  icon: <OctagonAlert />,
                  duration: 2000,
                });
                return;
              }
              confirmAction('게시글', editMode ? '수정하시겠습니까?' : '등록하시겠습니까?', handleSubmit);
            }}>
            {editMode ? '수정완료' : '등록'}
          </Button>
          <Button onClick={() => navigate('..')} variant="secondary">
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
