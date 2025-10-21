import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@components/ui/button';
import { Close, Upload } from '@/assets/images/icons';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import type { PreviewFile } from './UploadArea';

type Props = {
  control: any;
  name: string;
  rowIndex: number;
  files?: PreviewFile[];
  onDropFiles?: (files: PreviewFile[], fieldName: string, rowIndex: number | null) => void;
  onUploadFiles?: (files: PreviewFile[], rowIndex: number | null) => void;
  activeFile?: string | null;
  setActiveFile?: (name: string | null) => void;
};

export function AttachmentField({ control, name, rowIndex, files = [], onDropFiles, onUploadFiles, activeFile, setActiveFile }: Props) {
  const [attachments, setAttachments] = useState<PreviewFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false); // drag 상태
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

  /** Drop from UploadArea */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const droppedFiles = JSON.parse(data) as PreviewFile[];
    setAttachments((prev) => {
      const uniqueFiles = droppedFiles.filter((file) => !prev.some((f) => f.name === file.name));
      const newFiles = [...prev, ...uniqueFiles];

      // ExpenseRegister로 전달됨 (rowIndex 포함)
      setTimeout(() => {
        onDropFiles?.(newFiles, name, rowIndex);
      }, 0);

      return newFiles;
    });
  };

  /** Direct upload */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []).map((file) => ({
      name: file.name,
      type: file.type,
      preview: URL.createObjectURL(file),
    })) as PreviewFile[];

    setAttachments((prev) => [...prev, ...uploaded]);
    onUploadFiles?.(uploaded, rowIndex);
  };

  /** Delete */
  const handleRemove = (fileName: string, field: any) => {
    const updated = attachments.filter((f) => f.name !== fileName);
    setAttachments(updated);
    field.onChange(updated);

    setTimeout(() => {
      onDropFiles?.([{ name: fileName, type: '', preview: '' }], name, null);
    }, 0);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex h-full flex-col">
          <div className="flex h-6 justify-between">
            <FormLabel className="gap-.5 font-bold text-gray-950">증빙자료 #{rowIndex}</FormLabel>
          </div>
          <FormControl>
            <div
              ref={fieldRef}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setIsDragOver(true)}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                setIsDragOver(false);
                handleDrop(e);
              }}
              className="min-h-[140px]">
              <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

              {attachments.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex h-full w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-400 p-2',
                    isDragOver && 'bg-primary-blue-100/30'
                  )}>
                  <p className="text-sm text-gray-500">증빙자료 업로드 영역</p>
                </div>
              ) : (
                <div className="flex h-full w-full gap-2 overflow-x-auto p-2">
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
                            handleRemove(file.name, field);
                          }}
                          className="absolute top-0 right-0 size-4 rounded-none bg-gray-600/80 text-white hover:bg-gray-700">
                          <Close className="size-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
