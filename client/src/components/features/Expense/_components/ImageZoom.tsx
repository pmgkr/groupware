// src/components/common/ImageZoomPreview.tsx
import ReactDOM from 'react-dom';

export function ImageZoomPreview({ src, boundary }: { src: string; boundary: DOMRect }) {
  return ReactDOM.createPortal(
    <div
      className="fixed top-[50%] z-50 flex h-full items-center justify-end pt-22 pb-4"
      style={{
        left: boundary.left,
        width: boundary.width,
        height: '100%',
        transform: 'translateY(-50%)',
      }}>
      <div className="max-h-full max-w-full overflow-hidden border">
        <img src={src} alt="zoom preview" className="h-auto max-h-full w-fit max-w-full" />
      </div>
    </div>,
    document.body
  );
}
