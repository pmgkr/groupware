import { useRef } from 'react';
import { Button } from '@components/ui/button';
import { File as FileIcon, CircleX } from '@/assets/images/icons';
import { validateFiles } from '@/utils';

export type PreviewFile = File | { id: number; name: string; nf_name: string; size?: number; type?: string };

interface BoardAttachFileProps {
  files: PreviewFile[];
  setFiles: React.Dispatch<React.SetStateAction<PreviewFile[]>>;
  onRemoveExisting?: (id: number) => void;
}
interface BoardAttachFileProps {
  files: PreviewFile[];
  setFiles: React.Dispatch<React.SetStateAction<PreviewFile[]>>;
  onRemoveExisting?: (id: number) => void; // ✅ 기존 파일 삭제 콜백
}

export function BoardAttachFile({ files, setFiles, onRemoveExisting }: BoardAttachFileProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    const { valid, message, filtered } = validateFiles(selectedFiles);

    if (!valid) {
      alert(message);
      if (filtered.length === 0) return;
    }

    setFiles((prev) => [...prev, ...filtered]);
    e.target.value = ''; // 동일 파일 다시 선택 가능하게 초기화
  };

  const handleRemove = (file: PreviewFile) => {
    if ('id' in file) {
      // 🔥 서버 파일 → 반드시 id 기준으로 삭제
      onRemoveExisting?.(file.id);

      setFiles((prev) => prev.filter((f) => !('id' in f && f.id === file.id)));
    } else {
      // 🔥 새 파일 → 이름 + 사이즈로 정확한 파일만 제거
      setFiles((prev) => prev.filter((f) => !(f instanceof File && f.name === file.name && f.size === file.size)));
    }
  };

  return (
    <div className="flex gap-1.5">
      <Button type="button" variant="outline" className="[&]:border-primary-blue-500 text-primary-blue-500" onClick={handleAttachFile}>
        {/* <File className="mr-1 size-6" /> */}
        파일 첨부
      </Button>

      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      <div className="flex flex-wrap items-center gap-1.5">
        {files.map((file) => (
          <div key={file.name} className="flex items-center rounded-md border border-gray-300 p-1 pl-4">
            <span className="text-base text-gray-500">{file.name}</span>
            <Button
              type="button"
              variant="svgIcon"
              size="icon"
              onClick={(e) => {
                console.log('button type:', (e.target as HTMLButtonElement).type);
                e.preventDefault();
                e.stopPropagation();
                handleRemove(file);
              }}>
              <CircleX className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
