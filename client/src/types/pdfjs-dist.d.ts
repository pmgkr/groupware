// ✅ pdfjs-dist 타입 선언 보완 파일
// src/types/pdfjs-dist.d.ts

declare module 'pdfjs-dist' {
  /** PDF.js의 Document 인터페이스 */
  export interface PDFPageProxy {
    getViewport(params: { scale: number }): { width: number; height: number };
    render(params: { canvasContext: CanvasRenderingContext2D; viewport: any; canvas: HTMLCanvasElement }): { promise: Promise<void> };
  }

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface GlobalWorkerOptionsType {
    workerSrc: string;
  }

  export const GlobalWorkerOptions: GlobalWorkerOptionsType;

  export function getDocument(params: { data: ArrayBuffer }): { promise: Promise<PDFDocumentProxy> };
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs' {
  const worker: string;
  export default worker;
}
