// src/components/features/Meetingroom/
import * as React from 'react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils';

import { addMinutes, format, setHours, setMinutes, startOfDay, addDays, parse } from 'date-fns';
import { Button } from '@components/ui/button';
import { DayPicker } from '@components/daypicker';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@components/ui/alert-dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Calendar, LeftArr, More, RightArr } from '@/assets/images/icons';
import { UserRound, Check } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { createReservationService, type Room, type Reservation } from '@/api';

const service = createReservationService();

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
const withDateTime = (dateStr: string, time: string): Date => parse(`${dateStr} ${time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
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
        // 회의실 목록 API 통신 후 상태 설정
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
  roomId: number | null;
  start: Date | null;
  end: Date | null;
};

export default function MeetingRoomsAllPage() {
  const [open, setOpen] = React.useState(false);
  const [dateStr, setDateStr] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [alertMsg, setAlertMsg] = React.useState<string | null>(null); // 얼럿 메세지용
  const [alertOpen, setAlertOpen] = React.useState(false); // 얼럿 다이얼로그 오픈용

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
  const scrollRoomIntoView = React.useCallback((roomId: number) => {
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

  // 미팅룸 예약하기
  async function submitReservation() {
    if (!pending) return;

    const title = titleRef.current?.value?.trim() ?? '';
    setTitle(title);

    if (!pending.roomId) {
      setAlertMsg('미팅룸을 선택해 주세요.');
      setAlertOpen(true);
      return;
    }
    if (!pending.start || !pending.end) {
      setAlertMsg('미팅 시간을 선택해 주세요.');
      setAlertOpen(true);
      return;
    }
    if (!withinDayBounds(pending.start, pending.end)) {
      setAlertMsg('운영 시간(09:00~20:00) 내에서 종료 시간이 시작 이후가 되도록 선택해 주세요.');
      setAlertOpen(true);
      return;
    }

    try {
      // 미팅 예약하기 API 호출
      await service.createReservation(pending.roomId, {
        date: dateStr,
        title: title || '미팅 예약',
        start: format(pending.start, 'HH:mm:ss'),
        end: format(pending.end, 'HH:mm:ss'),
      });

      setPending(null);
      setTitle('');
      await refresh();
      setAlertMsg(null); // 성공 시 얼럿 메세지 초기화
    } catch (e: any) {
      if (e.message === 'OVERLAP') {
        setAlertMsg('이미 예약된 시간대입니다. 다른 시간대를 선택해 주세요.');
        setAlertOpen(true);
      } else {
        setAlertMsg('예약 생성 중 오류가 발생했습니다.');
        setAlertOpen(true);
      }
    }
  }

  /* 미팅룸 예약 취소 */
  async function cancleReservation(id: number) {
    try {
      await service.cancelReservation(id);
      await refresh();
    } catch (err) {
      console.error('예약 삭제 실패:', err);
      setAlertMsg('예약 삭제 중 오류가 발생했습니다.');
      setAlertOpen(true);
    }
  }

  /* 상단 툴바 핸들러 */
  const handleGoToday = () => setDateStr(format(new Date(), 'yyyy-MM-dd'));
  const handlePrevDay = () => setDateStr(format(addDays(date, -1), 'yyyy-MM-dd'));
  const handleNextDay = () => setDateStr(format(addDays(date, 1), 'yyyy-MM-dd'));

  /* 미팅룸 예약하기 */
  const handleSelectRoom = (roomId: number) => {
    setPending((prev) => (prev ? { ...prev, roomId: roomId } : prev));
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
          <div className="grid grid-cols-[80px_1fr] py-4 pr-2">
            <div className={`${HEADER_H_CLASS} border-b border-gray-400/50`} />

            {/* 우측-헤더행: 미팅룸 카드 */}
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
                const all = roomResMap[room.id] ?? [];

                // 당일과 겹치는 예약만 전달 (Date 변환 후)
                const reservationsForDay = all
                  .map((rv) => {
                    const s = withDateTime(dateStr, rv.start);
                    const e = withDateTime(dateStr, rv.end);
                    return { ...rv, start: s, end: e }; // start/end를 Date로 교체
                  })
                  .filter((rv) => rv.end > dayStart && rv.start < dayEnd);

                return (
                  <RoomLane
                    key={room.id} // 날짜 바뀌어도 헤더는 유지, 슬롯 상태는 아래 effect로 초기화
                    room={room}
                    slots={slots}
                    reservations={reservationsForDay}
                    onSelect={(range) => {
                      if (!withinDayBounds(range.start, range.end)) return;
                      setTitle('');
                      setPending({
                        roomId: Number(room.id),
                        start: range.start,
                        end: range.end,
                      });
                    }}
                    onDelete={cancleReservation}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {alertMsg && (
          <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>예약 실패</AlertDialogTitle>
                <AlertDialogDescription>{alertMsg}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-8 px-3.5 text-sm" onClick={() => setOpen(false)}>
                  닫기
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

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
                {/* 다이얼로그 내 미팅룸 선택 영역 */}
                <div>
                  <ul
                    ref={roomListRef}
                    className="scrollbar-horz-thin flex gap-x-3 overflow-auto overscroll-contain py-2 whitespace-nowrap">
                    {rooms.map((room) => {
                      const selected = Number(pending.roomId) === Number(room.id);
                      return (
                        <li
                          className="w-40 flex-none"
                          key={room.id}
                          ref={(el) => {
                            roomItemRefs.current[room.id] = el;
                          }}>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => handleSelectRoom(Number(room.id))}
                            aria-pressed={selected}>
                            <div className="relative w-full overflow-hidden rounded-sm">
                              {/* 추후 실제 이미지 경로로 교체 */}
                              <img
                                src={getImageUrl(`dummy/${room.imageUrl}`)}
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
        {/* 추후 실제 이미지 경로로 교체 */}
        <img src={getImageUrl(`dummy/${room.imageUrl}`)} alt="프로필 이미지" className="h-full w-full object-cover" />
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

type ReservationWithDate = Omit<Reservation, 'start' | 'end'> & {
  start: Date;
  end: Date;
};

function RoomLane({
  room,
  slots,
  reservations,
  onSelect,
  onDelete,
}: {
  room: Room;
  slots: Slot[];
  reservations: ReservationWithDate[];
  onSelect: (range: { start: Date; end: Date }) => void;
  onDelete: (id: number) => void;
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

  // 예약 → 화면 블록 변환
  const blocks = React.useMemo(() => {
    return reservations.map((rv) => {
      const s = rv.start;
      const e = rv.end;
      const startIdx = idxFromTime(s);
      const endIdxExclusive = Math.min(slots.length, Math.ceil(((e.getHours() - OPEN_HOUR) * 60 + e.getMinutes()) / SLOT_MINUTES));
      const length = Math.max(1, endIdxExclusive - startIdx);
      return { ...rv, startIdx, length };
    });
  }, [reservations, slots.length]);

  // 색상 랜덤 선택
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

  // 날짜/예약/슬롯 바뀌면 드래그 상태 초기화
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
          console.log(b);

          const top = b.startIdx * ROW_H + 3;
          const height = b.length * ROW_H - 6;
          return (
            <div
              key={b.id}
              className="absolute right-1 left-1 overflow-hidden border border-t-3 border-gray-400/50 bg-white p-2"
              style={{ top, height, borderTopColor: colorsForBlocks[i] }}
              title={`${b.title} · ${format(b.start, 'HH:mm')}~${format(b.end, 'HH:mm')}`}>
              <div className="text-sm font-semibold">{b.title}</div>
              {b.length > 1 && (
                <div className="text-xs text-gray-500">
                  {format(b.start, 'HH:mm')} - {format(b.end, 'HH:mm')} · {b.user_name}
                </div>
              )}
              {/* 미팅 예약자와 접속한 유저의 아이디값 비교해서 Popover 노출 필요 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="svgIcon" size="icon" className="absolute top-2 right-1 size-3">
                    <More />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0" align="start">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                        삭제하기
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>예약 삭제</AlertDialogTitle>
                        <AlertDialogDescription>미팅룸 예약을 삭제하시겠습니까?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-8 px-3.5 text-sm">닫기</AlertDialogCancel>
                        <AlertDialogAction className="h-8 px-3.5 text-sm" onClick={() => onDelete(b.id)}>
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </PopoverContent>
              </Popover>
            </div>
          );
        })}
      </div>
    </div>
  );
}
