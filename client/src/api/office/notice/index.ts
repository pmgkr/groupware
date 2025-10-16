import { http } from '@/lib/http';

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
export async function getBoardList(page = 1, size = 10) {
  return http<BoardListResponse>(`/user/office/notice/list?page=${page}&size=${size}`, {
    method: 'GET',
  });
}

//게시글 상세보기
export async function getBoardDetail(n_seq: number) {
  return http<BoardDTO>(`/user/office/notice/info/${n_seq}`, {
    method: 'GET',
  });
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
