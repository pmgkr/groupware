import type { PExpenseFilterProps } from '../types/PExpenseFilterProps';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect } from '@/components/multiselect/multi-select';
import { RefreshCw, X } from 'lucide-react';

export function PExpenseFilterPC(props: PExpenseFilterProps) {
  const {
    role,
    activeTab,
    onTabChange,
    yearOptions,
    selectedYear,
    onYearChange,
    selectedType,
    selectedStatus,
    selectedProof,
    selectedProofStatus,
    typeOptions,
    statusOptions,
    proofMethod,
    proofStatusOptions,
    typeRef,
    statusRef,
    proofRef,
    proofStatusRef,
    onTypeChange,
    onStatusChange,
    onProofChange,
    onProofStatusChange,
    onRefresh,
    checkedItems,
    onConfirm,
    searchInput,
    onSearchInputChange,
    onSearchSubmit,
    data,
    onCreate,
  } = props;

  const tabs =
    role === 'manager'
      ? [
          { value: 'claimed', label: '승인 대기' },
          { value: 'all', label: '전체' },
        ]
      : [
          { value: 'all', label: '전체' },
          { value: 'saved', label: '임시 저장' },
        ];

  const showStatusFilter = role === 'user' || activeTab === 'all';

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        {/* 탭 */}
        <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
          {tabs.map(({ value, label }) => (
            <Button
              key={value}
              onClick={() => onTabChange(value as any)}
              className={`h-8 w-18 rounded-sm p-0 text-sm ${
                activeTab === value
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              }`}>
              {label}
            </Button>
          ))}
        </div>

        {/* 필터 그룹 */}
        <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
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

          <MultiSelect
            size="sm"
            className="max-w-[88px] min-w-auto!"
            placeholder="비용 용도"
            ref={typeRef}
            options={typeOptions}
            defaultValue={selectedType}
            onValueChange={onTypeChange}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          <MultiSelect
            size="sm"
            className="max-w-[88px] min-w-auto!"
            placeholder="증빙 수단"
            ref={proofRef}
            options={proofMethod}
            defaultValue={selectedProof}
            onValueChange={onProofChange}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          <MultiSelect
            size="sm"
            className="max-w-[88px] min-w-auto!"
            placeholder="증빙 상태"
            ref={proofStatusRef}
            options={proofStatusOptions}
            defaultValue={selectedProofStatus}
            onValueChange={onProofStatusChange}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {showStatusFilter && (
            <MultiSelect
              size="sm"
              className="max-w-[88px] min-w-auto!"
              placeholder="비용 상태"
              ref={statusRef}
              options={statusOptions}
              defaultValue={selectedStatus}
              onValueChange={onStatusChange}
              maxCount={0}
              hideSelectAll={true}
              autoSize={true}
              closeOnSelect={false}
              searchable={false}
              simpleSelect={true}
            />
          )}

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

      {/* 우측 */}
      {role === 'manager' ? (
        <Button size="sm" onClick={onConfirm} disabled={(checkedItems?.length ?? 0) === 0}>
          승인하기
        </Button>
      ) : (
        <div className="flex gap-x-2">
          <div className="relative">
            <Input
              className="max-w-42"
              size="sm"
              placeholder="비용 제목 또는 작성자 검색"
              value={searchInput}
              onChange={(e) => onSearchInputChange?.(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.(searchInput ?? '')}
            />
            {searchInput && (
              <Button
                type="button"
                variant="svgIcon"
                className="absolute top-1/2 right-0 h-full w-6 -translate-y-[50%] px-0 text-gray-500"
                onClick={onRefresh}>
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          {data?.project_status === 'in-progress' && data?.is_locked === 'N' && (
            <Button size="sm" onClick={onCreate}>
              비용 작성하기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
