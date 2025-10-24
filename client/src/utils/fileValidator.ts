// src/utils/fileValidator.ts

export function validateFiles(
  files: File[],
  options?: {
    maxSizeMB?: number; // 기본 10MB, 필요 시 30MB로 변경 가능
  }
) {
  const maxSizeMB = options?.maxSizeMB ?? 10;

  // 확장자별 MIME 타입 매핑 (참고용)
  const mimeMap: Record<string, string> = {
    // 이미지
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',

    // 문서
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    hwp: 'application/x-hwp',

    // 압축
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };

  const allowedExts = Object.keys(mimeMap);
  const invalidFiles: string[] = [];
  const filtered: (File & { mimetype: string; ext: string })[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const sizeMB = file.size / (1024 * 1024);

    // 확장자 검사
    if (!ext || !allowedExts.includes(ext)) {
      invalidFiles.push(`${file.name} (허용되지 않은 확장자)`);
      continue;
    }

    // 용량 검사
    if (sizeMB > maxSizeMB) {
      invalidFiles.push(`${file.name} (${sizeMB.toFixed(1)}MB > ${maxSizeMB}MB)`);
      continue;
    }

    // MIME 타입 및 확장자 세팅
    const mimetype = mimeMap[ext] ?? 'application/octet-stream';
    const fileWithInfo = Object.assign(file, { mimetype, ext });

    filtered.push(fileWithInfo);
  }

  if (invalidFiles.length > 0) {
    return {
      valid: false,
      message: `다음 파일은 업로드할 수 없습니다:\n${invalidFiles.join('\n')}`,
      filtered,
    };
  }

  return { valid: true, filtered };
}

/* 
**
<예시>
async function handleUpload(selectedFiles: File[]) {
  //기본
  const { valid, message, filtered } = validateFiles(selectedFiles);

 //특정 페이지에서 30MB까지 허용
const res = validateFiles(selectedFiles, { maxSizeMB: 30 });

  if (!valid) {
    alert(message); // 에러메시지 출력
    return;
  }

  // 업로드 진행 (filtered 파일만 전송)
  const uploaded = await uploadFilesToServer(filtered, 'notice');

}

*/
