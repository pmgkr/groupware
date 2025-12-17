import { http } from '@/lib/http';
import { cleanParams } from '@/utils';

// 프로젝트 리스트 조회용 파라미터 타입
export type InvoiceListParams = {
  page?: number;
  size?: number;
  invoice_status?: string;
  q?: string; // 검색 키워드 (user_nm, contact_nm, invoice_title)
};

export type InvoiceListItem = {
  seq: number;
  project_id: string;
  invoice_id: string;
  invoice_title: string;
  project_title: string;
  client_nm: string;
  client_id: number;
  user_id: string;
  user_nm: string;
  contact_nm?: string;
  contact_email?: string;
  contact_tel?: string;
  po_no?: string;
  idate: string;
  invoice_amount: number | string;
  invoice_tax: number | string;
  invoice_total: number | string;
  invoice_status: string;
  remark: string;
  wdate: string;
  rej_reason?: string | null;
  attachments: InvoiceAttachment[];
};

// 인보이스 리스트 가져오기
export async function getInvoiceList(params: InvoiceListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: InvoiceListItem[]; total: number }>(`/admin/invoice/list?${query}`, { method: 'GET' });

  return res;
}

// 파이낸스 > 인보이스 첨부파일 등록 및 삭제
export type InvoiceAttachment = {
  il_seq: number;
  ia_role: 'finance';
  ia_fname: string;
  ia_sname: string;
  ia_url: string;
};

export async function setInvoiceFile(payload: InvoiceAttachment): Promise<{ ok: boolean; ia_seq: number }> {
  return http<{ ok: boolean; ia_seq: number }>(`/admin/invoice/set/file`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function delInvoiceFile(il_seq: number): Promise<{ ok: boolean; deleted: number }> {
  return http<{ ok: boolean; deleted: number }>(`/admin/invoice/del/file?il_seq=${il_seq}`, { method: 'DELETE' });
}
