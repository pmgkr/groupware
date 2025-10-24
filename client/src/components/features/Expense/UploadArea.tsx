import { useCallback, forwardRef, useImperativeHandle, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import 'pdfjs-dist/legacy/build/pdf.worker.min.mjs';
import { Button } from '@components/ui/button';
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

/* ✅ 개별 썸네일 카드 컴포넌트 */
const FileCard = memo(
  ({
    file,
    rowLinked,
    isLinkedActive,
    isSelected,
    onToggle,
    onRemove,
    onDragStart,
    onDragEnd,
  }: {
    file: PreviewFile;
    rowLinked: number | null;
    isLinkedActive: boolean;
    isSelected: boolean;
    onToggle: () => void;
    onRemove: () => void;
    onDragStart: (e: React.DragEvent<HTMLImageElement>) => void;
    onDragEnd: () => void;
  }) => {
    return (
      <div
        key={file.name}
        className={cn(
          'relative aspect-[1/1.4] w-[calc(33.33%-var(--spacing)*2.667)] overflow-hidden rounded-md transition-all',
          isLinkedActive && 'ring-primary-blue-300 ring-2',
          isSelected && 'ring-primary-blue-500 cursor-pointer ring-2'
        )}
        onClick={onToggle}>
        <div className="relative h-full w-full overflow-hidden">
          <img
            src={file.preview}
            alt={file.name}
            draggable={isSelected}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="absolute top-0 left-0 w-[350%] max-w-none translate-x-[-12.5%] translate-y-[-2.5%]"
          />
        </div>

        <div className="absolute bottom-0 flex h-6.5 w-full items-center justify-between bg-gray-700/50 px-1 text-xs text-white">
          <div>{rowLinked ? `증빙자료 #${rowLinked}` : ''}</div>
          <div className="flex gap-0.5">
            <Button
              type="button"
              variant="svgIcon"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="size-5">
              <Delete />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

FileCard.displayName = 'FileCard';

export const UploadArea = forwardRef<UploadAreaHandle, UploadAreaProps>(
  ({ files, setFiles, onFilesChange, linkedRows, activeFile, setActiveFile }, ref) => {
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    // PDF 이미지 분할
    const splitPdfToImages = async (file: File): Promise<PreviewFile[]> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf: PDFDocumentProxy = await getDocument({ data: arrayBuffer }).promise;
      const allImages: PreviewFile[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        const halfWidth = canvas.width / 2;
        const crop = (x: number) => {
          const temp = document.createElement('canvas');
          const tctx = temp.getContext('2d')!;
          temp.width = halfWidth;
          temp.height = canvas.height;
          tctx.drawImage(canvas, x, 0, halfWidth, canvas.height, 0, 0, halfWidth, canvas.height);
          return temp.toDataURL('image/png');
        };

        allImages.push({ name: `${file.name}_${pageNum}_l.png`, type: 'image/png', preview: crop(0) });
        allImages.push({ name: `${file.name}_${pageNum}_r.png`, type: 'image/png', preview: crop(halfWidth) });
      }

      return allImages;
    };

    const onDrop = useCallback(
      async (acceptedFiles: File[]) => {
        const newFiles: PreviewFile[] = [];
        for (const file of acceptedFiles) {
          if (file.type === 'application/pdf') {
            try {
              newFiles.push(...(await splitPdfToImages(file)));
            } catch (err) {
              console.error('PDF 렌더링 실패:', err);
            }
          } else {
            newFiles.push({
              name: file.name,
              type: file.type,
              preview: URL.createObjectURL(file),
            });
          }
        }

        const updated = [...files, ...newFiles];
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
        const updated = files.filter((f) => !selectedFiles.includes(f.name));
        setFiles(updated);
        onFilesChange?.(updated);
        setSelectedFiles([]);
      },
      deleteAllFiles: () => {
        setFiles([]);
        onFilesChange?.([]);
        setSelectedFiles([]);
      },
    }));

    const toggleSelect = (name: string) => {
      setSelectedFiles((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
      setActiveFile?.(name);
    };

    const removeFile = (name: string) => {
      const updated = files.filter((f) => f.name !== name);
      setFiles(updated);
      onFilesChange?.(updated);
      setSelectedFiles((prev) => prev.filter((n) => n !== name));
    };

    return (
      <div
        className={cn(
          'h-full w-full flex-1 overflow-y-auto rounded-md transition-colors',
          isDragActive ? 'bg-primary-blue-500/10' : 'bg-gray-400/30'
        )}>
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
              const isSelected = selectedFiles.includes(file.name);

              return (
                <FileCard
                  key={file.name}
                  file={file}
                  rowLinked={rowLinked}
                  isLinkedActive={isLinkedActive}
                  isSelected={isSelected}
                  onToggle={() => toggleSelect(file.name)}
                  onRemove={() => removeFile(file.name)}
                  onDragStart={(e) => {
                    if (!isSelected) {
                      e.preventDefault();
                      return;
                    }
                    const draggedFiles = files.filter((f) => selectedFiles.includes(f.name));
                    e.dataTransfer.setData('application/json', JSON.stringify(draggedFiles));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={() => setSelectedFiles([])}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
