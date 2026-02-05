import { useEffect, useMemo, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import QuillResizeImage from 'quill-resize-image';
import { uploadEditorImage } from '@/api/office/notice';
import Delta from 'quill-delta';

const Parchment = Quill.import('parchment') as any;

Quill.register('modules/resize', QuillResizeImage);

interface ReactQuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// base64 문자열을 Blob으로 변환하는 헬퍼 함수
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

export default function ReactQuillEditor({ value, onChange }: ReactQuillEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    // 1️⃣ IMG 태그 차단 (HTML paste)
    editor.clipboard.addMatcher('IMG', () => {
      alert('이미지는 이미지 버튼을 통해 업로드해주세요.');
      return new Delta();
    });

    // 2️⃣ base64 image Delta 차단 + 파일 크기 검증 (동기 처리)
    editor.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      const ops = delta.ops || [];

      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];

        // base64 이미지 감지
        if (
          op.insert &&
          typeof op.insert === 'object' &&
          'image' in op.insert &&
          typeof op.insert.image === 'string' &&
          op.insert.image.startsWith('data:image')
        ) {
          try {
            // base64를 Blob으로 변환하여 크기 체크
            const blob = base64ToBlob(op.insert.image);
            const fileSizeInMB = blob.size / (1024 * 1024);

            if (fileSizeInMB > 5) {
              alert('이미지 크기가 5MB를 초과합니다.\n이미지는 이미지 버튼을 통해 업로드하거나 첨부파일로 등록해주세요.');
              return new Delta(); // 삽입 차단
            }

            // 5MB 이하면 일단 base64로 삽입 허용
            // (나중에 제출 전에 변환하는 방식)
          } catch (error) {
            console.error('❌ base64 파싱 실패:', error);
            alert('이미지 처리에 실패했습니다.');
            return new Delta();
          }
        }
      }

      return delta;
    });

    // 3️⃣ 텍스트 변경 시 base64 이미지를 서버 URL로 변환
    editor.on('text-change', async () => {
      const content = editor.getContents();
      const ops = content.ops || [];
      let hasBase64Image = false;

      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];

        if (
          op.insert &&
          typeof op.insert === 'object' &&
          'image' in op.insert &&
          typeof op.insert.image === 'string' &&
          op.insert.image.startsWith('data:image')
        ) {
          hasBase64Image = true;

          try {
            const blob = base64ToBlob(op.insert.image);
            const file = new File([blob], 'pasted-image.png', { type: blob.type });
            const imageUrl = await uploadEditorImage(file, 'notice');

            // base64를 서버 URL로 교체
            const newDelta = new Delta();
            let currentIndex = 0;

            content.ops?.forEach((o, idx) => {
              if (idx === i) {
                newDelta.retain(currentIndex);
                newDelta.delete(1);
                newDelta.insert({ image: imageUrl });
              } else if (typeof o.insert === 'string') {
                currentIndex += o.insert.length;
              } else {
                currentIndex += 1;
              }
            });

            editor.updateContents(newDelta, 'silent');
            break; // 한 번에 하나씩 처리
          } catch (error) {
            console.error('❌ 이미지 업로드 실패:', error);
            alert('이미지 업로드에 실패했습니다.');

            // 실패한 이미지 제거
            const newDelta = new Delta();
            let currentIndex = 0;

            content.ops?.forEach((o, idx) => {
              if (idx === i) {
                newDelta.retain(currentIndex);
                newDelta.delete(1);
              } else if (typeof o.insert === 'string') {
                currentIndex += o.insert.length;
              } else {
                currentIndex += 1;
              }
            });

            editor.updateContents(newDelta, 'silent');
            break;
          }
        }
      }
    });
  }, []);

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
      style={{ height: '460px' }}
      placeholder="여기에 입력하세요..."
    />
  );
}
