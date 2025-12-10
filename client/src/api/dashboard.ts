import { http } from '@/lib/http';

// 근무시간
export interface Wlog {
  wlogWeek: {
    user_id: string;
    total_minutes: number; // 총 근무시간
    whour: number; // 총 근무시간 시간
    wmin: number;
  }[];
  wlogToday: {
    stime: string | null;
    etime: string | null;
    c_stime: string | null;
    c_etime: string | null;
  }[];
}

// 휴가정보
export interface Vacation {
  user_id: string;
  user_name: string;
  job_role: string;
  profile_image: string;
  given: number;
  used: number;
  lefts: number;
}

// 알림, 사용X
export interface Notification {
  noti_id: number;
  message: string;
}

// 공지사항
export interface Notice {
  n_seq: number;
  category: string;
  title: string;
  content: string;
  user_name: string;
  user_id: string;
  v_count: number;
  reg_date: string;
  pinned?: string;
  like_count: number;
  board_id: number;
}

// 캘린더
export interface Calendar {
  sch_label: string;
  user_name: string;
  profile_image: string | null;
  sch_sdate?: string; // 시작일 (YYYY-MM-DD)
  sch_edate?: string; // 종료일 (YYYY-MM-DD)
  sch_stime?: string; // 시작시간 (HH:mm:ss)
  sch_etime?: string; // 종료시간 (HH:mm:ss)
  sch_isAllday?: 'Y' | 'N'; // 종일 여부
}

// 회의실
export interface Meetingroom {
  mr_name: string;
  stime: string;
  etime: string;
  title?: string;
}

// 비용
export interface Expense {
  seq: number;
  proejct_id: string;
  exp_id: string; // 비용넘버
  el_type: string;
  el_title: string;
  el_method: string; // PMG, BANK
  el_amount: number; // 세전금액
  el_tax: number; // 세액
  el_total: number; // 최종금액액
  status: string; // Saved, Claimed, Approved, Rejected
  expenseType?: 'nexpense' | 'pexpense'; // 비용 종류 구분
}

export const dashboardApi = {
  // 근무시간
  getWlog: async (): Promise<Wlog> => {
    const response = await http<Wlog>('/dashboard/wlog', {
      method: 'POST',
    });
    return response;
  },

  // 휴가정보
  getVacation: async (v_year: number): Promise<Vacation> => {
    const response = await http<Vacation>(`/dashboard/vacation?v_year=${v_year}`, {
      method: 'POST',
    });
    return response;
  },

  // 알림
  getNotification: async (): Promise<Notification[]> => {
    const response = await http<Notification[]>('/dashboard/notification', {
      method: 'POST',
    });
    return response;
  },

  // 공지사항
  getNotice: async (size?: number): Promise<Notice[]> => {
    const url = size ? `/dashboard/notice?size=${size}` : '/dashboard/notice';
    const response = await http<Notice[]>(url, {
      method: 'GET',
    });
    return response;
  },

  // 캘린더
  getCalendar: async (t_date?: string): Promise<Calendar[]> => {
    const url = t_date ? `/dashboard/calendar?t_date=${t_date}` : '/dashboard/calendar';
    const response = await http<Calendar[]>(url, {
      method: 'GET',
    });
    return response;
  },

  // 회의실
  getMeetingroom: async (): Promise<Meetingroom[]> => {
    const response = await http<Meetingroom[]>('/dashboard/meetingroom', {
      method: 'POST',
    });
    return response;
  },

  // 일반비용 및 프로젝트 비용
  getExpense: async (): Promise<Expense[]> => {
    const response = await http<{ nexpense: Expense[]; pexpense: Expense[] }>('/dashboard/nexpense', {
      method: 'POST',
    });
    // 일반비용과 프로젝트 비용을 합쳐서 반환 (각 항목에 expenseType 추가)
    const nexpense = (response?.nexpense || []).map((expense) => ({ ...expense, expenseType: 'nexpense' as const }));
    const pexpense = (response?.pexpense || []).map((expense) => ({ ...expense, expenseType: 'pexpense' as const }));
    const allExpenses = [...nexpense, ...pexpense];
    return allExpenses;
  },
};
