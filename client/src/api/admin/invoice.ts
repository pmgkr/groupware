import { http } from '@/lib/http';
import { cleanParams } from '@/utils';
import type { InvoiceDetailItem, InvoiceDetailAttachment } from '@/api/project/invoice';

// 인보이스 리스트 조회용 파라미터 타입
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

export interface InvoiceDetailResponse {
  ok: boolean;
  header: InvoiceListItem;
  body: InvoiceDetailItem[];
  footer: InvoiceDetailAttachment[];
}

// 인보이스 리스트 가져오기
export async function getInvoiceList(params: InvoiceListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ items: InvoiceListItem[]; total: number }>(`/admin/invoice/list?${query}`, { method: 'GET' });

  return res;
}

// 인보이스 상세페이지 조회
export async function getInvoiceDetail(seq: number) {
  if (!seq) throw new Error('seq 누락 : 인보이스를 찾을 수 없음');
  const res = await http<InvoiceDetailResponse>(`/admin/invoice/info/${seq}`, { method: 'GET' });

  return {
    header: res.header,
    items: res.body,
    attachment: res.footer,
  };
}

// 파이낸스 > 인보이스 첨부파일 등록 및 삭제
export type InvoiceAttachment = {
  il_seq: number;
  ia_role: 'user' | 'finance';
  ia_fname: string;
  ia_sname: string;
  ia_url: string;
};

export async function confirmInvoice(payload: { seqs: number[] }): Promise<{ ok: boolean; confirmed_count: number }> {
  return http<{ ok: boolean; confirmed_count: number }>(`/admin/invoice/confirm`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function rejectInvoice(payload: { seq: number; rej_reason?: string }): Promise<{ seq: number; status: string }> {
  const res = http<{ seq: number; status: string }>(`/admin/invoice/reject/`, { method: 'POST', body: JSON.stringify(payload) });

  return res;
}

export async function setInvoiceFile(payload: InvoiceAttachment): Promise<{ ok: boolean; ia_seq: number }> {
  return http<{ ok: boolean; ia_seq: number }>(`/admin/invoice/set/file`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function delInvoiceFile(il_seq: number): Promise<{ ok: boolean; deleted: number }> {
  return http<{ ok: boolean; deleted: number }>(`/admin/invoice/del/file?il_seq=${il_seq}`, { method: 'DELETE' });
}
