// src/components/features/expense/AttachmentFieldEdit.tsx
import { useEffect, useRef, useState } from 'react';
import { normalizeAttachmentUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Button } from '@components/ui/button';
import { Close, Upload } from '@/assets/images/icons';
// import type { PreviewFile } from './UploadArea';

export type PreviewFile = {
  name: string;
  type: string;
  preview: string; // ea_url or blob url
  seq?: number; // ✅ 서버 파일 식별자
  isServer?: boolean; // ✅ 서버 파일 여부
};

type Props = {
  rowIndex: number;
  serverFiles?: PreviewFile[]; // 서버에서 불러온 기존 증빙자료
  onUploadNew?: (files: PreviewFile[], rowIndex: number) => void;
  onDeleteServerFile?: (file: PreviewFile, rowIndex: number) => void;
};

export function AttachmentFieldEdit({ rowIndex, serverFiles = [], onUploadNew, onDeleteServerFile }: Props) {
  const [attachments, setAttachments] = useState<PreviewFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 서버 파일 초기화
  useEffect(() => {
    setAttachments(serverFiles);
  }, [serverFiles]);

  /** 새 파일 업로드 */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const previewFiles: PreviewFile[] = files.map((f) => ({
      name: f.name,
      type: f.type,
      preview: URL.createObjectURL(f),
    }));

    setAttachments((prev) => [...prev, ...previewFiles]);
    onUploadNew?.(previewFiles, rowIndex);
  };

  /** 파일 삭제 */
  const handleDelete = (file: PreviewFile) => {
    setAttachments((prev) => prev.filter((f) => f.name !== file.name));
    onDeleteServerFile?.(file, rowIndex);
  };

  /** 드래그 앤 드롭 업로드 */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;

    const previewFiles: PreviewFile[] = droppedFiles.map((f) => ({
      name: f.name,
      type: f.type,
      preview: URL.createObjectURL(f),
    }));

    setAttachments((prev) => [...prev, ...previewFiles]);
    onUploadNew?.(previewFiles, rowIndex);
  };

  const handleAdditionalUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-full flex-col">
      <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
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
          <span className="text-destructive text-sm">미제출</span>
        )}
      </div>

      {attachments.length > 0 ? (
        // ✅ 첨부된 이미지 목록
        <div className="flex h-full w-full gap-2 overflow-x-auto p-2">
          {attachments.map((file) => (
            <div
              key={file.name}
              className={cn('relative aspect-[1/1.4] w-[calc(33.33%-var(--spacing)*1)] cursor-pointer rounded-xs ring ring-gray-300')}>
              <div className="relative h-full w-full overflow-hidden rounded-xs">
                <a href={normalizeAttachmentUrl(file.preview)} target="_blank" rel="noopener noreferrer">
                  <img src={file.preview} alt={file.name} className="absolute top-0 left-0 h-full w-full object-cover" />
                </a>
              </div>
              <Button
                variant="svgIcon"
                size="icon"
                title="삭제"
                className="absolute top-0 right-0 size-4 rounded-none bg-gray-600/80 text-white hover:bg-gray-700"
                onClick={() => handleDelete(file)}>
                <Close className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        // ✅ 첨부파일이 없을 때 → 업로드 영역
        <div
          onClick={handleAdditionalUpload}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex h-full min-h-[140px] w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-400 p-2 transition-colors',
            isDragOver && 'bg-primary-blue-100/30'
          )}>
          <p className="text-sm text-gray-500">증빙자료 업로드 영역</p>
        </div>
      )}
    </div>
  );
}
