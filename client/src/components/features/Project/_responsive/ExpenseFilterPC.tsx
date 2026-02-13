// _filters/ExpenseFilterPC.tsx
import type { ExpenseFilterProps } from '../types/ExpenseFilterProps';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from '@/components/ui/select';
import { MultiSelect } from '@/components/multiselect/multi-select';

import { RefreshCw, X } from 'lucide-react';

export function ExpenseFilterPC(props: ExpenseFilterProps) {
  const {
    data,
    activeTab,
    yearOptions,
    selectedYear,
    selectedType,
    selectedStatus,
    selectedProof,
    selectedProofStatus,
    searchInput,

    typeRef,
    statusRef,
    proofRef,
    proofStatusRef,

    typeOptions,
    statusOptions,
    proofMethod,
    proofStatusOptions,

    onTabChange,
    onFilterChange,
    onSearchInputChange,
    onSearchSubmit,
    onReset,
    onCreate,
  } = props;

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        {/* 탭 */}
        <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
          <Button
            onClick={() => onTabChange('all')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'all'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            전체
          </Button>
          <Button
            onClick={() => onTabChange('saved')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'saved'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            임시 저장
          </Button>
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300">
          <Select value={selectedYear} onValueChange={(v) => onFilterChange('year', v)}>
            <SelectTrigger size="sm" className="px-2">
              <SelectValue placeholder="년도 선택" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem size="sm" key={y} value={y}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <MultiSelect
            className="max-w-[80px] min-w-auto!"
            size="sm"
            placeholder="비용 용도"
            ref={typeRef}
            options={typeOptions}
            defaultValue={selectedType}
            onValueChange={(v) => onFilterChange('type', v)}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 증빙수단 다중 선택 */}
          <MultiSelect
            className="max-w-[80px] min-w-auto!"
            size="sm"
            placeholder="증빙 수단"
            ref={proofRef}
            options={proofMethod}
            defaultValue={selectedProof}
            onValueChange={(v) => onFilterChange('method', v)}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 증빙상태 다중 선택 */}
          <MultiSelect
            className="max-w-[80px] min-w-auto!"
            size="sm"
            placeholder="증빙 상태"
            ref={proofStatusRef}
            options={proofStatusOptions}
            defaultValue={selectedProofStatus}
            onValueChange={(v) => onFilterChange('attach', v)}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 상태 다중 선택 */}
          <MultiSelect
            className="max-w-[80px] min-w-auto!"
            size="sm"
            placeholder="비용 상태"
            ref={statusRef}
            options={statusOptions}
            defaultValue={selectedStatus}
            onValueChange={(v) => onFilterChange('status', v)}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          <Button
            variant="svgIcon"
            size="icon"
            className="hover:text-primary-blue-500 size-6 text-gray-600"
            onClick={() => onReset(activeTab)}>
            <RefreshCw />
          </Button>
        </div>
      </div>

      <div className="flex gap-x-2">
        <div className="relative">
          <Input
            className="max-w-42"
            size="sm"
            placeholder="비용 제목 또는 작성자 검색"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit(searchInput)}
          />

          {searchInput && (
            <Button
              type="button"
              variant="svgIcon"
              className="absolute top-1/2 right-0 h-full w-6 -translate-y-[50%] px-0 text-gray-500"
              onClick={() => onReset(activeTab)}>
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {data.project_status === 'in-progress' && data.is_locked === 'N' && (
          <Button size="sm" onClick={onCreate}>
            비용 작성하기
          </Button>
        )}
      </div>
    </div>
  );
}
