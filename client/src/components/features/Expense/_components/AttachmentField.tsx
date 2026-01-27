import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@components/ui/button';
import { Close } from '@/assets/images/icons';
import type { PreviewFile } from './UploadArea';

type Props = {
  name: string;
  rowIndex: number;
  files?: PreviewFile[];
  onDropFiles?: (files: PreviewFile[], fieldName: string, rowIndex: number | null) => void;
  onUploadFiles?: (files: PreviewFile[], rowIndex: number | null) => void;
  activeFile?: string | null;
  setActiveFile?: (name: string | null) => void;
};

/** ✅ 성능 최적화 버전 AttachmentField */
export const AttachmentField = React.memo(function AttachmentField({
  name,
  rowIndex,
  files = [],
  onDropFiles,
  onUploadFiles,
  activeFile,
  setActiveFile,
}: Props) {
  const [attachments, setAttachments] = useState<PreviewFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 🔹 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fieldRef.current && !fieldRef.current.contains(e.target as Node)) {
        setActiveFile?.(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setActiveFile]);

  /** ✅ 공통 파일 추가 함수 */
  const addAttachments = useCallback((newFiles: PreviewFile[]) => {
    setAttachments((prev) => {
      const unique = newFiles.filter((nf) => !prev.some((pf) => pf.name === nf.name));
      return [...prev, ...unique];
    });
  }, []);

  /** ✅ UploadArea → 드롭 시 처리 */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const data = e.dataTransfer.getData('application/json');

      // CASE 1: UploadArea → JSON 기반 드롭
      if (data) {
        const droppedFiles = JSON.parse(data) as PreviewFile[];
        addAttachments(droppedFiles);
        requestIdleCallback(() => onDropFiles?.(droppedFiles, name, rowIndex));
        return;
      }

      // CASE 2: 로컬 파일 직접 드롭
      const droppedFileList = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (droppedFileList.length === 0) return;

      const newFiles: PreviewFile[] = droppedFileList.map((file) => ({
        name: file.name,
        type: file.type,
        preview: URL.createObjectURL(file),
      }));

      addAttachments(newFiles);
      requestIdleCallback(() => onUploadFiles?.(newFiles, rowIndex));
    },
    [addAttachments, name, rowIndex, onDropFiles, onUploadFiles]
  );

  /** ✅ input으로 업로드 */
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploaded = Array.from(e.target.files || []).map((file) => ({
        name: file.name,
        type: file.type,
        preview: URL.createObjectURL(file),
      })) as PreviewFile[];

      addAttachments(uploaded);
      requestIdleCallback(() => onUploadFiles?.(uploaded, rowIndex));
    },
    [addAttachments, onUploadFiles, rowIndex]
  );

  /** ✅ 추가 업로드 버튼 클릭 */
  const handleAdditionalUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /** ✅ 개별 삭제 (linkedRows 해제 포함) */
  const handleRemove = useCallback(
    (fileName: string) => {
      setAttachments((prev) => prev.filter((f) => f.name !== fileName));
      requestIdleCallback(() => onDropFiles?.([{ name: fileName, type: '', preview: '' }], name, null));
    },
    [name, onDropFiles]
  );

  return (
    <div className="flex h-full flex-col">
      <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      <div className="mb-2 flex h-6 items-center justify-between">
        <p className="font-bold text-gray-950">증빙자료 #{rowIndex}</p>
        {attachments.length ? (
          <button
            type="button"
            onClick={handleAdditionalUpload}
            className="text-primary-blue-500 hover:text-primary-blue-700 cursor-pointer text-sm">
            추가 업로드
          </button>
        ) : (
          <span className="text-destructive text-xs">미제출</span>
        )}
      </div>

      <div ref={fieldRef} className="md:min-h-[140px]">
        {attachments.length > 0 ? (
          <div
            className="flex h-full w-full gap-2 overflow-x-auto p-2"
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragOver(true)}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}>
            {attachments.map((file) => {
              const isActive = activeFile === file.name;
              return (
                <div
                  key={file.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFile?.(file.name);
                  }}
                  className={cn(
                    'relative aspect-[1/1.4] w-[calc(33.33%-var(--spacing)*1)] cursor-pointer rounded-xs ring ring-gray-300 transition-transform duration-150',
                    isActive && 'ring-primary-blue-300 scale-[1.02]'
                  )}>
                  <div className="relative h-full w-full overflow-hidden rounded-xs">
                    <img src={file.preview} alt={file.name} loading="lazy" className="absolute top-0 left-0 h-full w-full object-cover" />
                  </div>
                  <Button
                    variant="svgIcon"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(file.name);
                    }}
                    className="absolute top-0 right-0 size-4 rounded-none bg-gray-600/80 text-white hover:bg-gray-700">
                    <Close className="size-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragOver(true)}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={handleAdditionalUpload}
            className={cn(
              'flex h-full w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-400 p-2',
              isDragOver && 'bg-primary-blue-100/30'
            )}>
            <p className="text-sm text-gray-500">증빙자료 업로드 영역</p>
          </div>
        )}
      </div>
    </div>
  );
});
