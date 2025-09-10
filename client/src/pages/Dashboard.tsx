import { useState } from 'react';
import { Link } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { getImageUrl } from '@/utils';

import Header from '@/layouts/Header';

import { SectionHeader } from '@components/ui/SectionHeader';
import { Badge } from '@components/ui/badge';
import { DayPicker } from '@components/daypicker';
import { Avatar, AvatarImage, AvatarFallback } from '@components/ui/avatar';
import getWelcomeMessage from '@components/features/Dashboard/welcome';
import WorkHoursBar from '@components/common/WorkHoursBar';

export default function Dashboard() {
  const { user_name, job_role } = useUser();

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
          <div className="row-span-2 flex flex-col justify-center gap-y-6 rounded-md border border-gray-300 bg-white p-6">
            <div className="px-8">
              <Link to="/mypage">
                <div className="relative mx-auto mb-2.5 aspect-square w-32 overflow-hidden rounded-[50%]">
                  <img src={getImageUrl('dummy/profile')} alt="프로필 이미지" className="h-full w-full object-cover" />
                </div>
              </Link>
              <div className="mt-4 text-center text-base text-gray-700">
                <Link to="/mypage">
                  <strong className="block text-xl leading-none font-bold text-gray-950">{user_name}</strong>
                  {job_role}
                </Link>
              </div>
            </div>
            <div>
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
                  <strong className="text-[1.4em]">20</strong>
                </li>
                <li className="short-v-divider flex flex-col text-center text-base">
                  <span>사용휴가</span>
                  <strong className="text-[1.4em]">11</strong>
                </li>
                <li className="short-v-divider flex flex-col text-center text-base">
                  <span>잔여휴가</span>
                  <strong className="text-[1.4em]">9</strong>
                </li>
              </ul>
            </div>
          </div>
          <div className="rounded-md border border-gray-300 bg-white px-6 py-5">
            <SectionHeader title="근무 시간" buttonText="전체보기" buttonVariant="outline" buttonSize="sm" buttonHref="/working" />
            <div>
              <div className="flex gap-x-4">
                <div className="before:bg-primary flex items-center gap-x-1 text-sm text-gray-700 before:h-1.5 before:w-1.5 before:rounded-[50%]">
                  <span>이번 주 근무시간</span>
                  <strong className="text-gray-950">35시간 00분</strong>
                </div>
                <div className="flex items-center gap-x-1 text-sm text-gray-700 before:h-1.5 before:w-1.5 before:rounded-[50%] before:bg-gray-400">
                  <span>잔여 근무시간</span>
                  <strong className="text-gray-950">17시간 00분</strong>
                </div>
              </div>
              <WorkHoursBar hours={35} className="mt-4" />
            </div>
            {/* <div>
              <ul className="grid grid-cols-3">
                <li className="flex flex-col text-base">
                  <span>이번 주 출근시간</span>
                  <strong className="text-[1.2em]">09:30</strong>
                </li>
                <li className="flex flex-col text-base">
                  <span>이번 주 퇴근시간</span>
                  <strong className="text-[1.2em]">18:42</strong>
                </li>
                <li className="flex flex-col text-base">
                  <span>일 평균 근무시간</span>
                  <strong className="text-[1.2em]">8시간 12분</strong>
                </li>
              </ul>
            </div> */}
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
              <li>
                <Badge variant="dot" className="before:bg-[#FF6B6B]">
                  연차휴가
                </Badge>
              </li>
              <li>
                <Badge variant="dot" className="before:bg-[#6BADFF]">
                  반차휴가
                </Badge>
              </li>
              <li>
                <Badge variant="dot" className="before:bg-[#FFA46B]">
                  반반차휴가
                </Badge>
              </li>
              <li>
                <Badge variant="dot" className="before:bg-[#2FC05D]">
                  외부일정
                </Badge>
              </li>
              <li>
                <Badge variant="dot" className="before:bg-[#5E6BFF]">
                  휴일근무
                </Badge>
              </li>
              <li>
                <Badge variant="dot" className="before:bg-[#DA6BFF]">
                  기타
                </Badge>
              </li>
            </ul>
            <div className="overflow-y-auto rounded-xl p-4">
              <ul className="grid grid-cols-3 gap-2 gap-y-4">
                <li className="flex items-center gap-x-2">
                  <Avatar>
                    <AvatarImage src={getImageUrl('dummy/profile')} alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-base">
                    <strong className="leading-[1.2]">김예지</strong>
                    <Badge variant="dot" className="p-0 before:bg-[#FF6B6B]">
                      연차휴가
                    </Badge>
                  </div>
                </li>
                <li className="flex items-center gap-x-2">
                  <Avatar>
                    <AvatarImage src={getImageUrl('dummy/profile')} alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-base">
                    <strong className="leading-[1.2]">이연상</strong>
                    <Badge variant="dot" className="before:bg-[#FF6B6B]">
                      연차휴가
                    </Badge>
                  </div>
                </li>
                <li className="flex items-center gap-x-2">
                  <Avatar>
                    <AvatarFallback>HC</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-base">
                    <strong className="leading-[1.2]">차혜리</strong>
                    <Badge variant="dot" className="before:bg-[#FFA46B]">
                      오후반반차
                    </Badge>
                  </div>
                </li>
                <li className="flex items-center gap-x-2">
                  <Avatar className="flex-none">
                    <AvatarFallback>JJ</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col text-base">
                    <strong className="leading-[1.2]">박박박</strong>
                    <Badge variant="dot" className="before:bg-[#2FC05D]">
                      외부일정
                    </Badge>
                  </div>
                </li>
                <li className="flex items-center gap-x-2">
                  <Avatar className="flex-none">
                    <AvatarFallback>JJ</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col text-base">
                    <strong className="leading-[1.2]">이이이</strong>
                    <Badge variant="dot" className="before:bg-[#6BADFF]">
                      오전반차
                    </Badge>
                  </div>
                </li>
                <li className="flex items-center gap-x-2">
                  <Avatar>
                    <AvatarFallback>KH</AvatarFallback>
                  </Avatar>
                  <div className="flex w-[calc(100%-(var(--spacing)*10))] flex-col text-base">
                    <strong className="leading-[1.2]">홍길동</strong>
                    <Badge variant="dot" className="before:bg-[#DA6BFF]">
                      공가사용 1/3 공가사용 1/3공가사용 1/3
                    </Badge>
                  </div>
                </li>
                <li className="flex items-center gap-x-2">
                  <Avatar>
                    <AvatarFallback>KH</AvatarFallback>
                  </Avatar>
                  <div className="flex w-[calc(100%-(var(--spacing)*10))] flex-col text-base">
                    <strong className="leading-[1.2]">홍길동</strong>
                    <Badge variant="dot" className="before:bg-[#DA6BFF]">
                      공가사용 1/3 공가사용 1/3공가사용 1/3
                    </Badge>
                  </div>
                </li>
                <li className="flex items-center gap-x-2">
                  <Avatar>
                    <AvatarFallback>KH</AvatarFallback>
                  </Avatar>
                  <div className="flex w-[calc(100%-(var(--spacing)*10))] flex-col text-base">
                    <strong className="leading-[1.2]">홍길동</strong>
                    <Badge variant="dot" className="before:bg-[#DA6BFF]">
                      생일 🎂
                    </Badge>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="rounded-md border border-gray-300 bg-white px-6 py-5">
            <SectionHeader
              title="알림"
              buttonText="전체보기"
              buttonVariant="outline"
              buttonSize="sm"
              buttonHref="/alarm"
              className="mb-4"
            />
            <div>
              <ul className="flex flex-col gap-y-2 px-2 text-base tracking-tight text-gray-700">
                <li className="flex items-center gap-x-1.5 before:h-1 before:w-1 before:rounded-[50%] before:bg-gray-700">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                    5월 30일 금요일 연장근무 신청 <span className="text-primary-blue-500">승인</span> 되었습니다.
                  </p>
                </li>
                <li className="flex items-center gap-x-1.5 before:h-1 before:w-1 before:rounded-[50%] before:bg-gray-700">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                    5월 30일 금요일 연장근무 신청 <span className="text-destructive">반려</span> 되었습니다.
                  </p>
                </li>
                <li className="flex items-center gap-x-1.5 before:h-1 before:w-1 before:rounded-[50%] before:bg-gray-700">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                    5월 30일 금요일 연장근무 신청 <span className="text-primary-blue-500">승인</span> 되었습니다.
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
