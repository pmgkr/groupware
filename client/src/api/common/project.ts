// project에 필요한 공통 api
import { http } from '@/lib/http';

export type ClientList = {
  cl_seq: number;
  cl_name: string;
  cl_number: string;
  cl_type: string;
  cl_item: string;
  cl_rep?: string;
  cl_address?: string;
  cl_tel?: string;
  cl_fax?: string;
  cl_remark?: string;
};

// 클라이언트 리스폰 타입 정의
type ClientListResponse = {
  items: ClientList[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

// 클라이언트 리스트 가져오기
export async function getClientList(type?: string): Promise<ClientList[]> {
  const query = type ? `?q=${encodeURIComponent(type)}` : '';
  const res = await http<ClientListResponse>(`/user/common/client${query}`, { method: 'GET' });

  return res.items ?? [];
}
