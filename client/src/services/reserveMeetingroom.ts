// src/services/reservationService.ts
export type Room = { id: string; name: string; capacity?: number; color?: string; floor?: string };
export type Reservation = {
  id: string;
  roomId: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  createdByName?: string | null;
};

export interface IRoomReservationService {
  listRooms(): Promise<Room[]>;
  listReservations(roomId: string, dateISOyyyyMMdd: string): Promise<Reservation[]>;
  /** 추가: 특정 날짜의 모든 회의실 예약을 한 번에 */
  listReservationsAll(dateISOyyyyMMdd: string): Promise<Record<string, Reservation[]>>;
  createReservation(roomId: string, payload: { title: string; start: string; end: string }): Promise<Reservation>;
}

export const USE_LOCAL_MOCK = true;

// (ApiReservationService는 필요시 아래처럼 구현)
// class ApiReservationService implements IRoomReservationService { ... }

export function createReservationService(localImpl: IRoomReservationService): IRoomReservationService {
  return USE_LOCAL_MOCK ? localImpl : /* new ApiReservationService() */ localImpl;
}
