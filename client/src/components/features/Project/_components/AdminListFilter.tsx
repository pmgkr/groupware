import type { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/date-n-time/date-picker-range';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@/components/multiselect/multi-select';
import { RefreshCw, X } from 'lucide-react';

interface ExpenseListFilterProps {
  selectedYear: string;
  selectedType: string[];
  selectedStatus: string[];
  selectedProof: string[];
  selectedProofStatus: string[];
  selectedDdate: string;

  typeRef: React.RefObject<MultiSelectRef | null>;
  statusRef: React.RefObject<MultiSelectRef | null>;
  proofRef: React.RefObject<MultiSelectRef | null>;
  proofStatusRef: React.RefObject<MultiSelectRef | null>;

  typeOptions: MultiSelectOption[];
  checkedItems: number[];

  onYearChange: (val: string) => void;
  onTypeChange: (val: string[]) => void;
  onStatusChange: (val: string[]) => void;
  onProofChange: (val: string[]) => void;
  onProofStatusChange: (val: string[]) => void;
  onDdateChange: (val: string) => void;

  onRefresh: () => void;
  onConfirm: () => void;
  onReject: () => void;

  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;

  datePickerKey: number;
  selectedDateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function AdminListFilter({
  selectedYear,
  selectedType,
  selectedStatus,
  selectedProof,
  selectedProofStatus,
  selectedDdate,
  typeRef,
  statusRef,
  proofRef,
  proofStatusRef,

  typeOptions,

  checkedItems,

  onYearChange,
  onTypeChange,
  onStatusChange,
  onProofChange,
  onProofStatusChange,
  onDdateChange,

  onRefresh,
  onConfirm,
  onReject,

  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,

  datePickerKey,
  selectedDateRange,
  onDateRangeChange,
}: ExpenseListFilterProps) {
  // 필터 옵션 정의
  const statusOptions: MultiSelectOption[] = [
    { label: '임시저장', value: 'Saved' },
    { label: '승인대기', value: 'Claimed' },
    { label: '승인완료', value: 'Confirmed' },
    // { label: '지급대기', value: 'Waiting' },
    { label: '지급완료', value: 'Completed' },
    { label: '반려됨', value: 'Rejected' },
  ];

  const proofMethod: MultiSelectOption[] = [
    { label: 'PMG', value: 'PMG' },
    { label: 'MCS', value: 'MCS' },
    { label: '개인카드', value: '개인카드' },
    { label: '세금계산서', value: '세금계산서' },
    { label: '현금영수증', value: '현금영수증' },
    { label: '기타', value: '기타' },
  ];

  const proofStatusOptions: MultiSelectOption[] = [
    { label: '제출', value: 'Y' },
    { label: '미제출', value: 'N' },
  ];

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        {/* Filter Group */}
        <div className="flex items-center gap-x-2">
          {/* 연도 */}
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="연도 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem size="sm" value="2025">
                2025
              </SelectItem>
              <SelectItem size="sm" value="2026">
                2026
              </SelectItem>
            </SelectContent>
          </Select>

          {/* 용도 */}
          <MultiSelect
            size="sm"
            className="max-w-[88px] min-w-auto!"
            placeholder="비용 용도"
            ref={typeRef}
            options={typeOptions}
            defaultValue={selectedType}
            onValueChange={onTypeChange}
            maxCount={0}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 증빙수단 */}
          <MultiSelect
            size="sm"
            className="max-w-[88px] min-w-auto!"
            placeholder="증빙 수단"
            ref={proofRef}
            options={proofMethod}
            defaultValue={selectedProof}
            onValueChange={onProofChange}
            maxCount={0}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 증빙상태 */}
          <MultiSelect
            size="sm"
            className="max-w-[88px] min-w-auto!"
            placeholder="증빙 상태"
            ref={proofStatusRef}
            options={proofStatusOptions}
            defaultValue={selectedProofStatus}
            onValueChange={onProofStatusChange}
            maxCount={0}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 상태 */}
          <MultiSelect
            size="sm"
            className="max-w-[88px] min-w-auto!"
            placeholder="비용 상태"
            ref={statusRef}
            options={statusOptions}
            defaultValue={selectedStatus}
            onValueChange={onStatusChange}
            maxCount={0}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 지급예정일 */}
          <Select value={selectedDdate} onValueChange={onDdateChange}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="지급예정일 유무" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem size="sm" value="Y">
                있음
              </SelectItem>
              <SelectItem size="sm" value="N">
                없음
              </SelectItem>
            </SelectContent>
          </Select>

          <DatePickerWithRange
            key={datePickerKey}
            className="[&_button]:text-muted-foreground [&_button]:h-8 [&_button]:gap-x-0.5 [&_button]:text-sm"
            selected={selectedDateRange}
            onSelect={onDateRangeChange}
          />

          {/* 새로고침 */}
          <Button
            type="button"
            variant="svgIcon"
            size="icon"
            onClick={onRefresh}
            className="hover:text-primary-blue-500 size-6 text-gray-600 hover:rotate-45">
            <RefreshCw />
          </Button>
        </div>
      </div>

      {/* 우측 필터 */}
      <div className="flex gap-2">
        <div className="relative">
          <Input
            className="max-w-42 pr-6"
            size="sm"
            placeholder="비용 제목 또는 작성자 검색"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchSubmit();
              }
            }}
          />

          {searchInput && (
            <Button
              type="button"
              variant="svgIcon"
              className="absolute top-0 right-0 h-full w-6 px-0 text-gray-500"
              onClick={onClearSearch}>
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        <Button size="sm" variant="destructive" onClick={onReject} disabled={checkedItems.length === 0}>
          반려하기
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={checkedItems.length === 0}>
          지급하기
        </Button>
      </div>
    </div>
  );
}
