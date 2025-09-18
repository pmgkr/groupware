// src/pages/MeetingRoomsAllPage.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils';

import { addMinutes, format, setHours, setMinutes, startOfDay, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DayPicker } from '@components/daypicker';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Calendar, LeftArr, More, RightArr } from '@/assets/images/icons';
import { UserRound, Check } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { createReservationService, type Room, type Reservation } from '@/services/reserveMeetingroom';
import { LocalReservationService } from '@/services/localReserve';

const service = createReservationService(new LocalReservationService());

const OPEN_HOUR = 9;
const CLOSE_HOUR = 20;
const SLOT_MINUTES = 30;
const SLOT_COUNT = (CLOSE_HOUR - OPEN_HOUR) * (60 / SLOT_MINUTES);
const ROW_H = 40;
const HEADER_H_CLASS = 'h-48'; // 헤더 고정 높이(12rem)

type Slot = { index: number; start: Date; end: Date; label: string };

function makeSlots(baseDate: Date): Slot[] {
  const dayStart = startOfDay(baseDate);
  const first = setMinutes(setHours(dayStart, OPEN_HOUR), 0);
  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const start = addMinutes(first, i * SLOT_MINUTES);
    const end = addMinutes(start, SLOT_MINUTES);
    return { index: i, start, end, label: format(start, 'HH:mm') };
  });
}
const isoLocal = (d: Date) => new Date(d).toISOString();
const withinDayBounds = (s: Date, e: Date) => {
  const sH = s.getHours() + s.getMinutes() / 60;
  const eH = e.getHours() + e.getMinutes() / 60;
  return sH >= OPEN_HOUR && eH <= CLOSE_HOUR && e > s;
};

function useAllReservations(dateStr: string) {
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [roomResMap, setRoomResMap] = React.useState<Record<string, Reservation[]>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const list = await service.listRooms();
        setRooms(list);
      } catch {
        setRooms([]);
      }
    })();
  }, []);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const map = await service.listReservationsAll(dateStr);
      setRoomResMap(map);
    } catch {
      setError('예약 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return { rooms, roomResMap, refresh, loading, error };
}

type PendingSelection = {
  roomId: string | null;
  start: Date | null;
  end: Date | null;
};

export default function MeetingRoomsAllPage() {
  const [open, setOpen] = React.useState(false);
  const [dateStr, setDateStr] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const date = new Date(`${dateStr}T00:00:00`);
  const slots = React.useMemo(() => makeSlots(date), [date]);

  const { rooms, roomResMap, refresh, loading, error } = useAllReservations(dateStr);

  // 다이얼로그/생성
  const titleRef = React.useRef<HTMLInputElement>(null);
  const roomListRef = React.useRef<HTMLUListElement>(null); // 다이얼로그 내 미팅룸 컨테이너
  const roomItemRefs = React.useRef<Record<string, HTMLLIElement | null>>({});

  const [pending, setPending] = React.useState<PendingSelection | null>(null);
  const [title, setTitle] = React.useState('');

  // 다이얼로그 내 미팅룸 스크롤
  const scrollRoomIntoView = React.useCallback((roomId: string | number) => {
    const list = roomListRef.current;
    const el = roomItemRefs.current[String(roomId)];
    if (!list || !el) return;

    const target = el.offsetLeft - (list.clientWidth - el.clientWidth) / 2;
    list.scrollTo({ left: Math.max(0, target) });
  }, []);

  React.useEffect(() => {
    if (!pending?.roomId) return;
    const id = requestAnimationFrame(() => scrollRoomIntoView(pending.roomId!));
    return () => cancelAnimationFrame(id);
  }, [pending?.roomId, scrollRoomIntoView]);

  async function submitReservation() {
    if (!pending) return;

    const t = titleRef.current?.value?.trim() ?? '';
    setTitle(t);

    if (!pending.roomId) {
      alert('미팅룸을 선택해 주세요.');
      return;
    }
    if (!pending.start || !pending.end) {
      alert('시작/종료 시간을 선택해 주세요.');
      return;
    }
    if (!withinDayBounds(pending.start, pending.end)) {
      alert('운영 시간(09:00~20:00) 내에서 종료 시간이 시작 이후가 되도록 선택해 주세요.');
      return;
    }

    try {
      await service.createReservation(pending.roomId, {
        title: t || '(제목 없음)',
        start: isoLocal(pending.start),
        end: isoLocal(pending.end),
      });
      setPending(null);
      setTitle('');
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? '예약 생성 오류');
    }
  }

  /* 상단 툴바 핸들러 */
  const handleGoToday = () => setDateStr(format(new Date(), 'yyyy-MM-dd'));
  const handlePrevDay = () => setDateStr(format(addDays(date, -1), 'yyyy-MM-dd'));
  const handleNextDay = () => setDateStr(format(addDays(date, 1), 'yyyy-MM-dd'));

  /* 미팅룸 예약하기 */
  const handleSelectRoom = (roomId: string | number) => {
    setPending((prev) => (prev ? { ...prev, roomId: String(roomId) } : prev));
    scrollRoomIntoView(roomId);
  };

  // 'HH:mm' 또는 'HH:mm ~ HH:mm'에서 앞 5글자만 파싱
  const parseHHmm = (value: string) => {
    const hhmm = value.slice(0, 5);
    const [hh, mm] = hhmm.split(':').map(Number);
    return { hh, mm };
  };

  const withTime = (base: Date, hh: number, mm: number) => setMinutes(setHours(base, hh), mm);

  const handleSelectStart = (value: string) => {
    const { hh, mm } = parseHHmm(value);
    setPending((prev) => {
      if (!prev) return prev;

      const base = prev.start ?? date; // start 없으면 날짜 자정 기준
      const nextStart = withTime(base, hh, mm);

      // 기본: 시작 + 30분
      let nextEnd = addMinutes(nextStart, SLOT_MINUTES);
      const dayEnd = withTime(base, CLOSE_HOUR, 0);
      if (nextEnd > dayEnd) nextEnd = dayEnd;

      return { ...prev, start: nextStart, end: nextEnd };
    });
  };

  const handleSelectEnd = (value: string) => {
    const { hh, mm } = parseHHmm(value);
    setPending((prev) => {
      if (!prev) return prev;
      const base = prev.end ?? prev.start ?? date;
      const nextEnd = withTime(base, hh, mm);
      return { ...prev, end: nextEnd };
    });
  };

  // 당일 범위 (자정~다음날 자정)
  const dayStart = React.useMemo(() => startOfDay(date), [date]);
  const dayEnd = React.useMemo(() => addDays(dayStart, 1), [dayStart]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-sm bg-gray-200 p-4">
        <div className="flex items-center gap-x-2">
          <Button variant="outline" size="sm" onClick={handleGoToday}>
            오늘
          </Button>
          <div className="flex items-center gap-x-1">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              <LeftArr />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <RightArr />
            </Button>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <div className="relative w-30">
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn('border-input text-accent-foreground w-full px-3 text-left font-normal hover:bg-[none]')}>
                  {dateStr}
                  <Calendar className="ml-auto size-4.5 opacity-50" />
                </Button>
              </PopoverTrigger>
            </div>
            <PopoverContent className="w-auto p-0" align="start">
              <DayPicker
                captionLayout="dropdown"
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (!d) return;
                  setDateStr(format(d, 'yyyy-MM-dd'));
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setTitle('');
            setPending({ roomId: null, start: null, end: null });
          }}>
          예약하기
        </Button>
      </div>

      <div>
        <div className="rounded-sm bg-gray-200">
          {/* 2x2 Grid: [좌측 시간라벨, 우측 컨텐츠] x [헤더행, 바디행] */}
          <div className="grid grid-cols-[80px_1fr] py-4 pr-2">
            {/* 좌측-헤더행: 빈칸(헤더 높이 맞춤) */}
            <div className={`${HEADER_H_CLASS} border-b border-gray-400/50`} />

            {/* 우측-헤더행: 방 카드(헤더) */}
            <div className="grid grid-cols-6">
              {rooms.map((room, idx) => (
                <RoomHeader key={room.id} room={room} showRightBorder={idx !== rooms.length - 1} />
              ))}
            </div>

            {/* 좌측-바디행: 시간 라벨들 */}
            <div>
              {slots.map((s) => (
                <div key={s.index} className="flex h-10 items-center justify-center border-b border-gray-400/50 pr-3 text-xs text-gray-700">
                  {s.label}
                </div>
              ))}
            </div>

            {/* 우측-바디행: RoomLane(슬롯 영역만) */}
            <div className="grid grid-cols-6">
              {rooms.map((room) => {
                const all = roomResMap[String(room.id)] ?? [];
                // 당일과 겹치는 예약만 전달
                const reservationsForDay = all.filter((rv) => {
                  const s = new Date(rv.start);
                  const e = new Date(rv.end);
                  return e > dayStart && s < dayEnd;
                });

                return (
                  <RoomLane
                    key={room.id} // 날짜 바뀌어도 헤더는 유지, 슬롯 상태는 아래 effect로 초기화
                    room={room}
                    slots={slots}
                    reservations={reservationsForDay}
                    onSelect={(range) => {
                      if (!withinDayBounds(range.start, range.end)) return;
                      setTitle('');
                      setPending({ roomId: String(room.id), start: range.start, end: range.end });
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {loading && <div className="mt-3 text-sm text-gray-500">불러오는 중…</div>}
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        {/* 생성 다이얼로그 */}
        <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
          <DialogContent className="sm:max-w-[700px]" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>미팅룸 예약하기</DialogTitle>
            </DialogHeader>
            {pending && (
              <div className="flex w-full flex-col gap-y-5 overflow-hidden">
                {/* 다이얼로그 내 방 가로 스크롤 선택 */}
                <div>
                  <ul
                    ref={roomListRef}
                    className="scrollbar-horz-thin flex gap-x-3 overflow-auto overscroll-contain py-2 whitespace-nowrap">
                    {rooms.map((room) => {
                      const selected = pending.roomId === String(room.id);
                      return (
                        <li
                          className="w-40 flex-none"
                          key={room.id}
                          ref={(el) => {
                            roomItemRefs.current[String(room.id)] = el;
                          }}>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => handleSelectRoom(room.id)}
                            aria-pressed={selected}>
                            <div className="relative w-full overflow-hidden rounded-sm">
                              <img
                                src={getImageUrl(`dummy/${room.id}`)}
                                alt={`${room.name} 이미지`}
                                className="h-full w-full object-cover"
                              />
                              {selected && (
                                <div className="bg-primary-blue-500/90 absolute top-[50%] left-[50%] flex size-12 translate-[-50%] items-center justify-center rounded-[50%] text-white">
                                  <Check />
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-left text-base font-bold">{room.name}</div>
                            <div className="flex gap-x-1 text-sm text-gray-500">
                              {room.floor}
                              {room.capacity ? (
                                <div className="flex items-center">
                                  · <UserRound className="size-3.5" /> {room.capacity}
                                </div>
                              ) : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* 시간 선택 */}
                <div className="flex gap-x-10">
                  <div className="flex-1">
                    <label className="mb-1 block text-base font-medium">미팅 시작시간</label>
                    <Select value={pending.start ? format(pending.start, 'HH:mm') : undefined} onValueChange={handleSelectStart}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="시간 선택" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 w-full">
                        <SelectGroup>
                          {slots.map((s) => (
                            <SelectItem key={s.index} value={s.label}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-base font-medium">미팅 종료시간</label>
                    <Select value={pending.end ? format(pending.end, 'HH:mm') : undefined} onValueChange={handleSelectEnd}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="시간 선택" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 w-full">
                        <SelectGroup>
                          {slots.map((s) => (
                            <SelectItem key={s.index} value={s.label}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 제목 */}
                <div>
                  <label className="mb-1 block text-base font-medium">미팅 제목</label>
                  <Input ref={titleRef} defaultValue={title} placeholder="미팅 제목을 입력해 주세요" />
                </div>

                {/* 액션 */}
                <div className="mt-2 flex justify-end gap-2">
                  <Button onClick={submitReservation}>예약</Button>
                  <Button variant="outline" onClick={() => setPending(null)}>
                    취소
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function RoomHeader({ room, showRightBorder }: { room: Room; showRightBorder: boolean }) {
  return (
    <div className={cn('relative border-b border-gray-400/50 p-2', showRightBorder ? 'border-r' : '', HEADER_H_CLASS)}>
      <div className="w-full overflow-hidden rounded-sm">
        {/* HEADER_H_CLASS로 높이 통일 */}
        <img src={getImageUrl(`dummy/${room.id}`)} alt="프로필 이미지" className="h-full w-full object-cover" />
      </div>
      <div className="mt-2 text-base font-bold">{room.name}</div>
      <div className="flex gap-x-1 text-sm text-gray-500">
        {room.floor}
        {room.capacity ? (
          <div className="flex items-center">
            · <UserRound className="size-3.5" /> {room.capacity}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoomLane({
  room,
  slots,
  reservations,
  onSelect,
}: {
  room: Room;
  slots: Slot[];
  reservations: Reservation[];
  onSelect: (range: { start: Date; end: Date }) => void;
}) {
  const COLORS = ['#bff3ce', '#ffc7c7', '#bddbff', '#ffcca9', '#9cb4ff', '#e9a7ff'] as const;
  type Color = (typeof COLORS)[number];

  const [selecting, setSelecting] = React.useState(false);
  const [selStart, setSelStart] = React.useState<number | null>(null);
  const [selEnd, setSelEnd] = React.useState<number | null>(null);

  const selectedRange = React.useMemo(() => {
    if (selStart == null || selEnd == null) return null;
    const startIdx = Math.min(selStart, selEnd);
    const endIdx = Math.max(selStart, selEnd);
    const start = slots[startIdx]?.start;
    const end = slots[endIdx]?.end;
    if (!start || !end) return null;
    return { start, end, startIdx, endIdx };
  }, [selStart, selEnd, slots]);

  const idxFromTime = (d: Date) =>
    Math.max(0, Math.min(slots.length - 1, Math.floor(((d.getHours() - OPEN_HOUR) * 60 + d.getMinutes()) / SLOT_MINUTES)));

  const blocks = React.useMemo(() => {
    return reservations.map((rv) => {
      const s = new Date(rv.start);
      const e = new Date(rv.end);
      const startIdx = idxFromTime(s);
      const endIdxExclusive = Math.min(slots.length, Math.ceil(((e.getHours() - OPEN_HOUR) * 60 + e.getMinutes()) / SLOT_MINUTES));
      const length = Math.max(1, endIdxExclusive - startIdx);
      return { ...rv, startIdx, length };
    });
  }, [reservations, slots.length]);

  const colorsForBlocks = React.useMemo(() => {
    let prev: Color | null = null;
    return blocks.map(() => {
      const pool = prev ? COLORS.filter((c) => c !== prev) : COLORS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      prev = pick;
      return pick;
    });
  }, [blocks.length]);

  function onPointerUp() {
    if (!selecting) return;
    setSelecting(false);
    if (!selectedRange) return;
    onSelect({ start: selectedRange.start, end: selectedRange.end });
    setSelStart(null);
    setSelEnd(null);
  }

  // 날짜/예약/슬롯 바뀌면 드래그 상태만 초기화(헤더는 별도 컴포넌트라 깜빡임 없음)
  React.useEffect(() => {
    setSelecting(false);
    setSelStart(null);
    setSelEnd(null);
  }, [reservations, slots]);

  return (
    <div className="relative border-r border-gray-400/50 last:border-0" onPointerUp={onPointerUp}>
      {slots.map((slot) => {
        const active =
          selStart != null && selEnd != null && slot.index >= Math.min(selStart, selEnd) && slot.index <= Math.max(selStart, selEnd);
        return (
          <div
            key={slot.index}
            className={`h-10 cursor-pointer border-b border-gray-400/50 px-2 ${active ? 'bg-primary/10' : 'hover:bg-gray-50'}`}
            onPointerDown={() => {
              setSelecting(true);
              setSelStart(slot.index);
              setSelEnd(slot.index);
            }}
            onPointerEnter={() => {
              if (selecting) setSelEnd(slot.index);
            }}
            role="button"
            aria-label={`${format(slot.start, 'HH:mm')} 슬롯`}
          />
        );
      })}

      {/* 예약 블록 오버레이 */}
      <div>
        {blocks.map((b, i) => {
          const top = b.startIdx * ROW_H + 3;
          const height = b.length * ROW_H - 6;
          return (
            <div
              key={b.id}
              className="absolute right-1 left-1 overflow-hidden border border-t-3 border-gray-400/50 bg-white p-2"
              style={{ top, height, borderTopColor: colorsForBlocks[i] }}
              title={`${b.title} · ${format(new Date(b.start), 'HH:mm')}~${format(new Date(b.end), 'HH:mm')}`}>
              <div className="text-sm font-semibold">{b.title}</div>
              {b.length > 1 && (
                <div className="text-xs text-gray-500">
                  {format(new Date(b.start), 'HH:mm')} - {format(new Date(b.end), 'HH:mm')} · 홍길동
                </div>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="svgIcon" size="icon" className="absolute top-2 right-1 size-3">
                    <More />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0">
                  <div className="flex flex-col">
                    <Button variant="ghost" size="sm" className="rounded-none hover:bg-gray-100">
                      수정하기
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-none border-t hover:bg-gray-100">
                      삭제하기
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          );
        })}
      </div>
    </div>
  );
}
