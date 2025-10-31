import { useEffect, useRef, useState } from 'react';
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

export function AttachmentField({ name, rowIndex, files = [], onDropFiles, onUploadFiles, activeFile, setActiveFile }: Props) {
  const [attachments, setAttachments] = useState<PreviewFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fieldRef.current && !fieldRef.current.contains(e.target as Node)) {
        setActiveFile?.(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setActiveFile]);

  /** 파일 드롭 (UploadArea 또는 로컬 파일 직접 드롭 모두 지원) */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const data = e.dataTransfer.getData('application/json');

    // CASE 1: UploadArea → 기존 JSON 기반 드롭
    if (data) {
      const droppedFiles = JSON.parse(data) as PreviewFile[];
      setAttachments((prev) => {
        const uniqueFiles = droppedFiles.filter((file) => !prev.some((f) => f.name === file.name));
        const newFiles = [...prev, ...uniqueFiles];
        setTimeout(() => onDropFiles?.(newFiles, name, rowIndex), 0);
        return newFiles;
      });
      return;
    }

    // CASE 2: 사용자가 로컬 파일을 직접 드롭한 경우 (NEW)
    const droppedFileList = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (droppedFileList.length === 0) return;

    const newFiles: PreviewFile[] = droppedFileList.map((file) => ({
      name: file.name,
      type: file.type,
      preview: URL.createObjectURL(file),
    }));

    setAttachments((prev) => [...prev, ...newFiles]);
    onUploadFiles?.(newFiles, rowIndex);
  };

  /** input으로 직접 업로드 */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []).map((file) => ({
      name: file.name,
      type: file.type,
      preview: URL.createObjectURL(file),
    })) as PreviewFile[];

    setAttachments((prev) => [...prev, ...uploaded]);
    onUploadFiles?.(uploaded, rowIndex);
  };

  const handleAdditionalUpload = () => {
    fileInputRef.current?.click();
  };

  /** 개별 삭제 */
  const handleRemove = (fileName: string) => {
    const updated = attachments.filter((f) => f.name !== fileName);
    setAttachments(updated);
    setTimeout(() => onDropFiles?.([{ name: fileName, type: '', preview: '' }], name, null), 0);
  };

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

      <div ref={fieldRef} className="min-h-[140px]">
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
                    'relative aspect-[1/1.4] w-[calc(33.33%-var(--spacing)*1)] cursor-pointer rounded-xs ring ring-gray-300',
                    isActive && 'ring-primary-blue-300'
                  )}>
                  <div className="relative h-full w-full overflow-hidden rounded-xs">
                    <img src={file.preview} alt={file.name} className="absolute top-0 left-0 h-full w-full object-cover" />
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
}
