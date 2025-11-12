import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';
import { Dialog, DialogClose, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MultiSelect, type MultiSelectOption } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Excel } from '@/assets/images/icons';
import { Star, RefreshCw, OctagonAlert } from 'lucide-react';

import { ProjectCreateForm } from './_components/ProjectCreate';

export default function ProjectList() {
  // 상단 필터용 state
  const [typeOptions, setTypeOptions] = useState<MultiSelectOption[]>([]);
  const [registerDialog, setRegisterDialog] = useState(false);

  const categoryOptions: MultiSelectOption[] = [
    { label: 'CAMPAIGN', value: 'CAMPAIGN' },
    { label: 'Event', value: 'Event' },
    { label: 'Web', value: 'Web' },
  ];

  const clientOptions: MultiSelectOption[] = [
    { label: '골든구스 유한회사', value: '골든구스 유한회사' },
    { label: 'HERMES', value: 'HERMES' },
    { label: '3M', value: '3M' },
  ];

  const teamOptions: MultiSelectOption[] = [
    { label: 'CC', value: 'CC' },
    { label: 'CCP', value: 'CCP' },
  ];

  const statusOptions: MultiSelectOption[] = [
    { label: '진행중', value: 'In-Progress' },
    { label: '종료됨', value: 'Closed' },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            <Button className={`h-8 w-19 rounded-sm p-0 text-sm ${'bg-primary hover:bg-primary active:bg-primary text-white'}`}>
              내 프로젝트
            </Button>
            <Button
              className={`h-8 w-19 rounded-sm p-0 text-sm ${'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'}`}>
              전체 프로젝트
            </Button>
          </div>
          <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
            <Select>
              <SelectTrigger size="sm">
                <SelectValue placeholder="소속 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem size="sm" value="PMG">
                    PMG
                  </SelectItem>
                  <SelectItem size="sm" value="MCS">
                    MCS
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="비용 용도"
              options={categoryOptions}
              onValueChange={() => {}}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              simpleSelect={true}
            />

            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="클라이언트"
              options={clientOptions}
              onValueChange={() => {}}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              simpleSelect={true}
            />

            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="팀 선택"
              options={teamOptions}
              onValueChange={() => {}}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              simpleSelect={true}
            />

            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="상태 선택"
              options={statusOptions}
              onValueChange={() => {}}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              simpleSelect={true}
            />

            <Button
              type="button"
              variant="svgIcon"
              size="icon"
              className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 size-6 text-gray-600 transition-transform"
              onClick={() => {}}>
              <Star />
            </Button>
            <Button
              type="button"
              variant="svgIcon"
              size="icon"
              className="hover:text-primary-blue-500 size-6 text-gray-600 transition-transform hover:rotate-45"
              onClick={() => {}}>
              <RefreshCw />
            </Button>
          </div>
        </div>

        <div className="flex gap-x-2">
          <Input className="max-w-45" size="sm" placeholder="검색어 입력" value="" onChange={() => {}} />
          <Button
            size="sm"
            onClick={() => {
              setRegisterDialog(true);
            }}>
            프로젝트 생성
          </Button>
        </div>
      </div>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-4 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-12 px-0"></TableHead>
            <TableHead className="w-20 px-0">프로젝트#</TableHead>
            <TableHead className="w-[6%]">소속</TableHead>
            <TableHead className="w-[10%]">카테고리</TableHead>
            <TableHead>프로젝트 이름</TableHead>
            <TableHead className="w-[8%]">클라이언트</TableHead>
            <TableHead className="w-[6%]">오너</TableHead>
            <TableHead className="w-[8%]">팀</TableHead>
            <TableHead className="w-[8%]">상태</TableHead>
            <TableHead className="w-[14%]">작성일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge variant="secondary">진행중</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge variant="secondary">진행중</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge variant="secondary">진행중</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge variant="secondary">진행중</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge className="bg-primary-blue">종료됨</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge className="bg-primary-blue">종료됨</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge className="bg-primary-blue">종료됨</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge variant="grayish">정산완료</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [3M] 오피스채널 연말 행사_POP 3종 및 1동 덤빈
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge className="bg-primary-blue">종료됨</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
          <TableRow className="[&_td]:px-4 [&_td]:text-[13px]">
            <TableCell className="px-0!">
              <Button
                type="button"
                variant="svgIcon"
                className="hover:[&_svg]:fill-primary-yellow-500 hover:[&_svg]:text-primary-yellow-500 inline-block h-8 cursor-pointer p-2 text-gray-600">
                <Star />
              </Button>
            </TableCell>
            <TableCell className="px-0!">
              <Link to={'/'} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                K25-12345
              </Link>
            </TableCell>
            <TableCell>PMG</TableCell>
            <TableCell>Campaign, Event</TableCell>
            <TableCell className="text-left">
              <Link to={'/'} className="hover:underline">
                [Dell] FY26Q3_Product Enablement (10~12)
              </Link>
            </TableCell>
            <TableCell>3M</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>PM1</TableCell>
            <TableCell>
              <Badge className="bg-destructive">취소됨</Badge>
            </TableCell>
            <TableCell>2025-11-07</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="mt-5">
        <AppPagination
          totalPages={Math.ceil(10 / 5)}
          initialPage={1}
          visibleCount={5}
          onPageChange={(p) => {}} //부모 state 업데이트
        />
      </div>

      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>프로젝트 생성하기</DialogTitle>
            <DialogDescription>새 프로젝트 생성을 위한 정보를 입력해 주세요.</DialogDescription>
          </DialogHeader>

          <ProjectCreateForm onClose={() => setRegisterDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
