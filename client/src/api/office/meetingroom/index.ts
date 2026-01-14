// src/api/office/meetingroom/index.ts
import { http } from '@/lib/http';

export type Room = {
  id: string;
  name: string;
  floor?: string;
  capacity?: number | null;
  imageUrl?: string | null;
};

export type Reservation = {
  id: number;
  roomId: number;
  user_id: string;
  user_name: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  createdBy?: string | null;
};

/* -------- 매핑 유틸 -------- */
function toRoom(row: any): Room {
  return {
    id: row?.mr_id ?? '',
    name: row?.mr_name ?? '',
    floor: row?.mr_location ?? undefined,
    capacity: row?.mr_capacity ?? null,
    imageUrl: row?.mr_photo ?? null,
  };
}

function toReservation(row: any): Reservation {
  return {
    id: row?.ml_seq ?? '',
    roomId: row?.mr_id ?? '',
    user_id: String(row?.user_id ?? ''),
    user_name: String(row?.user_name ?? ''),
    title: String(row?.ml_title ?? ''),
    start: String(row?.ml_stime ?? ''),
    end: String(row?.ml_etime ?? ''),
    createdBy: row?.ml_created ?? null,
  };
}

/* -------- 서비스 인터페이스 -------- */
export interface ReservationService {
  // 회의실
  listRooms(): Promise<Room[]>;
  getRoom(roomId: string): Promise<Room>;
  createRoom(payload: Partial<Room>): Promise<Room>;
  updateRoom(roomId: string, payload: Partial<Room>): Promise<Room>;
  deleteRoom(roomId: string): Promise<void>;

  // 예약
  /** YYYY-MM-DD(KST) 기준으로 겹치는 예약을 roomId별로 반환 */
  listReservationsAll(dateStr: string): Promise<Record<string, Reservation[]>>;
  /** 회의실 예약 생성 (POST /user/meetingroom/reservation) */
  createReservation(roomId: number, payload: { date: string; title: string; start: string; end: string }): Promise<Reservation>;
  /** 회의실 예약 취소 (DELETE /user/meetingroom/cancle) */
  cancelReservation(reservationId: number): Promise<void>;
}

/* -------- HTTP 구현 -------- */
export class HttpReservationService implements ReservationService {
  /** 회의실 목록: GET /user/meetingroom/list */
  /* async listRooms(): Promise<Room[]> {
    const rows = await http<any[]>('user/meetingroom/list');
    return (rows || []).map(toRoom);
  } */
  async listRooms(): Promise<Room[]> {
    const rows = await http<any[]>('user/meetingroom/list');
    const rooms = (rows || []).map(toRoom);

    // 층별로 정렬 (7F → 6F 순)
    return rooms.sort((a, b) => {
      const floorA = parseInt(a.floor || '0');
      const floorB = parseInt(b.floor || '0');

      // 층 내림차순
      if (floorA !== floorB) return floorB - floorA;

      // 같은 층이면 이름순
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  /** 회의실 정보: GET /user/meetingroom/info/:mr_id */
  async getRoom(roomId: string): Promise<Room> {
    const row = await http<any>(`user/meetingroom/info/${encodeURIComponent(roomId)}`);
    return toRoom(row);
  }

  /** 회의실 생성: POST /user/meetingroom/create (서버가 방 생성도 담당한다면 사용) */
  async createRoom(payload: Partial<Room>): Promise<Room> {
    const body = {
      mr_name: payload.name,
      mr_floor: payload.floor,
      mr_capacity: payload.capacity,
      image_url: payload.imageUrl,
    };
    const row = await http<any>('user/meetingroom/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return toRoom(row);
  }

  /** 회의실 수정: PUT /user/meetingroom/update/:mr_id */
  async updateRoom(roomId: string, payload: Partial<Room>): Promise<Room> {
    const body = {
      mr_name: payload.name,
      mr_floor: payload.floor,
      mr_capacity: payload.capacity,
      image_url: payload.imageUrl,
    };
    const row = await http<any>(`user/meetingroom/update/${encodeURIComponent(roomId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return toRoom(row);
  }

  /** 회의실 삭제: DELETE /user/meetingroom/delete/:mr_id */
  async deleteRoom(roomId: string): Promise<void> {
    await http<void>(`user/meetingroom/delete/${encodeURIComponent(roomId)}`, { method: 'DELETE' });
  }

  /* ---------- 예약 ---------- */

  /**
   * 예약 현황 조회
   * /user/meetingroom/day/YYYY-MM-DD
   */
  async listReservationsAll(dateStr: string): Promise<Record<string, Reservation[]>> {
    const data = await http<Reservation[] | Record<string, Reservation[]>>(`user/meetingroom/day/${encodeURIComponent(dateStr)}`);
    if (!Array.isArray(data)) return data;
    return data.reduce<Record<string, Reservation[]>>((acc, row) => {
      const it = toReservation(row);
      (acc[it.roomId] ||= []).push(it);
      return acc;
    }, {});
  }

  /**
   * 예약 생성 API : POST /user/meetingroom/reservation
   */
  async createReservation(roomId: number, payload: { date: string; title: string; start: string; end: string }): Promise<Reservation> {
    try {
      const row = await http<any>('user/meetingroom/reservation', {
        method: 'POST',
        body: JSON.stringify({
          mr_id: roomId,
          ml_date: payload.date,
          ml_title: payload.title,
          ml_stime: payload.start,
          ml_etime: payload.end,
        }),
      });

      return toReservation(row);
    } catch (err: any) {
      // status 코드만 추출해서 throw
      if (err?.status === 409) {
        throw new Error('OVERLAP');
      }
      throw err;
    }
  }

  async cancelReservation(reservationId: number): Promise<void> {
    return http<void>(`user/meetingroom/cancel/${reservationId}`, { method: 'DELETE' });
  }
}

/** 동기 팩토리 */
export function createReservationService(fallback?: ReservationService): ReservationService {
  const useHttp = import.meta.env.VITE_USE_HTTP_SERVICE !== 'false';
  if (useHttp) return new HttpReservationService();
  return fallback ?? new HttpReservationService();
}
