import { http } from '@/lib/http';

type UploadResponse = {
  ok: boolean;
  count: number;
  files: {
    field: string;
    original: string;
    mimetype: string;
    size: number;
    filename: string;
    savedPath: string;
    url: string;
    subdir: string;
  }[];
};

/**
 * 공통 파일 업로드 API : POST /user/common/upload
 * @param files 업로드할 파일 Array
 * @param subdir 업로드 하위 폴더명 입력
 */
export async function uploadFilesToServer(files: File[], subdir: string) {
  if (!files.length) return [];

  const fd = new FormData();
  fd.append('subdir', subdir);
  files.forEach((file) => fd.append('files', file));

  const data = await http<UploadResponse>('/user/common/upload', {
    method: 'POST',
    body: fd,
  });

  if (!data.ok || !data.files) {
    throw new Error('파일 업로드 실패: 응답이 올바르지 않습니다.');
  }

  // 서버 구조를 우리 프로젝트에서 쓰기 편한 형태로 정규화
  return data.files.map((f) => ({
    fname: f.original, // 원본 파일명
    sname: f.filename, // 서버 저장 파일명
    url: f.url, // 접근 가능한 전체 URL
    subdir: f.subdir, // 저장된 하위 디렉토리명
  }));
}
