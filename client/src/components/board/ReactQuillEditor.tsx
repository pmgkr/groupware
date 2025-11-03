// ReactQuillEditor.tsx
import { useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';
import { uploadEditorImage } from '@/api/office/notice';

Quill.register('modules/imageResize', ImageResize);

interface ReactQuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ReactQuillEditor({ value, onChange }: ReactQuillEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  // 이미지 업로드 핸들러
  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하만 업로드 가능합니다.');
        return;
      }

      try {
        // 로딩 표시
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection();

        // 이미지 업로드
        const imageUrl = await uploadEditorImage(file, 'notice');

        // 에디터에 이미지 삽입
        if (editor && range) {
          editor.insertEmbed(range.index, 'image', imageUrl);
          editor.setSelection(range.index + 1, 0);
        }
      } catch (error) {
        console.error('❌ 이미지 업로드 실패:', error);
        alert('이미지 업로드에 실패했습니다.');
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: imageHandler, //커스텀 이미지 핸들러
        },
      },
      imageResize: {
        parchment: Quill.import('parchment'),
        modules: ['Resize', 'DisplaySize', 'Toolbar'],
      },
    }),
    []
  );

  const formats = [
    'header',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'code-block',
    'list',
    'indent',
    'link',
    'image',
    'color',
    'background',
    'align',
    'width',
    'height',
    'style',
  ];

  return (
    <div style={{ height: '58vh' }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        style={{ height: '460px' }}
        placeholder="여기에 입력하세요..."
      />
    </div>
  );
}
