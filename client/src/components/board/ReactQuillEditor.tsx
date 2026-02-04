import { useEffect, useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import QuillResizeImage from 'quill-resize-image';
import { uploadEditorImage } from '@/api/office/notice';

// Parchment 가져오기
const Parchment = Quill.import('parchment') as any;

// 이미지 속성 포맷 등록
const ImageFormatAttributesList = ['alt', 'height', 'width', 'style', 'float'];

/* ImageFormatAttributesList.forEach((attrName) => {
  const attributor = new Parchment.Attributor.Style(attrName, attrName, {
    scope: Parchment.Scope.INLINE,
  });
  Quill.register(attributor, true);
}); */

Quill.register('modules/resize', QuillResizeImage);

interface ReactQuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ReactQuillEditor({ value, onChange }: ReactQuillEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하만 업로드 가능합니다.');
        return;
      }

      try {
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection();
        const imageUrl = await uploadEditorImage(file, 'notice');

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
          image: imageHandler,
        },
      },
      resize: {
        locale: {},
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
    'alt',
    'width',
    'height',
    'style',
    'float',
  ];

  return (
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      style={{ height: 'calc(100% - 44px)' }}
      placeholder="여기에 입력하세요..."
    />
  );
}
