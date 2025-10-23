import { useRef } from 'react';
import { Button } from '@components/ui/button';
import { File, CircleX } from '@/assets/images/icons';
import { validateFiles } from '@/utils';

export type PreviewFile = File | { id: number; name: string; url: string; size?: number; type?: string };

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
    // 기존 서버 첨부파일이면 콜백 실행
    if ('id' in file && file.id) {
      onRemoveExisting?.(file.id);
    }
    // UI에서 제거
    setFiles((prev) => prev.filter((f) => f.name !== file.name));
    if ('id' in file && file.id) {
      console.log('🧩 삭제 콜백 호출됨, id:', file.id);
      onRemoveExisting?.(file.id);
    } else {
      console.log('⚠️ id 없음:', file);
    }
  };

  return (
    <div className="flex gap-1.5">
      <Button variant="outline" className="[&]:border-primary-blue-500 text-primary-blue-500" onClick={handleAttachFile}>
        <File className="mr-1 size-6" />
        파일 첨부
      </Button>

      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      <div className="flex flex-wrap items-center gap-1.5">
        {files.map((file) => (
          <div key={file.name} className="flex items-center rounded-md border border-gray-300 p-1 pl-4">
            <span className="text-base text-gray-500">{file.name}</span>
            <Button variant="svgIcon" size="icon" onClick={() => handleRemove(file)}>
              <CircleX className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
