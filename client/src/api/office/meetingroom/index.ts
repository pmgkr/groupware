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
  id: string;
  roomId: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  createdBy?: string | null;
};

export interface ReservationService {
  listRooms(): Promise<Room[]>;
  /** YYYY-MM-DD(KST) 기준으로 겹치는 예약을 roomId별로 반환 */
  listReservationsAll(dateStr: string): Promise<Record<string, Reservation[]>>;
  createReservation(roomId: string, payload: { title: string; start: string; end: string }): Promise<Reservation>;
}

export class HttpReservationService implements ReservationService {
  /* 예약 현황 가져오기 */
  async listRooms(): Promise<Room[]> {
    return http<Room[]>('rooms');
  }

  async listReservationsAll(dateStr: string): Promise<Record<string, Reservation[]>> {
    const data = await http<Reservation[] | Record<string, Reservation[]>>(`reservations?date=${encodeURIComponent(dateStr)}`);
    if (!Array.isArray(data)) return data;
    // 서버가 배열로 주면 여기서 roomId로 그룹핑
    return data.reduce<Record<string, Reservation[]>>((acc, it) => {
      (acc[it.roomId] ||= []).push(it);
      return acc;
    }, {});
  }

  async createReservation(roomId: string, payload: { title: string; start: string; end: string }): Promise<Reservation> {
    return http<Reservation>(`rooms/${roomId}/reservations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

/** 동기 팩토리: 환경 변수로 토글, 기본은 HTTP 서비스 */
export function createReservationService(fallback?: ReservationService): ReservationService {
  const useHttp = import.meta.env.VITE_USE_HTTP_SERVICE !== 'false';
  if (useHttp) return new HttpReservationService();
  return fallback ?? new HttpReservationService();
}
