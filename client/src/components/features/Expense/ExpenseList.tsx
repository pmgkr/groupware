import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';
import { MultiSelect } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';

export default function ExpenseList() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            <Button className="bg-primary h-8 w-18 rounded-sm p-0 text-sm text-white">전체</Button>
            <Button className="text-muted-foreground h-8 w-18 rounded-sm bg-transparent p-0 text-sm">임시 저장</Button>
          </div>
          <div className="flex items-center before:mx-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
            <Select defaultValue="2025">
              <SelectTrigger size="sm">
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem size="sm" value="2025">
                    2025
                  </SelectItem>
                  <SelectItem size="sm" value="2024">
                    2024
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button size="sm">비용 작성하기</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[10%]">EXP#</TableHead>
            <TableHead className="w-[8%]">비용 용도</TableHead>
            <TableHead className="w-[16%]">비용 제목</TableHead>
            <TableHead className="w-[8%]">증빙 수단</TableHead>
            <TableHead className="w-[8%]">증빙 상태</TableHead>
            <TableHead className="w-[10%]">합계 금액</TableHead>
            <TableHead className="w-[12%]">상태</TableHead>
            <TableHead className="w-[12%]">작성자</TableHead>
            <TableHead className="w-[16%]">작성 일시</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>EXP202307040001</TableCell>
            <TableCell>교통비</TableCell>
            <TableCell>출장 교통비</TableCell>
            <TableCell>영수증</TableCell>
            <TableCell>
              <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">
                제출
              </Badge>
            </TableCell>
            <TableCell>45,000원</TableCell>
            <TableCell>
              <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">
                승인대기
              </Badge>
            </TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>2025-07-04 14:44:00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
}
