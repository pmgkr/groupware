// components/ExpenseListFilter.tsx
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@/components/multiselect/multi-select';
import { RefreshCw } from 'lucide-react';

interface ExpenseListFilterProps {
  activeTab: 'pexpense' | 'nexpense';
  onTabChange: (tab: 'pexpense' | 'nexpense') => void;

  selectedYear: string;
  yearOptions: string[];
  selectedType: string[];
  selectedStatus: string[];
  selectedProof: string[];
  selectedProofStatus: string[];

  typeRef: React.RefObject<MultiSelectRef | null>;
  statusRef: React.RefObject<MultiSelectRef | null>;
  proofRef: React.RefObject<MultiSelectRef | null>;
  proofStatusRef: React.RefObject<MultiSelectRef | null>;

  typeOptions: MultiSelectOption[];
  statusOptions: MultiSelectOption[];
  proofMethod: MultiSelectOption[];
  proofStatusOptions: MultiSelectOption[];

  onYearChange: (val: string) => void;
  onTypeChange: (val: string[]) => void;
  onStatusChange: (val: string[]) => void;
  onProofChange: (val: string[]) => void;
  onProofStatusChange: (val: string[]) => void;

  onReset: () => void;
}

export function ExpenseMineFilter({
  activeTab,
  onTabChange,

  selectedYear,
  yearOptions,
  selectedType,
  selectedStatus,
  selectedProof,
  selectedProofStatus,
  typeRef,
  statusRef,
  proofRef,
  proofStatusRef,

  typeOptions,
  statusOptions,
  proofMethod,
  proofStatusOptions,

  onYearChange,
  onTypeChange,
  onStatusChange,
  onProofChange,
  onProofStatusChange,

  onReset,
}: ExpenseListFilterProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        {/* Tabs */}
        <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
          <Button
            onClick={() => onTabChange('pexpense')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'pexpense'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            프로젝트 비용
          </Button>

          <Button
            onClick={() => onTabChange('nexpense')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'nexpense'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            일반 비용
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
            className="max-w-[80px] min-w-auto!"
            placeholder="비용 용도"
            ref={typeRef}
            options={typeOptions}
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
            className="max-w-[80px] min-w-auto!"
            placeholder="증빙 수단"
            ref={proofRef}
            options={proofMethod}
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
            className="max-w-[80px] min-w-auto!"
            placeholder="증빙 상태"
            ref={proofStatusRef}
            options={proofStatusOptions}
            onValueChange={onProofStatusChange}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 상태 */}
          <MultiSelect
            size="sm"
            className="max-w-[80px] min-w-auto!"
            placeholder="비용 상태"
            ref={statusRef}
            options={statusOptions}
            onValueChange={onStatusChange}
            maxCount={0}
            hideSelectAll={true}
            autoSize={true}
            closeOnSelect={false}
            searchable={false}
            simpleSelect={true}
          />

          {/* 새로고침 */}
          <Button
            type="button"
            variant="svgIcon"
            size="icon"
            onClick={onReset}
            className="hover:text-primary-blue-500 size-6 text-gray-600 hover:rotate-45">
            <RefreshCw />
          </Button>
        </div>
      </div>
    </div>
  );
}
