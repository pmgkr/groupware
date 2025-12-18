import { http } from '@/lib/http';
import { cleanParams } from '@/utils';

// 프로젝트 리스트 조회용 파라미터 타입
export type ProjectListParams = {
  year?: string;
  team_id?: number;
  client_id?: number;
  project_status?: string;
  q?: string;
  order?: string; // project_id:desc, exp_amount:asc
  page?: number;
  size?: number;
};

export type ProjectListItem = {
  project_id: string;
  project_title: string;
  project_year: string;
  project_brand: string;
  client_id: number;
  client_nm: string;
  owner_id: string;
  owner_nm: string;
  team_id: number;
  team_name: string;
  project_status: string;
  profile_image: string;
  est_amount: number;
  est_budget: number;
  exp_amount: number;
  inv_amount: number;
  inv_total: number;
  netprofit: number;
  GPM: number;
  sdate: string;
  edate: string;
};

export type ProjectTotal = {
  sum_est_amount: number;
  sum_est_budget: number;
  sum_exp_amount: number;
  sum_inv_amount: number;
  sum_inv_total: number;
  sum_netprofit: number;
  avg_gpm: number;
  count: number;
};

export type ProjectListResponse = {
  year: number;
  items: ProjectListItem[];
  total: number;
  page: number;
  pages: number;
  subtotal: ProjectTotal;
  grandtotal: ProjectTotal;
};

// 프로젝트 리포트 리스트 가져오기
export async function getProjectList(params: ProjectListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<ProjectListResponse>(`/admin/summary/list?${query}`, { method: 'GET' });

  return res;
}
