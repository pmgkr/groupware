import type { ManagerFilterProps } from '../types/ManagerFilterProps';

import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@/components/multiselect/multi-select';
import { RefreshCw } from 'lucide-react';

export function ManagerFilterPC(props: ManagerFilterProps) {
  const {
    activeTab,
    onTabChange,

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

    checkedItems,
    onRefresh,
    onConfirm,
  } = props;

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        {/* Tabs */}
        <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
          <Button
            onClick={() => onTabChange('claimed')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'claimed'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            승인 대기
          </Button>

          <Button
            onClick={() => onTabChange('all')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'all'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            전체
          </Button>
        </div>

        {/* Filter Group */}
        <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
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
            hideSelectAll={true}
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
            hideSelectAll={true}
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
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 상태 */}
          {activeTab === 'all' && (
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

      {/* 승인하기 버튼 */}
      <Button size="sm" onClick={onConfirm} disabled={checkedItems.length === 0}>
        승인하기
      </Button>
    </div>
  );
}
