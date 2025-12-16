import { uploadFilesToServer } from '@/api/common';
import { http } from '@/lib/http';
import { validateFiles } from '@/utils';

export type BoardDTO = {
  n_seq: number;
  category: string;
  title: string;
  content: string;
  user_name: string;
  user_id: string;
  v_count: number;
  reg_date: string;
  pinned?: string;
};

//게시글 리스트
export type BoardListResponse = {
  items: BoardDTO[];
  total: number;
  page: number;
};

//페이지 네이션
export async function getBoardList(page = 1, size = 10, q?: string) {
  const query = q && q.trim() ? `&q=${encodeURIComponent(q)}` : '';
  return http<BoardListResponse>(`/user/office/notice/list?page=${page}&size=${size}${query}`, {
    method: 'GET',
  });
}

//게시글 상세보기
export async function getBoardDetail(n_seq: number) {
  const res = await http<any>(`/user/office/notice/info/${n_seq}`, { method: 'GET' });

  // 서버 구조에 맞게 data 혹은 그대로 반환
  if (res?.data) return res.data;
  return res; // post가 아니라 res를 반환해야 함
}

// 게시글 등록
export async function registerBoard(data: { category: string; title: string; content: string; user_id: string; user_name: string }) {
  // 반환 타입 명시: { n_seq: number }
  return http<{ n_seq: number }>(`/user/office/notice/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// 게시글 고정
export async function pinBoard(n_seq: number, flag: 'Y' | 'N') {
  return http(`/user/office/notice/pin/${n_seq}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin_flag: flag }),
  });
}

// 게시글 수정
export async function updateBoard(n_seq: number, data: any) {
  return http(`/user/office/notice/update/${n_seq}`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// 게시글 삭제
export async function deactivateBoard(n_seq: number) {
  return http(`/user/office/notice/activate/${n_seq}`, {
    method: 'PUT',
    body: JSON.stringify({ display_flag: 'N' }), //비활성화
  });
}

//댓글 데이터 타입
export type CommentDTO = {
  bc_seq: number;
  n_seq: number;
  postId: number;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
};

// 댓글 목록
export async function getComment(n_seq: number) {
  const res = await http<{ items: CommentDTO[] }>(`/user/office/notice/comment/${n_seq}`, {
    method: 'GET',
  });
  // res.items가 없으면 빈 배열 반환
  return Array.isArray(res.items) ? res.items : [];
}

//댓글 등록
export async function registerComment(data: { n_seq: number; user_id: string; user_name: string; comment: string }) {
  return http<{ id: number }>(`/user/office/notice/comment/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

//댓글 삭제
export async function removeComment(bc_seq: number) {
  return http(`/user/office/notice/comment/remove/${bc_seq}`, {
    method: 'DELETE',
  });
}

// 댓글 수정
export async function editComment(bc_seq: number, data: { comment: string }) {
  return http(`/user/office/notice/comment/patch/${bc_seq}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// 공지사항 첨부파일
/**
 * 공지사항 첨부파일 업로드 + DB 등록 통합 처리
 * @param n_seq 게시글 번호
 * @param files 첨부할 File 배열
 * @param subdir 업로드 폴더명 (기본값 'notice')
 */
export async function uploadNoticeAttachments(n_seq: number, files: File[], subdir = 'notice') {
  if (!files.length) return [];

  const uploaded = await uploadFilesToServer(files, subdir);

  for (const f of uploaded) {
    const ext = f.fname?.split('.').pop()?.toLowerCase() || '';
    await http('/user/office/notice/attachment/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        n_seq,
        f_name: f.fname,
        nf_name: f.url,
        f_type: ext,
        subdir: f.subdir,
      }),
    });
  }

  return uploaded;
}

// 첨부파일 가져오기
export interface AttachmentDTO {
  f_seq: number;
  n_seq: number;
  f_name: string; // 원본 파일명
  nf_name: string; // 서버 저장 파일명
  f_type: string;
  reg_date: string;
}
export interface Attachment {
  id: number;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

//공지사항 첨부파일 목록 조회
export async function getNoticeAttachments(n_seq: number): Promise<Attachment[]> {
  const dto = await http<any>(`/user/office/notice/attachment/${n_seq}`, { method: 'GET' });
  console.log('📎 첨부파일 API 응답:', dto);

  // 서버가 { items: [...] } 형태로 응답할 때 처리
  const files = Array.isArray(dto) ? dto : Array.isArray(dto.items) ? dto.items : dto.data && Array.isArray(dto.data) ? dto.data : [];

  return files.map((f: any) => ({
    id: f.idx,
    name: f.f_name,
    type: f.f_type,
    createdAt: f.reg_date,
    url: f.nf_name,
  }));
}

//첨부파일 삭제
export async function deleteNoticeAttachment(id: number) {
  return await http(`/user/office/notice/attachment/remove/${id}`, {
    method: 'DELETE',
  });
}

//에디터 내 이미지 처리
export async function uploadEditorImage(file: File, subdir = 'notice'): Promise<string> {
  const uploaded = await uploadFilesToServer([file], subdir);

  if (uploaded.length === 0) {
    throw new Error('이미지 업로드 실패');
  }

  // 업로드된 이미지 URL 반환
  return uploaded[0].url;
}
