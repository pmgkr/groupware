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
  return http<BoardListResponse>(`/user/notice/list?page=${page}&size=${size}`, {
    method: 'GET',
  });
}

//게시글 상세보기
export async function getBoardDetail(n_seq: number) {
  return http<BoardDTO>(`/user/notice/info/${n_seq}`, {
    method: 'GET',
  });
}
