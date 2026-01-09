// src/api/office/book/index.ts
import { http } from '@/lib/http';
import type { TeamDto } from '@/api/teams';
import { getTeams } from '@/api/teams';

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
  team_name?: string;
}

//변환기 DTO -> 도메인
export function toItBook(dto: BookDTO): Book {
  return {
    id: dto.bw_seq,
    user: dto.b_user_id ?? '',
    user_name: dto.b_user_name ?? '',
    team_id: Number(dto.b_team_id ?? 0),
    title: dto.b_title ?? '',
    category: dto.b_category ?? '',
    author: dto.b_author ?? '',
    publish: dto.b_publish ?? '',
    buylink: dto.b_buylink ?? '',
    createdAt: dto.b_date ?? '',
    purchaseAt: dto.b_buy_date ?? '',
    comment: dto.b_comment ?? '',
    status: dto.b_status ?? '',
  };
}

//도서 목록
export async function getBookList(
  page = 1,
  size = 10,
  q?: string
): Promise<{ items: Book[]; total: number; page: number; size: number; pages: number }> {
  const query = q && q.trim() ? `&q=${encodeURIComponent(q)}` : '';

  // ✅ 서버 pagination 그대로 사용
  const dto = await http<{
    items: BookDTO[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }>(`/user/office/book/list?page=${page}&size=${size}${query}`, {
    method: 'GET',
  });

  const teams = await getTeams();

  // ✅ 서버에서 이미 pagination 된 items 그대로 사용
  /* const items = dto.items
    .filter((item) => (item.b_status ?? '').trim() === '완료')
    .map((item) => {
      const book = toItBook(item);
      const matchedTeam = teams.find((t) => Number(t.team_id) === Number(book.team_id));

      return {
        ...book,
        team_name: matchedTeam ? matchedTeam.team_name : '소속없음',
      };
    }); */
  const items = dto.items.map((item) => {
    const book = toItBook(item);
    const matchedTeam = teams.find((t) => Number(t.team_id) === Number(book.team_id));

    return {
      ...book,
      team_name: matchedTeam ? matchedTeam.team_name : '소속없음',
    };
  });

  return {
    items,
    total: dto.total,
    page: dto.page,
    size: dto.size,
    pages: dto.pages,
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
    `/user/office/book/list?page=1&size=9999${query}`,
    { method: 'GET' }
  );

  const filtered = dto.items.filter((item) => item.b_buylink && item.b_buylink.trim() !== '');
  const startIdx = (page - 1) * size;
  const pagedItems = filtered.slice(startIdx, startIdx + size);

  const teams = await getTeams();
  const items = pagedItems.map((item) => {
    const book = toItBook(item);
    const matchedTeam = teams.find((t) => Number(t.team_id) === Number(book.team_id));

    return {
      ...book,
      team_name: matchedTeam ? matchedTeam.team_name : '소속없음',
    };
  });

  return {
    items,
    total: filtered.length,
    page,
    size,
    pages: Math.ceil(filtered.length / size),
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
export async function completeBook(bw_seq: number) {
  const res = await http<{ ok: boolean; bw_seq: number; old_status: string; new_status: string }>(`/user/office/book/complete/${bw_seq}`, {
    method: 'PATCH',
  });
  return res;
}

// 도서 수정용 타입
export interface BookUpdatePayload {
  b_title: string;
  b_category: string;
  b_author: string;
  b_publish: string;
  b_buylink?: string;
  b_date?: string;
}

//신청도서 수정
export async function updateBook(bw_seq: number, data: BookUpdatePayload): Promise<{ ok: boolean }> {
  const res = await http<{ ok: boolean }>(`/user/office/book/update/${bw_seq}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

// 신청 도서 삭제
export async function deleteBook(bw_seq: number): Promise<{ ok: boolean }> {
  const res = await http<{ ok: boolean }>('/user/office/book/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bw_seq }),
  });
  return res;
}
