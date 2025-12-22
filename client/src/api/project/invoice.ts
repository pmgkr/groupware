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
};

// 인보이스 작성 타입 정의
export interface InvoiceRegisterPayload {
  invoice: {
    project_id: string;
    invoice_title: string;
    client_id: number;
    contact_nm: string;
    contact_email: string;
    contact_tel: string | null;
    po_no: string | null;
    idate: string | null;
    invoice_amount: number; // subtotal
    invoice_tax: number; // tax amount
    invoice_total: number; // subtotal + tax
    remark?: string;
  };

  items: {
    ii_title: string;
    ii_amount: number;
    ii_qty: number;
  }[];

  attachments?: {
    ia_role: string;
    ia_fname: string;
    ia_sname: string;
    ia_url: string; // 클라우드 내 실제 URL
  }[];
}

// 인보이스 작성 응답 타입
export interface InvoiceRegisterResponse {
  success: boolean;
  data: {
    seq: number;
    project_id: string;
    invoice_id: string;
  };
}

export type InvoiceDetailItem = InvoiceRegisterPayload['items'][number] & {
  ii_seq: number;
  il_seq: number;
};

export type InvoiceDetailAttachment = NonNullable<InvoiceRegisterPayload['attachments']>[number] & {
  ia_seq: number;
  il_seq: number;
  ia_role?: 'user' | 'finance';
  ia_fname?: string;
  ia_sname?: string;
  ia_url?: string;
  uploader: string;
};

export interface InvoiceDetailDTO {
  header: InvoiceListItem;
  items: InvoiceDetailItem[];
  attachment: InvoiceDetailAttachment[];
}

export interface InvoiceDetailResponse {
  success: boolean;
  data: InvoiceDetailDTO;
}

// 인보이스 리스트 가져오기
export async function getInvoiceList(project_id: string, params: InvoiceListParams) {
  const clean = cleanParams(params);

  // 쿼리스트링으로 변환
  const query = new URLSearchParams(clean as Record<string, string>).toString();
  const res = await http<{ list: InvoiceListItem[]; total: number }>(`/user/invoice/list/${project_id}?${query}`, { method: 'GET' });

  return res;
}

// 인보이스 작성하기
export async function invoiceRegister(payload: InvoiceRegisterPayload) {
  return http<InvoiceRegisterResponse>(`/user/invoice/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 인보이스 상세보기
export async function getInvoiceDetail(seq: number) {
  if (!seq) throw new Error('seq 누락 : 인보이스를 찾을 수 없음');
  return http<InvoiceDetailResponse>(`/user/invoice/info/${seq}`, { method: 'GET' });
}
