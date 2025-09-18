// src/services/localReservationService.ts
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import type { IRoomReservationService, Reservation, Room } from './reserveMeetingroom';

const ROOMS: Room[] = [
  { id: 'room_singapore', name: 'Singapore Room', capacity: 6, floor: '7F', color: '#2FC05D' },
  { id: 'room_beijing', name: 'Beijing Room', capacity: 10, floor: '7F', color: '#FF6B6B' },
  { id: 'room_sydney', name: 'Sydney Room', capacity: 4, floor: '7F', color: '#6BADFF' },
  { id: 'room_tokyo', name: 'Tokyo Room', capacity: 4, floor: '7F', color: '#FFA46B' },
  { id: 'room_manila', name: 'Manila Room', capacity: 6, floor: '6F', color: '#5E6BFF' },
  { id: 'room_bangkok', name: 'Bangkok Room', capacity: 10, floor: '6F', color: '#DA6BFF' },
];

type Store = Map<string, Reservation[]>; // key = roomId
let idSeq = 1;
const nextId = () => `res-${idSeq++}`;

const iso = (dateYYYYMMDD: string, hhmm: string) => new Date(`${dateYYYYMMDD}T${hhmm}:00`).toISOString();

const overlap = (aS: Date, aE: Date, bS: Date, bE: Date) => aS < bE && aE > bS;
const withinDay = (r: Reservation, dayStart: Date, dayEnd: Date) => {
  const s = parseISO(r.start);
  const e = parseISO(r.end);
  return e > dayStart && s < dayEnd;
};

function seedForDateIfEmpty(store: Store, dateStr: string) {
  const patterns: Array<[string, string, string]> = [
    ['room_singapore', '10:00', '11:30'],
    ['room_singapore', '14:00', '15:00'],
    ['room_manila', '09:00', '10:00'],
    ['room_manila', '16:00', '17:30'],
    ['room_sydney', '13:00', '14:30'],
    ['room_beijing', '11:00', '12:00'],
    ['room_beijing', '15:30', '16:30'],
    ['room_tokyo', '09:30', '10:30'],
    ['room_tokyo', '17:00', '18:30'],
    ['room_bangkok', '10:30', '11:00'],
  ];
  for (const room of ROOMS) {
    const arr = store.get(room.id) ?? [];
    const already = arr.some((r) => format(parseISO(r.start), 'yyyy-MM-dd') === dateStr);
    if (!already) {
      const adds = patterns
        .filter(([rid]) => rid === room.id)
        .map(([, s, e]) => ({
          id: nextId(),
          roomId: room.id,
          title: `${room.name} 예약`,
          start: iso(dateStr, s),
          end: iso(dateStr, e),
        }));
      store.set(room.id, [...arr, ...adds]);
    }
  }
}

export class LocalReservationService implements IRoomReservationService {
  private store: Store = new Map();

  constructor() {
    const today = format(new Date(), 'yyyy-MM-dd');
    seedForDateIfEmpty(this.store, today);
  }

  async listRooms() {
    return ROOMS;
  }

  async listReservations(roomId: string, date: string) {
    seedForDateIfEmpty(this.store, date);
    const arr = this.store.get(roomId) ?? [];
    const dayStart = startOfDay(new Date(`${date}T00:00:00`));
    const dayEnd = endOfDay(dayStart);
    return arr.filter((r) => withinDay(r, dayStart, dayEnd)).sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
  }

  async listReservationsAll(date: string) {
    seedForDateIfEmpty(this.store, date);
    const dayStart = startOfDay(new Date(`${date}T00:00:00`));
    const dayEnd = endOfDay(dayStart);
    const result: Record<string, Reservation[]> = {};
    for (const room of ROOMS) {
      const arr = this.store.get(room.id) ?? [];
      result[room.id] = arr
        .filter((r) => withinDay(r, dayStart, dayEnd))
        .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
    }
    return result;
  }

  async createReservation(roomId: string, payload: { title: string; start: string; end: string }) {
    const { title, start, end } = payload;
    const s = parseISO(start),
      e = parseISO(end);
    if (!(e > s)) throw new Error('종료가 시작보다 이후여야 합니다.');
    const arr = this.store.get(roomId) ?? [];
    for (const r of arr) {
      if (overlap(s, e, parseISO(r.start), parseISO(r.end))) {
        throw new Error(`중복 예약할 수 없습니다. "${r.title}" ${r.start} ~ ${r.end}`);
      }
    }
    const created: Reservation = { id: nextId(), roomId, title: title || '(제목 없음)', start, end };
    this.store.set(roomId, [...arr, created]);
    return created;
  }
}
