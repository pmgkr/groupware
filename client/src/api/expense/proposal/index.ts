// expense/proposal
import { http } from '@/lib/http';

/* export interface ReportCard {
  id: number;
  report_num: string;
  category: '교육비' | '구매요청' | '일반비용' | '프로젝트';
  state: '대기' | '진행' | '완료' | '반려';
  title: string;
  content: string;
  price: number;
  team: string;
  user: string;
  date: string;
} */
/** 기안서 본문 정보 */
export interface ReportDTO {
  rp_seq: number;
  rp_user_id: string;
  rp_user_name: string;
  rp_category: string;
  rp_title: string;
  rp_state: string;
  rp_date: string; // ISO
  rp_cost: number;
  rp_project_type: string;
  rp_expense_no: string;
  team_id: number;
  team_name: string;
  manager_id: string;
  manager_name: string;
}

/** 결재선 라인 */
export interface ReportLineDTO {
  rl_seq: number;
  rp_seq: number;
  rl_approver_id: string;
  rl_approver_name: string;
  rl_order: number;
  rl_state: string; // '대기' | '진행' | '승인' | '반려'
  rl_decided_at: string;
  rl_sign_sname: string;
}

/** 참조자 */
export interface ReportRefDTO {
  rr_seq: number;
  rp_seq: number;
  rr_user_id: string;
  rr_user_name: string;
}

/** 파일 */
export interface ReportFileDTO {
  rf_seq: number;
  rp_seq: number;
  rf_name: string;
  rf_type: string;
  rf_uploaded_at: string;
}

/** 전체 VIEW API 응답 */
export interface ReportInfoResponse {
  report: ReportDTO;
  lines: ReportLineDTO[];
  refs: ReportRefDTO[];
  files: ReportFileDTO[];
}

/** 리스트에서 사용할 카드 */
export interface ReportCard {
  id: number;
  report_num: string;
  category: string;
  state: string;
  title: string;
  content?: string;
  price: number;
  team: string;
  team_name: string;
  user: string;
  user_id: string;
  date: string;
  rp_user_name: string;
}

export async function getReportList(): Promise<ReportCard[]> {
  const res = await http<any>('/user/office/report/list', { method: 'GET' });

  const rawItems = res.items ?? [];

  return rawItems.map((item: any) => ({
    id: item.rp_seq,
    report_num: item.rp_expense_no ?? '',
    category: item.rp_category,
    title: item.rp_title,
    state: item.rp_state,
    date: item.rp_date,
    price: item.rp_cost,
    team: item.team_name,
    user: item.rp_user_name,
    user_id: item.rp_user_id,
  }));
}

//view
export const getReportInfo = async (rp_seq: string): Promise<ReportInfoResponse> => {
  return await http(`/user/office/report/info/${rp_seq}`, {
    method: 'GET',
  });
};
//문서번호
export function generateReportNumber(category: string, rp_seq: number) {
  const year = new Date().getFullYear().toString().slice(2, 4);
  const categoryCode = category === '프로젝트' ? 'P' : 'N';
  return `${year}-${categoryCode}-${rp_seq}`;
}

//register
export interface ReportRegisterPayload {
  category: string;
  title: string;
  price: number; // 숫자로 전송
  content: string;
  files: File[]; // multipart 업로드
}

// 등록 API
export async function registerReport(payload: any) {
  return await http('/user/office/report/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
