import { Link, NavLink, useLocation, useNavigate } from 'react-router';

import { Button } from '@components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@components/ui/sheet';
import { Alarm } from '@/assets/images/icons';

export function Notification() {
  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="알람">
            <Alarm className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>알림</SheetTitle>
          </SheetHeader>
          <div className="flex-1">
            <Tabs defaultValue="today" className="h-full w-full">
              <TabsList className="h-12 w-full px-4 py-2">
                <TabsTrigger value="today">오늘</TabsTrigger>
                <TabsTrigger value="recent">최근 알림</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="flex-1 overflow-hidden">
                <ul className="max-h-[calc(100vh-(var(--spacing)*54))] overflow-y-auto overscroll-contain">
                  <li className="flex items-center gap-x-4 border-b-1 border-b-gray-300 px-1 py-3.5 last:border-b-0">
                    <Avatar className="size-12">
                      <AvatarImage src="/src/assets/images/dummy/profile.png" alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="w-66">
                      <p className="overflow-hidden text-base leading-6 overflow-ellipsis whitespace-nowrap">
                        <strong>홍길동</strong> 님이 기안서를 👍🏻 합니다.
                      </p>
                      <p className="overflow-hidden text-sm overflow-ellipsis whitespace-nowrap text-gray-500">
                        <span>8분 전</span>
                        <span> · </span>
                        <Link to="" className="hover:underline">
                          외부교육 신청합니다. (인프런 교육 신청)
                        </Link>
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-x-4 border-b-1 border-b-gray-300 px-1 py-3.5 last:border-b-0">
                    <Avatar className="size-12">
                      <AvatarImage src="/src/assets/images/dummy/profile.png" alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="w-66">
                      <p className="overflow-hidden text-base leading-6 overflow-ellipsis whitespace-nowrap">
                        <strong>홍길동</strong> 님이 추가근무를 <span className="text-destructive">반려</span> 했습니다.
                      </p>
                      <p className="overflow-hidden text-sm overflow-ellipsis whitespace-nowrap text-gray-500">
                        <span>2시간 전</span>
                        <span> · </span>
                        <Link to="" className="hover:underline">
                          9월 23일 (화) 추가근무 신청
                        </Link>
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-x-4 border-b-1 border-b-gray-300 px-1 py-3.5 last:border-b-0">
                    <Avatar className="size-12">
                      <AvatarImage src="/src/assets/images/dummy/profile.png" alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="w-66">
                      <p className="overflow-hidden text-base leading-6 overflow-ellipsis whitespace-nowrap">
                        <strong>홍길동</strong> 님이 추가근무를 <span className="text-valid">승인</span> 했습니다.
                      </p>
                      <p className="overflow-hidden text-sm overflow-ellipsis whitespace-nowrap text-gray-500">
                        <span>14시간 전</span>
                        <span> · </span>
                        <Link to="" className="hover:underline">
                          9월 22일 (월) 추가근무 신청
                        </Link>
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-x-4 border-b-1 border-b-gray-300 px-1 py-3.5 last:border-b-0">
                    <span className="bg-primary-blue-100 text-primary flex size-12 items-center justify-center rounded-[50%] border-1 border-gray-200">
                      <Alarm className="size-6" />
                    </span>
                    <div className="w-66">
                      <p className="overflow-hidden text-base leading-6 overflow-ellipsis whitespace-nowrap">
                        25년 9월 비용 청구 기한이 3일 남았습니다.
                      </p>
                      <p className="overflow-hidden text-sm overflow-ellipsis whitespace-nowrap text-gray-500">
                        <span>19시간 전</span>
                      </p>
                    </div>
                  </li>
                  <li className="flex items-center gap-x-4 border-b-1 border-b-gray-300 px-1 py-3.5 last:border-b-0">
                    <Avatar className="size-12">
                      <AvatarImage src="/src/assets/images/dummy/profile.png" alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="w-66">
                      <p className="overflow-hidden text-base leading-6 overflow-ellipsis whitespace-nowrap">
                        <strong>홍길동</strong> 님이 기안서를 👍🏻 합니다.
                      </p>
                      <p className="overflow-hidden text-sm overflow-ellipsis whitespace-nowrap text-gray-500">
                        <span>8분 전</span>
                        <span> · </span>
                        <Link to="" className="hover:underline">
                          외부교육 신청합니다. (인프런 교육 신청)
                        </Link>
                      </p>
                    </div>
                  </li>
                </ul>
              </TabsContent>
              <TabsContent value="recent">
                <ul>
                  <li className="flex h-24 w-full items-center justify-center text-base text-gray-500">최근 알림이 없습니다.</li>
                </ul>
              </TabsContent>
            </Tabs>
          </div>

          <SheetFooter>
            <Button type="submit" size="full">
              전체 알림 지우기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
