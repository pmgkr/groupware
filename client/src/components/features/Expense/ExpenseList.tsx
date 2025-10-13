import { Link } from 'react-router';
import { useState } from 'react';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';
import { MultiSelect, type MultiSelectOption } from '@components/multiselect/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ExpenseList() {
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedProof, setSelectedProof] = useState<string[]>([]);
  const [selectedProofStatus, setSelectedProofStatus] = useState<string[]>([]);

  // 필터 옵션 정의
  const typeOptions: MultiSelectOption[] = [
    { label: '야근식대', value: '야근식대' },
    { label: '야근교통비', value: '야근교통비' },
    { label: '소모품비', value: '소모품비' },
  ];

  const statusOptions: MultiSelectOption[] = [
    { label: '임시저장', value: '임시저장' },
    { label: '승인대기', value: '승인대기' },
    { label: '승인완료', value: '승인완료' },
    { label: '지급완료', value: '지급완료' },
    { label: '반려됨', value: '반려됨' },
  ];

  const proofOptions: MultiSelectOption[] = [
    { label: 'PMG 법인', value: 'PMG 법인' },
    { label: 'MCS 법인', value: 'MCS 법인' },
    { label: '개인카드', value: '개인카드' },
    { label: '세금계산서', value: '세금계산서' },
    { label: '현금영수증', value: '현금영수증' },
  ];

  const proofStatusOptions: MultiSelectOption[] = [
    { label: '제출', value: '제출' },
    { label: '미제출', value: '미제출' },
    { label: '검토중', value: '검토중' },
    { label: '완료', value: '완료' },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            <Button className="bg-primary h-8 w-18 rounded-sm p-0 text-sm text-white hover:shadow-none">전체</Button>
            <Button className="text-muted-foreground h-8 w-18 rounded-sm bg-transparent p-0 text-sm hover:shadow-none">임시 저장</Button>
          </div>

          <div className="flex items-center gap-x-2 before:mx-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
            {/* 연도 단일 선택 */}
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

            {/* 용도 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="용도 선택"
              options={typeOptions}
              onValueChange={setSelectedType}
              defaultValue={[]}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
            />

            {/* 상태 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="상태 선택"
              options={statusOptions}
              onValueChange={setSelectedStatus}
              defaultValue={[]}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
            />

            {/* 증빙수단 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="증빙 수단"
              options={proofOptions}
              onValueChange={setSelectedProof}
              defaultValue={[]}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
            />

            {/* 증빙상태 다중 선택 */}
            <MultiSelect
              className="max-w-[80px] min-w-auto!"
              size="sm"
              placeholder="증빙 상태"
              options={proofStatusOptions}
              onValueChange={setSelectedProofStatus}
              defaultValue={[]}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
            />
          </div>
        </div>

        <Button size="sm">비용 작성하기</Button>
      </div>

      <Table variant="primary" align="left">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[10%]">EXP#</TableHead>
            <TableHead className="w-[9%]">비용 용도</TableHead>
            <TableHead className="text-center">비용 제목</TableHead>
            <TableHead className="w-[8%]">증빙 수단</TableHead>
            <TableHead className="w-[8%]">증빙 상태</TableHead>
            <TableHead className="w-[10%]">합계 금액</TableHead>
            <TableHead className="w-[8%]">상태</TableHead>
            <TableHead className="w-[12%]">작성자</TableHead>
            <TableHead className="w-[16%]">작성 일시</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* TODO: 여기에 DB 데이터 매핑 */}
          <TableRow>
            <TableCell>
              <Link to="/expense/1" className="rounded-[4px] border-1 p-1 text-sm">
                PN25-27564
              </Link>
            </TableCell>
            <TableCell>야근교통비</TableCell>
            <TableCell>야근교통비 3건</TableCell>
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
