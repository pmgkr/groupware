import { type AdminFilterProps } from '../types/AdminFilterProps';
import { DatePickerWithRange } from '@/components/date-n-time/date-picker-range';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@/components/multiselect/multi-select';
import { RefreshCw, X } from 'lucide-react';

export function AdminListFilter(props: AdminFilterProps) {
  const {
    yearOptions,

    selectedYear,
    selectedType,
    selectedStatus,
    selectedProof,
    selectedProofStatus,
    selectedDdate,

    typeOptions,
    statusOptions,
    proofMethod,
    proofStatusOptions,

    typeRef,
    statusRef,
    proofRef,
    proofStatusRef,
    checkedItems,
    searchInput,
    datePickerKey,
    selectedDateRange,

    onYearChange,
    onTypeChange,
    onStatusChange,
    onProofChange,
    onProofStatusChange,
    onDdateChange,
    onSearchInputChange,
    onSearchSubmit,
    onClearSearch,
    onDateRangeChange,

    onRefresh,
    onConfirm,
    onReject,
  } = props;

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        {/* Filter Group */}
        <div className="flex items-center gap-x-2">
          {/* 연도 */}
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger size="sm" className="px-2">
              <SelectValue placeholder="연도 선택" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y} size="sm">
                  {y}년
                </SelectItem>
              ))}
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

        {/* <Button size="sm" variant="destructive" onClick={onReject} disabled={checkedItems.length === 0}>
          반려하기
        </Button> */}
        <Button size="sm" onClick={onConfirm} disabled={checkedItems.length === 0}>
          지급하기
        </Button>
      </div>
    </div>
  );
}
