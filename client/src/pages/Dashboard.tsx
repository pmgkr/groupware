import { useState } from 'react';
import { Link } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { useDashboard } from '@/hooks/useDashboard';
import { getImageUrl } from '@/utils';

import Header from '@/layouts/Header';

import { SectionHeader } from '@components/ui/SectionHeader';
import { Badge } from '@components/ui/badge';
import { DayPicker } from '@components/daypicker';
import { Avatar, AvatarImage, AvatarFallback } from '@components/ui/avatar';
import getWelcomeMessage from '@components/features/Dashboard/welcome';
import WorkHoursBar from '@/components/ui/WorkHoursBar';
import { Icons } from '@components/icons';

import { type Calendar, type Meetingroom, type Wlog } from '@/api/dashboard';
import { getBadgeColor } from '@/utils/calendarHelper';

// 캘린더 배지 목록
const calendarBadges = ['연차', '반차', '반반차', '공가', '외부일정', '기타'];

export default function Dashboard() {
  const [wlog, setWlog] = useState<Wlog[]>([]);
  const { vacation, notification, calendar: calendarData, meetingroom } = useDashboard();
  const { user_name, job_role, profile_image } = useUser();

  // Daypicker 선택된 날짜 관리 (Default : Today)
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  return (
    <>
      <Header />
      <section className="bg-primary-blue-100/50 mt-18 ml-60 flex min-h-200 flex-col gap-y-2 px-16 py-8">
        <div className="flex items-center justify-between text-base text-gray-800">
          <p>{getWelcomeMessage()}</p>
          <div className="flex">서울 날씨 ☀️ 25°C, 맑음</div>
        </div>
        <div className="grid h-200 grid-cols-3 grid-rows-4 gap-6">
          <div className="row-span-2 flex flex-col justify-start rounded-md border border-gray-300 bg-white p-6">
            <SectionHeader
              title="근무 시간" 
              description="2025년 11월 13일 (목) 10:01:30" 
              buttonText="전체보기" 
              buttonVariant="outline" 
              buttonSize="sm" 
              buttonHref="/working" 
              className="items-start"
            />
            <div className="flex items-center justify-center gap-x-10 bg-gray-200 rounded-md p-5 mb-6">
              <div className="flex flex-col align-center justify-center text-center">
                <p className="text-gray-500 text-base">출근시간</p>
                <p className="text-gray-800 text-xl font-medium">10:01:30</p>
              </div>
              <Icons.arrowRightCustom />
              <div className="flex flex-col align-center justify-center text-center">
                <p className="text-gray-500 text-base">퇴근시간</p>
                <p className="text-gray-800 text-xl font-medium">18:00:00</p>
              </div>
            </div>
            <div>
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-1 ">
                  <span className="text-gray-800 text-xl font-black">주간누적</span>
                  <span className="text-primary-blue-500 text-lg font-bold">{wlog[0]?.total_minutes || 0}시간 {String(wlog[0]?.total_minutes || 0).padStart(2, '0')}분</span>
                </div>
                <p className="flex items-center gap-x-1 text-sm text-gray-700">
                  이번 주 근무 시간이 5시간 5분 남았어요.
                </p>
              </div>
              <WorkHoursBar 
                hours={(wlog[0]?.total_minutes || 0) + ((wlog[0]?.total_minutes || 0) / 60)} 
                className="mt-4" 
              />
            </div>
          </div>
          <div className="rounded-md border border-gray-300 bg-white px-6 py-5">
            <SectionHeader
                title="휴가 현황 ⛱️"
                buttonText="전체보기"
                buttonVariant="outline"
                buttonSize="sm"
                buttonHref="/mypage/vacation"
                className="mb-4"
              />
              <ul className="grid grid-cols-3">
                <li className="flex flex-col text-center text-base">
                  <span>지급휴가</span>
                  <strong className="text-[1.4em]">{vacation?.given || 0}</strong>
                </li>
                <li className="short-v-divider flex flex-col text-center text-base">
                  <span>사용휴가</span>
                  <strong className="text-[1.4em]">{vacation?.used || 0}</strong>
                </li>
                <li className="short-v-divider flex flex-col text-center text-base">
                  <span>잔여휴가</span>
                  <strong className="text-[1.4em]">{vacation?.lefts || 0}</strong>
                </li>
              </ul>
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
            <ul className="flex items-center justify-end gap-x-1.5 px-4 py-2">
              {calendarBadges.map((label) => (
                <li key={label}>
                  <Badge variant="dot" className={getBadgeColor(label)}>
                    {label}
                  </Badge>
                </li>
              ))}
            </ul>
            <div className="overflow-y-auto rounded-xl p-4">
              <ul className="grid grid-cols-3 gap-2 gap-y-4">

                {calendarData.map((calendar, index) => (
                  <li key={`${calendar.user_name}-${calendar.sch_label}-${index}`} className="flex items-center gap-x-2">
                    <Avatar>
                      <AvatarImage 
                        src={
                          calendar.profile_image
                            ? `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${calendar.profile_image}?t=${Date.now()}`
                            : getImageUrl('dummy/profile')
                        } 
                        alt={calendar.user_name} 
                      />
                      <AvatarFallback>
                        {calendar.user_name?.slice(0, 2).toUpperCase() || 'CN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-base">
                      <strong className="leading-[1.2]">{calendar.user_name}</strong>
                      <Badge variant="dot" className={`p-0 ${getBadgeColor(calendar.sch_label)}`}>
                        {calendar.sch_label}
                      </Badge>
                    </div>
                  </li>
                ))}

              </ul>
            </div>
          </div>
          <div className="rounded-md border border-gray-300 bg-white px-6 py-5">
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
                <li className="flex items-center gap-x-1.5 before:h-1 before:w-1 before:rounded-[50%] before:bg-gray-700">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                    [중요공지] 사내 공지 관련 안내
                  </p>
                </li>
                <li className="flex items-center gap-x-1.5 before:h-1 before:w-1 before:rounded-[50%] before:bg-gray-700">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                    [공지] 보안 인식 교육(Security Awareness Training) 2단계 안내
                  </p>
                </li>
                <li className="flex items-center gap-x-1.5 before:h-1 before:w-1 before:rounded-[50%] before:bg-gray-700">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                    [주요공지] 개인법인카드 및 개인카드 비용청구서 가이드라인 업데이트 안내
                  </p>
                </li>
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
                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#FF6B6B]">베이징룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">10:00 ~ 11:30 PM Team 내부미팅</p>
                </li>
                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#FF6B6B]">베이징룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">13:00 ~ 14:00 록시땅 디자인 미팅</p>
                </li>
                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#FFA46B]">도쿄룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">13:00 ~ 14:00 록시땅 디자인 미팅</p>
                </li>
                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#FFA46B]">도쿄룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">13:00 ~ 14:00 록시땅 디자인 미팅</p>
                </li>

                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#2FC05D]">싱가폴룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">14:00 ~ 14:30 CCD</p>
                </li>
                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#2FC05D]">싱가폴룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">14:00 ~ 14:30 CCD</p>
                </li>
                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#6BADFF]">시드니룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">15:00 ~ 16:30 CCP 내부미팅</p>
                </li>
                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#5E6BFF]">마닐라룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">10:00 ~ 16:30 내부</p>
                </li>
                <li className="flex items-center gap-x-1.5">
                  <Badge className="bg-[#DA6BFF]">방콕룸</Badge>
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">12:00 ~ 13:30 노사협의회 미팅</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="row-span-2 flex flex-col rounded-md border border-gray-300 bg-white px-6 py-5">
            <SectionHeader
              title="비용 관리"
              buttonText="전체보기"
              buttonVariant="outline"
              buttonSize="sm"
              buttonHref="/expense"
              className="shrink-0"
            />
            <div className="overflow-y-auto">
              <ul className="flex flex-col gap-y-2 text-base tracking-tight text-gray-700">
                <li>
                  <Link to="" className="group flex items-center justify-between gap-x-1.5">
                    <p className="overflow-hidden text-ellipsis whitespace-nowrap group-hover:underline">5월 동아리 활동 건 </p>
                    <Badge variant="secondary">승인대기</Badge>
                  </Link>
                </li>
                <li>
                  <Link to="" className="group flex items-center justify-between gap-x-1.5">
                    <p className="overflow-hidden text-ellipsis whitespace-nowrap group-hover:underline">5월 야근식비</p>
                    <Badge variant="secondary">승인대기</Badge>
                  </Link>
                </li>
                <li>
                  <Link to="" className="group flex items-center justify-between gap-x-1.5">
                    <p className="overflow-hidden text-ellipsis whitespace-nowrap group-hover:underline">5월 야근택시비</p>
                    <Badge variant="secondary">승인대기</Badge>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
