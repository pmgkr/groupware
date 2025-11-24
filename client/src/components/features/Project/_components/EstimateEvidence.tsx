import { useRef, useState, useCallback, useEffect } from 'react';
import { FILE_ACCEPT_ALL } from '@/constants/fileAccept';
import { validateFiles } from '@/utils/fileValidator';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';

import { Button } from '@components/ui/button';
import { Close } from '@/assets/images/icons';
import { OctagonAlert } from 'lucide-react';

export type PreviewFile = {
  file: File; // 원본 파일
  name: string;
  type: string;
  size: number;
};

export default function EstimateEvidence({ onChangeFiles }: { onChangeFiles?: (files: PreviewFile[]) => void }) {
  const { addAlert } = useAppAlert();

  const [isDragging, setIsDragging] = useState(false);
  const [attachments, setAttachments] = useState<PreviewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 🔥 attachments 변경될 때만 부모에게 알려주기
  useEffect(() => {
    if (onChangeFiles) {
      onChangeFiles(attachments);
    }
  }, [attachments, onChangeFiles]);

  const addAttachments = (files: PreviewFile[]) => {
    setAttachments((prev) => [...prev, ...files]); // 🔥 부모 호출 제거
  };

  /** 📌 파일 업로드 */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const { valid, message } = validateFiles(files, { allow: FILE_ACCEPT_ALL });

    if (!valid) {
      addAlert({
        title: '업로드 실패',
        message: `<p>${message?.replace(/\n/g, '<br/>')}</p>`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    const uploaded = Array.from(e.target.files || []).map((file) => ({
      file,
      name: file.name,
      type: file.type,
    })) as PreviewFile[];

    addAttachments(uploaded);
  }, []);

  /** 📌 박스 클릭 → 파일 선택 창 열기 */
  const handleClickArea = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = useCallback((name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  }, []);

  /** 📌 Drag Event 처리 */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    const { valid, message } = validateFiles(files, { allow: FILE_ACCEPT_ALL });

    if (!valid) {
      addAlert({
        title: '업로드 실패',
        message: `<p>${message?.replace(/\n/g, '<br/>')}</p>`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }

    const uploaded = files.map((file) => ({
      file,
      name: file.name,
      type: file.type,
    })) as PreviewFile[];

    addAttachments(uploaded);
  };

  return (
    <>
      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept={FILE_ACCEPT_ALL} />
      <div className="flex items-center justify-between">
        <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 증빙</h2>
        {attachments.length > 0 && (
          <Button type="button" onClick={handleClickArea} variant="transparent" size="sm" className="text-primary p-0">
            파일 추가
          </Button>
        )}
      </div>
      <div className="flex h-full flex-col rounded-sm border border-gray-300">
        {/* 업로드 영역 */}
        {attachments.length ? (
          <div className="overflow-y-auto p-3">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex w-full items-center justify-between gap-2">
                <span className="flex-1 truncate overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-gray-800">
                  {file.name}
                </span>
                <Button
                  type="button"
                  variant="svgIcon"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(file.name);
                  }}>
                  <Close className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={handleClickArea}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`hover:bg-primary-blue-50 flex flex-1 cursor-pointer items-center justify-center rounded-sm transition-colors ${isDragging ? 'bg-primary-blue-50' : 'bg-gray-50'} `}>
            <p className="text-sm text-gray-500">증빙자료 업로드 영역</p>
          </div>
        )}
      </div>
    </>
  );
}
