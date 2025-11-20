// src/utils/fileValidator.ts
export function validateFiles(
  files: File[],
  options?: {
    maxSizeMB?: number; // 기본 10MB
    allow?: string; // allow=".pdf,.docx" 같은 문자열로 확장자 전달
  }
) {
  const maxSizeMB = options?.maxSizeMB ?? 10;

  // ---------------------------------------------
  // 1) 기본 허용 확장자
  // ---------------------------------------------
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    hwp: 'application/x-hwp',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };

  const defaultExts = Object.keys(mimeMap);

  // ---------------------------------------------
  // 2) allow 옵션이 들어온 경우 → 확장자 추출
  // ---------------------------------------------
  let allowedExts = defaultExts; // 기본값

  if (options?.allow) {
    // ".pdf", ".zip", ".docx" 형태만 추출
    const extRegex = /\.([a-zA-Z0-9]+)\b/g;

    const extracted = Array.from(options.allow.matchAll(extRegex)).map((m) => m[1].toLowerCase());

    if (extracted.length > 0) {
      allowedExts = Array.from(new Set(extracted));
    }
  }

  // ---------------------------------------------
  // 3) 파일 검증
  // ---------------------------------------------
  const invalidFiles: string[] = [];
  const filtered: (File & { ext: string })[] = [];
  let msg = '';

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const sizeMB = file.size / (1024 * 1024);

    // 확장자 검사
    if (!ext || !allowedExts.includes(ext)) {
      invalidFiles.push(`${file.name} (허용되지 않은 확장자)`);
      msg = `해당 파일은 허용되지 않은 확장자입니다.`;
      continue;
    }

    // 용량 검사
    if (sizeMB > maxSizeMB) {
      invalidFiles.push(`${file.name} (${sizeMB.toFixed(1)}MB > ${maxSizeMB}MB)`);
      msg = `${maxSizeMB}MB 이하의 파일만 업로드 가능합니다.`;
      continue;
    }

    filtered.push(Object.assign(file, { ext }));
  }

  if (invalidFiles.length > 0) {
    return {
      valid: false,
      message: msg,
      filtered,
    };
  }

  return { valid: true, filtered };
}
