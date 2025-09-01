import { getImageUrl } from '@/utils';
import { SectionHeader } from '@components/ui/SectionHeader';
import { Button } from '@components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@components/ui/pagination';
import { Badge } from '@components/ui/badge';
import { PlaceMin, MailMin, PhoneMin, Edit, Add, Delete } from '@/assets/images/icons';

export default function Mypage() {
  return (
    <>
      <section className="flex flex-col gap-y-5">
        <div className="flex items-center gap-x-14 rounded-md border border-gray-300 px-20 py-6">
          <div className="relative aspect-square w-36 overflow-hidden rounded-[50%]">
            <img src={getImageUrl('dummy/profile')} alt="프로필 이미지" className="h-full w-full object-cover" />
          </div>
          <div className="text-base font-medium tracking-tight text-gray-950">
            <div className="flex items-center gap-x-1.5 text-[.875em] text-gray-500">
              Seoul, Korea <PlaceMin className="inline-block size-3.5" />
            </div>
            <div className="my-2.5">
              <strong className="block text-[1.5em] font-bold">Yeaji Kim</strong>
              Front-end Developer
            </div>
            <ul className="flex items-center gap-x-4 text-[.875em] font-normal">
              <li className="flex items-center gap-x-1.5">
                <MailMin className="size-5" />
                <span>yeaji.kim@pmgasia.com</span>
              </li>
              <li className="flex items-center gap-x-1.5">
                <PhoneMin className="size-5" />
                <span>010-0000-0000</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="rounded-md border border-gray-300 px-18.5 py-12.5">
          <SectionHeader
            title="프로필 수정"
            buttonText="수정"
            buttonIcon={<Edit className="size-4" />}
            onButtonClick={() => console.log('프로필 수정')}
          />
          <div className="mb-12 grid grid-cols-4 gap-y-6 tracking-tight">
            <div className="pr-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">팀 이름</strong>
              <span>Developer Team</span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">생년월일</strong>
              <span>1993-04-27</span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">입사일</strong>
              <span>2021-01-01</span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">주소</strong>
              <span>서울시 강남구 테헤란로 132 한독약품빌딩</span>
            </div>
            <div className="pr-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">회원 레벨</strong>
              <span>
                <Badge>Level 2</Badge>
              </span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">비상 연락망</strong>
              <span>홍길동, 동거인, 010-0000-0000</span>
            </div>
            <div className="short-v-divider px-5 text-base leading-[1.5] text-gray-700">
              <strong className="mb-1 block text-[1.14em] font-bold text-gray-950">대표 은행계좌</strong>
              <span>우리 1000-000-000000 김예지</span>
            </div>
          </div>
          <SectionHeader
            title="은행계좌 목록"
            buttonText="계좌 추가"
            buttonIcon={<Add className="size-4" />}
            onButtonClick={() => console.log('프로필 수정')}
          />
          <div>
            <Table className="mb-6">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16%]">별명</TableHead>
                  <TableHead className="w-[16%]">은행명</TableHead>
                  <TableHead className="w-[16%]">계좌</TableHead>
                  <TableHead className="w-[18%]">계좌 번호</TableHead>
                  <TableHead className="w-[22%]">등록일시</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>국민은행 계좌</TableCell>
                  <TableCell>국민은행</TableCell>
                  <TableCell>홍길동</TableCell>
                  <TableCell>500-1234-5678</TableCell>
                  <TableCell>2025-07-04 14:44:00</TableCell>
                  <TableCell>
                    <Button variant="svgIcon" size="icon">
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="svgIcon" size="icon">
                      <Delete className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>우리은행 계좌</TableCell>
                  <TableCell>우리은행</TableCell>
                  <TableCell>홍길동</TableCell>
                  <TableCell>500-1234-5678</TableCell>
                  <TableCell>2025-07-04 14:44:00</TableCell>
                  <TableCell>
                    <Button variant="svgIcon" size="icon">
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="svgIcon" size="icon">
                      <Delete className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>국민은행 계좌</TableCell>
                  <TableCell>국민은행</TableCell>
                  <TableCell>홍길동</TableCell>
                  <TableCell>500-1234-5678</TableCell>
                  <TableCell>2025-07-04 14:44:00</TableCell>
                  <TableCell>
                    <Button variant="svgIcon" size="icon">
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="svgIcon" size="icon">
                      <Delete className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </section>
    </>
  );
}
