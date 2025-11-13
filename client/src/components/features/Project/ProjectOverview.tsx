import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';

import { Edit } from '@/assets/images/icons';
import { FilePlus } from 'lucide-react';

export default function Overview() {
  return (
    <>
      <div className="flex min-h-160 flex-wrap justify-between pt-2 pb-12">
        <div className="w-[76%] tracking-tight">
          <div className="flex flex-wrap gap-[3%]">
            <div className="w-full">
              <h3 className="mb-2 text-lg font-bold text-gray-800">프로젝트 정보</h3>
              <TableColumn>
                <TableColumnHeader className="w-[15%]">
                  <TableColumnHeaderCell>프로젝트 #</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 오너</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 견적</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>K25-00002</TableColumnCell>
                  <TableColumnCell>김예지</TableColumnCell>
                  <TableColumnCell>300,000,000</TableColumnCell>
                </TableColumnBody>
                <TableColumnHeader className="w-[15%]">
                  <TableColumnHeaderCell>클라이언트</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 기간</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 예상 지출</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>로스만스파이스트비브이(영업소)</TableColumnCell>
                  <TableColumnCell>2025-11-13 ~ 2025-12-30</TableColumnCell>
                  <TableColumnCell>182,000,000</TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            </div>
            <div className="mt-8 grid w-full grid-cols-2 grid-rows-2 gap-4">
              <div className="rounded-sm border border-gray-300 p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-800">코스트</h3>
              </div>
              <div className="rounded-sm border border-gray-300 p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-800">비용 차트</h3>
              </div>
              <div className="rounded-sm border border-gray-300 p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-800">인보이스</h3>
              </div>
              <div className="rounded-sm border border-gray-300 p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-800">비용 유형</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-[20%] flex-col">
          <div className="flex h-[50%] flex-col pb-4">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">프로젝트 멤버</h2>
              <Button type="button" variant="outline" size="sm">
                <Edit />
                수정
              </Button>
            </div>
            <div className="overflow-y-auto pr-2">
              <ul className="flex flex-col gap-4">
                <li className="flex items-center gap-2.5">
                  <Avatar className="size-10">
                    <AvatarImage src="" />
                    <AvatarFallback>GH</AvatarFallback>
                  </Avatar>
                  <div className="text-base leading-[1.3] text-gray-800">
                    <strong>홍길동</strong>
                    <span className="block text-[.8em] text-gray-500">gildong.hong@pmgasia.com</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    Owner
                  </Badge>
                </li>
                <li className="flex items-center gap-2.5">
                  <Avatar className="size-10">
                    <AvatarImage src="" />
                    <AvatarFallback>GH</AvatarFallback>
                  </Avatar>
                  <div className="text-base leading-[1.3] text-gray-800">
                    <strong>홍길동</strong>
                    <span className="block text-[.8em] text-gray-500">gildong.hong@pmgasia.com</span>
                  </div>
                  <Badge variant="grayish" className="ml-auto">
                    Member
                  </Badge>
                </li>
                <li className="flex items-center gap-2.5">
                  <Avatar className="size-10">
                    <AvatarImage src="" />
                    <AvatarFallback>GH</AvatarFallback>
                  </Avatar>
                  <div className="text-base leading-[1.3] text-gray-800">
                    <strong>홍길동</strong>
                    <span className="block text-[.8em] text-gray-500">gildong.hong@pmgasia.com</span>
                  </div>
                  <Badge variant="grayish" className="ml-auto">
                    Member
                  </Badge>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex h-[50%] flex-col pb-4">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">프로젝트 히스토리</h2>
            </div>
            <div className="overflow-y-auto pr-2">
              <ul className="flex flex-col gap-4">
                <li>
                  <div className="relative before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80 first:before:hidden">
                    <div className="flex items-center gap-4">
                      <span className="flex size-8 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                        <FilePlus className="text-primary-blue size-4.5" />
                      </span>
                      <dl className="text-base leading-[1.3] text-gray-800">
                        <dt>
                          <strong className="font-semibold text-gray-900">홍길동</strong>님이 프로젝트를 생성했습니다.
                        </dt>
                        <dd className="text-[.88em] text-gray-500">2025-11-13 19:00:00</dd>
                      </dl>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
