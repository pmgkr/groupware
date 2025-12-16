// src/components/proposal/ProposalAttachFiles.tsx
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { File, CircleX, Download } from 'lucide-react';

type UploadFile = File;

type ViewFile = {
  name: string;
  url: string;
  createdAt?: string;
};

interface Props {
  mode: 'upload' | 'view';

  // upload
  files?: UploadFile[];
  onAddFiles?: (files: File[]) => void;
  onRemove?: (index: number) => void; // 🔥 File 대신 index로 변경

  // view
  viewFiles?: ViewFile[];
}

export default function ProposalAttachFiles({ mode, files = [], onAddFiles, onRemove, viewFiles = [] }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !onAddFiles) return;
    onAddFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  /* ---------- download ---------- */

  const handleDownload = (url: string, name?: string) => {
    const a = document.createElement('a');
    a.href = url;
    if (name) a.download = name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex gap-1.5">
      {/* ================= upload UI ================= */}
      {mode === 'upload' && (
        <>
          <Button
            type="button"
            variant="outline"
            className="[&]:border-primary-blue-500 text-primary-blue-500 hover:text-primary-blue"
            onClick={handleAttachFile}>
            <File className="mr-1 size-4" />
            파일 첨부
          </Button>

          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />

          <div className="flex flex-wrap items-center gap-1.5">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center rounded-md border border-gray-300 p-1 pl-4">
                <span className="text-base text-gray-500">{file.name}</span>
                {onRemove && (
                  <Button variant="svgIcon" className="text-gray-500" size="icon" onClick={() => onRemove(index)}>
                    <CircleX className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= view UI  ================= */}
      {mode === 'view' && viewFiles.length > 0 && (
        <div className="w-full border-b border-gray-300 bg-gray-50 p-4 pt-0">
          {viewFiles.map((file, index) => (
            <Button
              key={`${file.url}-${index}`}
              variant="secondary"
              className="hover:bg-primary-blue-100 hover:text-primary-blue-500 mr-2text-sm [&]:border-gray-300 [&]:p-4"
              onClick={() => handleDownload(file.url, file.name)}>
              <div className="flex items-center gap-2">
                <span className="font-normal">{file.name}</span>
                {file.createdAt && <span className="text-xs text-gray-400">{file.createdAt.slice(0, 10)}</span>}
              </div>
              <Download className="size-4" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
