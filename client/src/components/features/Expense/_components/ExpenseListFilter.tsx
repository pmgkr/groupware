// components/ExpenseListFilter.tsx
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@/components/multiselect/multi-select';
import { RefreshCw } from 'lucide-react';

interface ExpenseListFilterProps {
  activeTab: 'all' | 'saved';
  onTabChange: (tab: 'all' | 'saved') => void;

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

  onYearChange: (val: string) => void;
  onTypeChange: (val: string[]) => void;
  onStatusChange: (val: string[]) => void;
  onProofChange: (val: string[]) => void;
  onProofStatusChange: (val: string[]) => void;

  onRefresh: () => void;
  onOpenRegisterDialog: () => void;
}

export function ExpenseListFilter({
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

  onYearChange,
  onTypeChange,
  onStatusChange,
  onProofChange,
  onProofStatusChange,

  onRefresh,
  onOpenRegisterDialog,
}: ExpenseListFilterProps) {
  // 필터 옵션 정의
  const statusOptions: MultiSelectOption[] = [
    { label: '임시저장', value: 'Saved' },
    { label: '승인대기', value: 'Claimed' },
    { label: '승인완료', value: 'Confirmed' },
    { label: '지급대기', value: 'Approved' },
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
        {/* Tabs */}
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

        {/* Filter Group */}
        <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
          {/* 연도 */}
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger size="sm">
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
            className="max-w-[80px] min-w-auto!"
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
            className="max-w-[80px] min-w-auto!"
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
          <MultiSelect
            size="sm"
            className="max-w-[80px] min-w-auto!"
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

      {/* 비용 작성하기 버튼 */}
      <Button size="sm" onClick={onOpenRegisterDialog}>
        비용 작성하기
      </Button>
    </div>
  );
}
