import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { useDashboard } from '@/hooks/useDashboard';
import { getProfileImageUrl, getAvatarFallback } from '@/utils';

import Header from '@/layouts/Header';
import HeaderMobile from '@/layouts/HeaderMobile';

import { SectionHeader } from '@components/ui/SectionHeader';
import { Badge } from '@components/ui/badge';
import { DayPicker } from '@components/daypicker';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import getWelcomeMessage from '@components/features/Dashboard/welcome';
import WorkHoursBar from '@/components/ui/WorkHoursBar';
import { Icons } from '@components/icons';
import EventViewDialog from '@/components/calendar/EventViewDialog';
import Weather from '@components/features/Dashboard/weather';

import type { Calendar, Meetingroom, Wlog, VacationSummaryItem, Notice, Expense } from '@/api/dashboard';

import { getBadgeColor } from '@/utils/calendarHelper';
import { formatTime, formatMinutes, formatKST } from '@/utils/date';
import { getWorkTypeColor, getWorkTypeKorean } from '@/utils/workTypeHelper';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

// 캘린더 배지 목록
const calendarBadges = ['연차', '반차', '반반차', '공가', '외부 일정', '재택'];

// 비용 상태 맵
const statusMap: Record<string, string> = {
  Claimed: '신청',
  Approved: '승인',
  Rejected: '거부',
};

export default function Dashboard() {
  // Daypicker 선택된 날짜 관리 (Default : Today)
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  // 현재 시간을 실시간으로 업데이트 (초 단위)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 선택된 날짜에 따라 캘린더 데이터만 가져오기
  const {
    wlog,
    vacation,
    notice,
    calendar: calendarData,
    meetingroom,
    expense: expenseData,
    isEventDialogOpen,
    selectedEventData,
    handleCalendarClick,
    handleCloseDialog,
    getMeetingroomKoreanName,
    getMeetingroomBadgeColor,
    getExpenseStepStatusName,
    getExpenseBadgeColor,
  } = useDashboard(selected);

  // 사용자 정보 가져오기 (Hook은 최상위 레벨에서 호출)
  const { user_name, birth_date, user_id } = useUser();

  // getWelcomeMessage를 메모이제이션하여 리렌더링 시에도 같은 메시지 유지
  const welcomeMessage = useMemo(() => getWelcomeMessage(user_name, birth_date), [user_name, birth_date]);

  // 근무 타입 결정 로직 (wlogSchedule 기반 - 여러 개일 수 있음)
  const displayWorkTypes = useMemo(() => {
    if (!wlog.wlogSchedule || wlog.wlogSchedule.length === 0) return ['일반근무'];

    const types: string[] = [];
    wlog.wlogSchedule.forEach((s) => {
      if (s.sch_type === 'vacation') {
        types.push(getWorkTypeKorean('vacation', s.sch_vacation_type, s.sch_vacation_time));
      } else if (s.sch_type === 'event') {
        types.push(getWorkTypeKorean('event', s.sch_event_type));
      }
    });

    if (types.length === 0) return ['일반근무'];
    return types;
  }, [wlog.wlogSchedule]);

  return (
    <>
      {/* <Header /> */}
      <HeaderMobile />
      <section className="bg-primary-blue-100/50 mt-18 ml-60 flex min-h-200 flex-col gap-y-2 px-16 py-8 max-2xl:ml-50 max-2xl:px-6 max-md:m-0! max-md:mt-[50px]! max-md:p-5!">
        <div className="flex items-center justify-between text-base text-gray-800">
          <p>{welcomeMessage}</p>
          <Weather />
        </div>
        <div className="grid h-200 grid-cols-3 grid-rows-4 gap-6 max-2xl:gap-4 max-md:grid-cols-1 max-md:grid-rows-1">
          <div className="row-span-2 flex flex-col justify-start rounded-md border border-gray-300 bg-white p-6">
            <SectionHeader
              title="근무 시간"
              description={dayjs(currentTime).format('YYYY년 MM월 DD일 (ddd) HH:mm:ss')}
              buttonText="전체보기"
              buttonVariant="outline"
              buttonSize="sm"
              buttonHref="/working"
              className="items-start"
            />
            <div className="mb-6 flex flex-col items-center justify-center gap-y-3 rounded-md bg-gray-100 p-5">
              <div className="flex flex-wrap justify-center gap-2">
                {displayWorkTypes.map((type, idx) => (
                  <div key={idx} className={cn('rounded-sm px-4 py-1.5 text-[0.8em] font-bold', getWorkTypeColor(type))}>
                    {type}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-x-10">
                <div className="align-center flex flex-col justify-center text-center">
                  <p className="text-base text-gray-500">출근시간</p>
                  <p className="text-xl font-medium text-gray-800">{formatTime(wlog.wlogToday[0]?.stime || null)}</p>
                </div>
                <Icons.arrowRightCustom />
                <div className="align-center flex flex-col justify-center text-center">
                  <p className="text-base text-gray-500">퇴근시간</p>
                  <p className="text-xl font-medium text-gray-800">{formatTime(wlog.wlogToday[0]?.etime || null)}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="mt-1 flex flex-col gap-0">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black text-gray-800">주간누적</span>
                  {(() => {
                    const weekData = Array.isArray(wlog.wlogWeek) ? wlog.wlogWeek[0] : wlog.wlogWeek;
                    return (
                      <span className="text-primary-blue-500 text-lg font-bold">
                        {weekData?.whour || 0}시간 {String(weekData?.wmin || 0).padStart(2, '0')}분
                      </span>
                    );
                  })()}
                </div>
                <p className="flex items-center gap-x-1 text-sm text-gray-700">
                  {(() => {
                    const weekData = Array.isArray(wlog.wlogWeek) ? wlog.wlogWeek[0] : wlog.wlogWeek;
                    const totalMinutes = (weekData?.whour || 0) * 60 + (weekData?.wmin || 0);
                    const remainingMinutes = Math.max(0, 52 * 60 - totalMinutes);
                    const { hours, minutes } = formatMinutes(remainingMinutes);
                    return `이번 주 근무 시간이 ${hours}시간 ${String(minutes).padStart(2, '0')}분 남았어요.`;
                  })()}
                </p>
              </div>
              <WorkHoursBar
                hours={(() => {
                  const weekData = Array.isArray(wlog.wlogWeek) ? wlog.wlogWeek[0] : wlog.wlogWeek;
                  return ((weekData?.whour || 0) * 60 + (weekData?.wmin || 0)) / 60;
                })()}
                className="mt-4"
              />
            </div>
          </div>
          <div className="row-span-2 flex flex-col gap-4">
            <div className="rounded-md border border-gray-300 bg-white px-6 py-5">
              <SectionHeader
                title="잔여 휴가 ⛱️"
                buttonText="전체보기"
                buttonVariant="outline"
                buttonSize="sm"
                buttonHref="/mypage/vacation"
                className="mb-4"
              />
              <ul className="grid grid-cols-4">
                <li className="flex flex-col text-center text-base">
                  <span>기본연차</span>
                  <strong className="text-[1.4em]">{vacation?.va_current || 0}</strong>
                </li>
                <li className="short-v-divider flex flex-col text-center text-base">
                  <span>이월연차</span>
                  <strong className="text-[1.4em]">{vacation?.va_carryover || 0}</strong>
                </li>
                <li className="short-v-divider flex flex-col text-center text-base">
                  <span>특별대휴</span>
                  <strong className="text-[1.4em]">{vacation?.va_comp || 0}</strong>
                </li>
                <li className="short-v-divider flex flex-col text-center text-base">
                  <span>총 사용</span>
                  <strong className="text-[1.4em]">{vacation?.va_used || 0}</strong>
                </li>
              </ul>
            </div>
            <div className="h-full rounded-md border border-gray-300 bg-white px-6 py-5">
              <SectionHeader
                title="공지사항"
                buttonText="전체보기"
                buttonVariant="outline"
                buttonSize="sm"
                buttonHref="/notice"
                className="mb-4"
              />
              <div>
                <ul className="flex flex-col gap-y-2 px-2 text-base tracking-tight text-gray-700">
                  {notice.length === 0 ? (
                    <span className="text-base text-gray-500">등록된 공지사항이 없습니다.</span>
                  ) : (
                    notice.map((notice) => (
                      <li
                        key={notice.n_seq}
                        className="flex items-center gap-x-1.5 before:h-1 before:w-1 before:rounded-[50%] before:bg-gray-700">
                        <Link to={`/notice/${notice.n_seq}`} className="group flex items-center justify-between gap-x-1.5">
                          <p className="overflow-hidden text-ellipsis whitespace-nowrap group-hover:underline">
                            [{notice.category}] {notice.title}
                          </p>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="row-span-4 flex flex-col rounded-md border border-gray-300 bg-white px-6 py-5">
            <SectionHeader
              title="캘린더"
              buttonText="전체보기"
              buttonVariant="outline"
              buttonSize="sm"
              buttonHref="/calendar"
              className="mb-4 shrink-0"
            />
            <div className="shrink-0">
              <DayPicker mode="single" variant="dashboard" selected={selected} onSelect={setSelected} />
            </div>
            <ul className="flex items-center justify-end gap-x-1.5 px-4 py-2 max-2xl:flex-wrap">
              {calendarBadges.map((label) => (
                <li key={label}>
                  <Badge variant="dot" className={getBadgeColor(label)}>
                    {label}
                  </Badge>
                </li>
              ))}
            </ul>
            <div className="overflow-y-auto rounded-xl p-4 max-2xl:p-2">
              <ul className="grid grid-cols-3 gap-2 gap-y-4 max-2xl:grid-cols-2 max-2xl:gap-x-1 max-2xl:gap-y-2">
                {calendarData.length === 0 ? (
                  <span className="text-base text-gray-500">등록된 일정이 없습니다.</span>
                ) : (
                  calendarData.map((calendar, index) => (
                    <li
                      key={`${calendar.user_name}-${calendar.sch_label}-${index}`}
                      className={`flex items-center gap-x-2 rounded-md p-1 transition-colors ${
                        calendar.sch_label === '생일' ? '' : 'cursor-pointer hover:bg-gray-50'
                      }`}
                      onClick={calendar.sch_label === '생일' ? undefined : () => handleCalendarClick(calendar)}>
                      <Avatar>
                        <AvatarImage src={getProfileImageUrl(calendar.profile_image ?? undefined)} alt={calendar.user_name} />
                        <AvatarFallback>{getAvatarFallback(calendar.user_id || '')}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-base">
                        <strong className="leading-[1.2]">{calendar.user_name}</strong>
                        {calendar.sch_label === '생일' ? (
                          <Badge
                            variant="dot"
                            className="rounded-none border-none p-0 before:mr-0.5 before:h-auto before:w-auto before:rounded-none before:bg-transparent before:content-['🎂']">
                            <span className="text-[11px]">{calendar.sch_label}</span>
                          </Badge>
                        ) : (
                          <Badge variant="dot" className={`rounded-none border-none p-0 ${getBadgeColor(calendar.sch_label)}`}>
                            <span className="text-[11px]">{calendar.sch_label}</span>
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="row-span-2 flex flex-col rounded-md border border-gray-300 bg-white px-6 py-5">
            <SectionHeader
              title="미팅룸"
              buttonText="전체보기"
              buttonVariant="outline"
              buttonSize="sm"
              buttonHref="/meetingroom"
              className="shrink-0"
            />
            <div className="overflow-y-auto">
              <ul className="flex flex-col gap-y-2 text-base tracking-tight text-gray-700">
                {meetingroom.length === 0 ? (
                  <span className="text-base text-gray-500">등록된 예약이 없습니다.</span>
                ) : (
                  meetingroom.map((meetingroom) => (
                    <li key={`${meetingroom.mr_name}-${meetingroom.stime}-${meetingroom.etime}`} className="flex items-center gap-x-1.5">
                      <Badge className={getMeetingroomBadgeColor(meetingroom.mr_name)}>
                        {getMeetingroomKoreanName(meetingroom.mr_name)}
                      </Badge>
                      <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {formatTime(meetingroom.stime)} - {formatTime(meetingroom.etime)} {`${meetingroom.title}`}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <div className="row-span-2 flex flex-col rounded-md border border-gray-300 bg-white px-6 py-5">
            <SectionHeader
              title="비용 관리"
              buttonText="전체보기"
              buttonVariant="outline"
              buttonSize="sm"
              buttonHref="/mypage/expense"
              className="shrink-0"
            />
            <div className="overflow-y-auto">
              <ul className="flex flex-col gap-y-2 text-base tracking-tight text-gray-700">
                {expenseData.length === 0 ? (
                  <span className="text-base text-gray-500">등록된 비용이 없습니다.</span>
                ) : (
                  expenseData.map((expense: Expense) => {
                    const expensePath =
                      expense.expenseType === 'nexpense'
                        ? `/expense/${expense.exp_id}`
                        : `/project/${(expense as any).project_id || expense.proejct_id}/expense/${expense.seq}`;

                    return (
                      <li key={expense.seq} className="group flex items-center justify-between gap-x-1.5">
                        <Link to={expensePath} className="flex min-w-0 flex-1 items-center gap-x-2 hover:underline">
                          <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                            [{expense.expenseType === 'nexpense' ? '일반비용' : '프로젝트'}] {expense.el_title}
                          </p>
                        </Link>
                        <Badge className={getExpenseBadgeColor(expense.status)}>{getExpenseStepStatusName(expense.status)}</Badge>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* EventViewDialog */}
      <EventViewDialog isOpen={isEventDialogOpen} onClose={handleCloseDialog} selectedEvent={selectedEventData} />
    </>
  );
}
