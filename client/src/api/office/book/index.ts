// src/api/office/book/index.ts
import { http } from '@/lib/http';

// 타입정의 :  API가 주는 원래 구조
export interface BookDTO {
  bw_seq: number;
  b_user_id: string;
  b_user_name: string;
  b_team_id: number;
  b_title: string;
  b_category: string;
  b_author: string;
  b_publish: string;
  b_buylink: string;
  b_date: string;
  b_comment: string;
  b_status: '신청' | '완료';
  b_buy_date: string;
}

//타입정의 :  프론트
export interface Book {
  id: number;
  user: string;
  user_name: string;
  team_id: number;
  title: string;
  category: string;
  author: string;
  publish: string;
  buylink: string;
  createdAt: string;
  comment: string;
  status: string;
  purchaseAt: string;
}

//변환기 DTO -> 도메인
export function toItBook(dto: BookDTO): Book {
  return {
    id: dto.bw_seq,
    user: dto.b_user_id,
    user_name: dto.b_user_name,
    team_id: dto.b_team_id,
    title: dto.b_title,
    category: dto.b_category,
    author: dto.b_author,
    publish: dto.b_publish,
    buylink: dto.b_buylink,
    createdAt: dto.b_date || '',
    purchaseAt: dto.b_buy_date || '',
    comment: dto.b_comment,
    status: dto.b_status,
  };
}

//도서 목록
export async function getBookList(
  page = 1,
  size = 10,
  q?: string
): Promise<{ items: Book[]; total: number; page: number; size: number; pages: number }> {
  const query = q && q.trim() ? `&q=${encodeURIComponent(q)}` : '';
  const dto = await http<{ items: BookDTO[]; total: number; page: number; size: number; pages: number }>(
    `/user/office/book/list?page=${page}&size=${size}${query}`,
    { method: 'GET' }
  );

  // "완료" 상태만 필터링
  const filtered = dto.items.filter((item) => item.b_status === '완료');
  const items = filtered.map(toItBook);

  // total/pages도 실제 필터링된 데이터 기준으로 계산 (옵션)
  return {
    items,
    total: filtered.length,
    page: dto.page,
    size: dto.size,
    pages: Math.ceil(filtered.length / dto.size),
  };
}

//신청 도서 목록
export async function getBookWishList(
  page = 1,
  size = 10,
  q?: string
): Promise<{ items: Book[]; total: number; page: number; size: number; pages: number }> {
  const query = q && q.trim() ? `&q=${encodeURIComponent(q)}` : '';
  const dto = await http<{ items: BookDTO[]; total: number; page: number; size: number; pages: number }>(
    `/user/office/book/list?page=${page}&size=${size}${query}`,
    { method: 'GET' }
  );

  const filtered = dto.items.filter((item) => item.b_buylink && item.b_buylink.trim() !== '');
  const items = filtered.map(toItBook);

  // total/pages도 실제 필터링된 데이터 기준으로 계산 (옵션)
  return {
    items,
    total: filtered.length,
    page: dto.page,
    size: dto.size,
    pages: Math.ceil(filtered.length / dto.size),
  };
}

//도서신청 타입
export interface BookRegisterPayload {
  b_user_id: string;
  b_user_name: string;
  b_team_id: number;
  b_title: string;
  b_category: string;
  b_author: string;
  b_publish: string;
  b_buylink: string;
  b_date: string;
}

//도서신청 / 도서등록
export async function registerBook(data: BookRegisterPayload): Promise<{ success: boolean; bw_seq?: number }> {
  const res = await http<{ ok: boolean; bw_seq?: number }>('/user/office/book/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return { success: res.ok === true, bw_seq: res.bw_seq };
}

// 신청도서 완료처리
export async function completeBook(bw_seq: number): Promise<{ ok: boolean }> {
  const res = await http<{ ok: boolean }>(`/user/office/book/complete/${bw_seq}`, {
    method: 'PATCH',
  });
  return res;
}
