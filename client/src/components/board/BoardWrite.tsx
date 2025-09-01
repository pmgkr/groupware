import { useRef, useState } from 'react';
import { Checkbox } from '@components/ui/checkbox';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Button } from '@components/ui/button';
import { File, CircleX } from '@/assets/images/icons';
import { useNavigate } from 'react-router';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@components/ui/select';

export default function BoardWrite() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    // 여러 파일 선택 가능하게
    setFiles((prev) => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])]);
    e.target.value = ''; // 같은 파일 선택 시에도 onChange 트리거 되도록 초기화
  };

  const handleRemove = (name: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== name));
  };
  const navigate = useNavigate();
  return (
    <div>
      <div className="mb-2.5 flex justify-between pt-2">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="전체공지">전체공지</SelectItem>
              <SelectItem value="일반">일반</SelectItem>
              <SelectItem value="프로젝트">프로젝트</SelectItem>
              <SelectItem value="복지">복지</SelectItem>
              <SelectItem value="기타">기타</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Checkbox id="exnotice" label="공지 설정"></Checkbox>
      </div>
      <div className="mb-2.5">
        <Input className="h-[55px] [&]:bg-white [&]:text-lg" placeholder="제목을 입력해주세요"></Input>
      </div>

      <Textarea size="board"></Textarea>

      <div className="my-2.5 flex gap-1.5">
        <Button variant="outline" className="[&]:border-primary-blue-500 text-primary-blue-500" onClick={handleButtonClick}>
          <File className="mr-1 size-6" />
          파일 첨부
        </Button>

        {/* 실제 파일 input */}
        <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />

        <div className="flex flex-wrap items-center gap-1.5">
          {files.map((file) => (
            <div key={file.name} className="flex items-center rounded-md border border-gray-300 p-1 pl-4">
              <span className="text-base text-gray-500">{file.name}</span>
              <Button variant="svgIcon" size="icon" aria-label="파일 삭제" onClick={() => handleRemove(file.name)}>
                <CircleX className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-1.5">
        <Button>등록</Button>
        <Button onClick={() => navigate('..')} variant="secondary">
          취소
        </Button>
      </div>
    </div>
  );
}
