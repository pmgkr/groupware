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
  manager_state: string;
  finance_state: string;
  gm_state: string;
  approval_user_display_state?: string;
  approval_manager_display_state?: string;
  approval_admin_display_state?: string;
  expense_no?: string;
}

//비용 기안서 매칭
export interface ProposalItem {
  rp_seq: number;
  rp_title: string;
  rp_category: string;
  rp_cost: number;
  rp_date: string;
  rp_user_name: string;
  rp_expense_no: string;
}

function normalize(v: any) {
  return (v || '').toString().trim();
}

function mapUserDisplayState(item: any) {
  const manager = normalize(item.manager_state);
  const finance = normalize(item.finance_state);
  const gm = normalize(item.gm_state);
  const rp = normalize(item.rp_state);

  // 1) 반려 우선
  if (manager === '반려' || finance === '반려' || gm === '반려' || rp === '반려') {
    return '반려';
  }

  // 2) 팀장 단계
  if (manager === '대기') return '팀장대기';
  if (manager !== '완료') return rp; // 진행 or 기타

  // 3) 회계 단계
  if (finance === '대기') return '회계대기';
  if (finance !== '완료') return rp;

  // 4) 대표(GM) 단계
  if (gm === '대기') return 'GM대기';
  if (gm !== '완료') return rp;

  // 5) 모든 단계 완료
  return '승인완료';
}

export async function getReportList(): Promise<ReportCard[]> {
  const res = await http<any>('/user/office/report/list?size=100000', { method: 'GET' });

  const rawItems = res.items ?? [];

  return rawItems.map((item: any) => {
    //  display 상태 생성
    const displayState = mapUserDisplayState(item);

    return {
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
      expense_no: item.rp_expense_no,

      //서버에서 넘어오는 각각의 상태들
      manager_state: item.manager_state,
      finance_state: item.finance_state,
      gm_state: item.gm_state,

      // 리스트 표시용 새로운 상태값 (가장 중요)
      approval_user_display_state: displayState,
      approval_manager_display_state: displayState,
    };
  });
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

//기안서 삭제
export async function deleteReport(rp_seq: string) {
  return await http(`/user/office/report/delete/${rp_seq}`, {
    method: 'DELETE',
  });
}

export interface ProposalListResponse {
  success: boolean;
  items: ProposalItem[];
}

// 기안서 리스트 조회
export async function getProposalList(flag: 'P' | 'N'): Promise<ProposalListResponse> {
  return await http(`/user/office/report/expense/list?flag=${flag}`, {
    method: 'GET',
  });
}
