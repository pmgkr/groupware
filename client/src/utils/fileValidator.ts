// src/utils/fileValidator.ts
export function validateFiles(
  files: File[],
  options?: {
    maxSizeMB?: number;
    allow?: string;
  }
) {
  const maxSizeMB = options?.maxSizeMB ?? 10;

  // ---------------------------------------------------
  // 1) 기본 MIME → 확장자 매핑
  // ---------------------------------------------------
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

  const defaultExts = Object.keys(mimeMap); // ['jpg','jpeg','png',...]

  // ---------------------------------------------------
  // 2) allow 문자열 파싱
  // ---------------------------------------------------
  let allowedExts = [...defaultExts];

  if (options?.allow) {
    const allowStr = options.allow;

    // (1) ".pdf", ".docx" 등 확장자 추출
    const extRegex = /\.([a-zA-Z0-9]+)\b/g;
    const extractedExts = Array.from(allowStr.matchAll(extRegex)).map((m) => m[1].toLowerCase());

    // (2) "image/*" 허용 → mimeMap에서 image/*에 대응하는 모든 확장자 추가
    const allowsImageAll = /image\/\*/.test(allowStr);

    if (allowsImageAll) {
      const imageExts = Object.keys(mimeMap).filter((ext) => mimeMap[ext].startsWith('image/'));
      extractedExts.push(...imageExts);
    }

    // (3) MIME 타입(application/pdf 등) 허용 → 매핑되는 확장자 추가
    const mimeRegex = /(application|image|text|video)\/[a-zA-Z0-9._+-]+/g;
    const mimeMatches = Array.from(allowStr.matchAll(mimeRegex)).map((m) => m[0]);

    mimeMatches.forEach((mime) => {
      const matchedExt = Object.keys(mimeMap).find((ext) => mimeMap[ext] === mime);
      if (matchedExt) extractedExts.push(matchedExt);
    });

    // 추출된 확장자가 있다면 allowedExts 재정의
    if (extractedExts.length > 0) {
      allowedExts = Array.from(new Set(extractedExts));
    }
  }

  // ---------------------------------------------------
  // 3) 파일 검증
  // ---------------------------------------------------
  const invalidFiles: string[] = [];
  const filtered: (File & { ext: string })[] = [];
  let msg = '';

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const sizeMB = file.size / (1024 * 1024);

    // 확장자 체크
    if (!ext || !allowedExts.includes(ext)) {
      invalidFiles.push(`${file.name} : 허용되지 않은 확장자`);
      msg = `해당 파일은 허용되지 않은 확장자입니다.`;
      continue;
    }

    // 용량 체크
    if (sizeMB > maxSizeMB) {
      invalidFiles.push(`${file.name} : ${sizeMB.toFixed(1)}MB > ${maxSizeMB}MB`);
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
