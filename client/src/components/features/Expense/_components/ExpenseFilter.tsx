import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { DatePickerWithRange } from '@/components/date-n-time/date-picker-range';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect } from '@/components/multiselect/multi-select';
import { RefreshCw, X } from 'lucide-react';

import type { ExpenseFilterProps, FilterTab } from '../types/ExpenseFilterProps';

const TAB_CONFIG: Record<string, { value: string; label: string }[]> = {
  manager: [
    { value: 'claimed', label: '승인 대기' },
    { value: 'all', label: '전체' },
  ],
  user: [
    { value: 'all', label: '전체' },
    { value: 'saved', label: '임시 저장' },
  ],
  mine: [
    { value: 'pexpense', label: '프로젝트 비용' },
    { value: 'nexpense', label: '일반 비용' },
  ],
};

export function ExpenseFilter({
  role,
  selectedYear,
  yearOptions,
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
  activeTab,
  onTabChange,
  selectedDdate,
  onDdateChange,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  datePickerKey,
  selectedDateRange,
  onDateRangeChange,
  checkedItems = [],
  onConfirm,
  onSAPRegi,
  onCreate,
}: ExpenseFilterProps) {
  const { user } = useAuth();
  const isSapManager = APP_CONFIG.SAP_MANAGERS.includes(user?.user_id ?? '');

  const hasTabs = role !== 'admin';
  const tabs = hasTabs ? (TAB_CONFIG[role] ?? []) : [];
  const showStatus = role !== 'manager' || activeTab === 'all';

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        {hasTabs && (
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                onClick={() => onTabChange?.(tab.value as FilterTab)}
                className={cn(
                  'h-8 w-18 rounded-sm p-0 text-sm',
                  activeTab === tab.value
                    ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                    : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
                )}>
                {tab.label}
              </Button>
            ))}
          </div>
        )}

        <div
          className={cn(
            'flex items-center gap-x-2',
            hasTabs && 'before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle'
          )}>
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

          {showStatus && (
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

          {role === 'admin' && (
            <Select value={selectedDdate} onValueChange={onDdateChange}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="지급예정일 유무" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem size="sm" value="Y">있음</SelectItem>
                <SelectItem size="sm" value="N">없음</SelectItem>
              </SelectContent>
            </Select>
          )}

          {role === 'admin' && (
            <DatePickerWithRange
              key={datePickerKey}
              className="[&_button]:text-muted-foreground [&_button]:h-8 [&_button]:gap-x-0.5 [&_button]:text-sm"
              selected={selectedDateRange}
              onSelect={onDateRangeChange}
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

      <div className="flex gap-2">
        {role === 'admin' && (
          <>
            <div className="relative">
              <Input
                className="max-w-42 pr-6"
                size="sm"
                placeholder="비용 제목 또는 작성자 검색"
                value={searchInput}
                onChange={(e) => onSearchInputChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearchSubmit?.();
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
            <Button size="sm" onClick={onConfirm} disabled={checkedItems.length === 0}>
              지급하기
            </Button>
            {isSapManager && (
              <Button size="sm" onClick={onSAPRegi} disabled={checkedItems.length === 0} className="bg-primary-pink-500 hover:bg-primary-pink">
                SAP등록
              </Button>
            )}
          </>
        )}

        {role === 'manager' && (
          <Button size="sm" onClick={onConfirm} disabled={checkedItems.length === 0}>
            승인하기
          </Button>
        )}

        {role === 'user' && (
          <Button size="sm" onClick={onCreate}>
            비용 작성하기
          </Button>
        )}
      </div>
    </div>
  );
}
