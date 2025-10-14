import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '@components/ui/checkbox';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { File, CircleX } from '@/assets/images/icons';
import { useLocation, useNavigate } from 'react-router';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '../ui/ConfirmDialog';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { useAuth } from '@/contexts/AuthContext';
import { pinBoard, registerBoard, updateBoard } from '@/api/office/notice';

export default function BoardWrite() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isNotice, setIsNotice] = useState<'Y' | 'N'>('N');
  const location = useLocation();
  const editMode = location.state?.mode === 'edit';
  const post = location.state?.post;

  //컨펌 다이얼로그 상태
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    confirmText?: string;
    action?: () => void;
  }>({ open: false, title: '' });

  // 컨펌 다이얼로그 열기
  const openConfirm = (title: string, action: () => void, confirmText = '확인') => {
    setConfirmState({ open: true, title, action, confirmText });
  };

  //수정모드일때
  useEffect(() => {
    if (editMode) {
      if (post) {
        setTitle(post.title || '');
        setContent(post.content || '');
        setCategory(post.category || '');
        setIsNotice(post.pinned === 'Y' ? 'Y' : 'N');
      }
    } else {
      // 글쓰기 모드일 때
      setTitle('');
      setContent('');
      setCategory('');
      setIsNotice('N');
    }
  }, [editMode, post]);

  const { user } = useAuth(); //로그인한 유저 정보 (AuthContext 기반)

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인 후 이용해주세요.');
      return;
    }
    // content가 Quill의 "빈 HTML"일 때도 막기
    const isEmptyContent = !content || content.trim() === '' || content === '<p><br></p>' || content === '<p></p>';

    // 카테고리, 제목, 내용 모두 체크
    if (!category.trim() || !title.trim() || isEmptyContent) {
      alert('카테고리, 제목, 내용을 모두 입력해주세요.');
      return;
    }

    try {
      if (editMode && post) {
        // 수정 모드
        await updateBoard(post.n_seq, {
          category,
          title,
          content,
        });
        //공지 고정 상태 변경 필요 시
        if (isNotice !== post.pinned) {
          await pinBoard(post.n_seq, isNotice);
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

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    // 여러 파일 선택 가능하게
    setFiles((prev) => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])]);
    e.target.value = ''; // 같은 파일 선택 시에도 onChange 트리거 되도록 초기화
  };

  const handleRemove = (name: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== name));
  };
  const navigate = useNavigate();
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
              {/* <SelectLabel>카테고리</SelectLabel> */}
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
          onChange={(e) => setTitle(e.target.value)}></Input>
      </div>

      {/*  에디터 영역 */}
      <div className="mb-4" style={{ height: '58vh' }}>
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          placeholder="내용을 입력하세요..."
          className="rounded-lg bg-white"
          style={{ height: 'calc(100% - 50px)' }}
        />
      </div>

      <div className="mt-2 flex justify-between">
        <div className="flex gap-1.5">
          <Button variant="outline" className="[&]:border-primary-blue-500 text-primary-blue-500" onClick={handleAttachFile}>
            <File className="mr-1 size-6" />
            파일 첨부
          </Button>

          {/* 실제 파일 input */}
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />

          <div className="flex flex-wrap items-center gap-1.5">
            {files.map((file) => (
              <div key={file.name} className="flex items-center rounded-md border border-gray-300 p-1 pl-4">
                <span className="text-base text-gray-500">{file.name}</span>
                <Button variant="svgIcon" size="icon" aria-label="파일 삭제" onClick={() => handleRemove(file.name)}>
                  <CircleX className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-1.5">
          <Button onClick={() => openConfirm(editMode ? '게시글을 수정하시겠습니까?' : '게시글을 등록하시겠습니까?', handleSubmit)}>
            {editMode ? '수정완료' : '등록'}
          </Button>
          <Button onClick={() => navigate('..')} variant="secondary">
            취소
          </Button>
        </div>
      </div>
      {/* 공통 다이얼로그 */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        onConfirm={() => confirmState.action?.()}
      />
    </div>
  );
}
