import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { Upload, Delete, Zoom } from '@/assets/images/icons';

export type PreviewFile = {
  name: string;
  type: string;
  preview: string;
};

export type UploadAreaHandle = {
  openFileDialog: () => void;
  deleteSelectedFiles: () => void;
  deleteAllFiles: () => void;
};

type UploadAreaProps = {
  files: PreviewFile[];
  setFiles: React.Dispatch<React.SetStateAction<PreviewFile[]>>;
  onFilesChange?: (files: PreviewFile[]) => void;
  linkedRows?: Record<string, number | null>;
  activeFile?: string | null;
  setActiveFile?: (name: string | null) => void;
};

export const UploadArea = forwardRef<UploadAreaHandle, UploadAreaProps>(
  ({ files, setFiles, onFilesChange, linkedRows, activeFile, setActiveFile }, ref) => {
    const selectedRef = useRef<string[]>([]);

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        const mapped = acceptedFiles.map((file) => ({
          name: file.name,
          type: file.type,
          preview: URL.createObjectURL(file),
        }));
        const updated = [...files, ...mapped];
        setFiles(updated);
        onFilesChange?.(updated);
      },
      [files, setFiles, onFilesChange]
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
      onDrop,
      accept: { 'image/*': [], 'application/pdf': [] },
      multiple: true,
      noClick: files.length > 0,
    });

    useImperativeHandle(ref, () => ({
      openFileDialog: open,
      deleteSelectedFiles: () => {
        const updated = files.filter((f) => !selectedRef.current.includes(f.name));
        setFiles(updated);
        onFilesChange?.(updated);
        selectedRef.current = [];
      },
      deleteAllFiles: () => {
        setFiles([]);
        onFilesChange?.([]);
        selectedRef.current = [];
      },
    }));

    const toggleSelect = (name: string) => {
      const sel = selectedRef.current;
      selectedRef.current = sel.includes(name) ? sel.filter((n) => n !== name) : [...sel, name];
    };

    const removeFile = (name: string) => {
      const updated = files.filter((f) => f.name !== name);
      setFiles(updated);
      onFilesChange?.(updated);
      selectedRef.current = selectedRef.current.filter((n) => n !== name);
    };

    return (
      <div className={`h-full w-full flex-1 overflow-y-auto rounded-md ${isDragActive ? 'bg-primary-blue-500/10' : 'bg-gray-400/30'}`}>
        <input {...getInputProps()} />
        {files.length === 0 ? (
          <div {...getRootProps()} className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4">
            <Upload className="size-15" />
            <p className="text-lg font-bold">매출전표 PDF 파일 혹은 이미지를 이곳에 드래그 해 주세요.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 p-4">
            {files.map((file) => {
              const rowLinked = linkedRows?.[file.name] ?? null;
              const isLinkedActive = activeFile === file.name;
              const isSelected = selectedRef.current.includes(file.name);

              console.log(activeFile);

              return (
                <div
                  key={file.name}
                  className={cn(
                    'relative aspect-[1/1.4] w-[calc(33.33%-var(--spacing)*2.667)] cursor-pointer overflow-hidden rounded-md border transition-all',
                    'border-gray-300 hover:bg-gray-100/50',
                    isLinkedActive && 'ring-primary-blue-300 ring-2',
                    isSelected && 'ring-primary-blue-500 ring-2'
                  )}
                  onClick={() => {
                    toggleSelect(file.name);
                    setActiveFile?.(file.name);
                  }}>
                  <Checkbox className="absolute top-0 left-0 h-0 w-0" />
                  <div className="relative h-full w-full overflow-hidden">
                    <img
                      src={file.preview}
                      alt={file.name}
                      draggable
                      onDragStart={(e) => {
                        const draggedFiles = files.filter((f) => selectedRef.current.includes(f.name));
                        e.dataTransfer.setData('application/json', JSON.stringify(draggedFiles));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onDragEnd={() => (selectedRef.current = [])}
                      className="absolute top-0 left-0 w-[350%] max-w-none translate-x-[-12.5%] translate-y-[-2.5%]"
                    />
                  </div>

                  <div className="absolute bottom-0 flex h-6.5 w-full items-center justify-between bg-gray-700/50 px-1 text-xs text-white">
                    <div>{rowLinked ? `증빙자료 #${rowLinked}` : ''}</div>
                    <div className="flex gap-0.5">
                      <Button variant="svgIcon" size="icon" className="size-5">
                        <Zoom />
                      </Button>
                      <Button
                        variant="svgIcon"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.name);
                        }}
                        className="size-5">
                        <Delete />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
