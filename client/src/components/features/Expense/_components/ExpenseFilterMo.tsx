import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { DatePickerWithRange } from '@/components/date-n-time/date-picker-range';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { MultiSelect, type MultiSelectRef } from '@/components/multiselect/multi-select';
import { ListFilter, RefreshCw } from 'lucide-react';

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

export function ExpenseFilterMo({
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

  const currentYear = String(new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(selectedYear);
  const [draftType, setDraftType] = useState(selectedType);
  const [draftProof, setDraftProof] = useState(selectedProof);
  const [draftProofStatus, setDraftProofStatus] = useState(selectedProofStatus);
  const [draftStatus, setDraftStatus] = useState(selectedStatus);
  const [draftDdate, setDraftDdate] = useState(selectedDdate ?? '');
  const [draftDateRange, setDraftDateRange] = useState(selectedDateRange);
  const [draftSearch, setDraftSearch] = useState(searchInput ?? '');

  const activeMultiSelectRef = useRef<MultiSelectRef | null>(null);

  const multiOpen = (ref: MultiSelectRef | null) => {
    if (!ref) return;
    if (activeMultiSelectRef.current && activeMultiSelectRef.current !== ref) {
      activeMultiSelectRef.current.close();
    }
    activeMultiSelectRef.current = ref;
  };

  const syncDraft = () => {
    setDraftYear(selectedYear);
    setDraftType(selectedType);
    setDraftProof(selectedProof);
    setDraftProofStatus(selectedProofStatus);
    setDraftStatus(selectedStatus);
    if (role === 'admin') {
      setDraftDdate(selectedDdate ?? '');
      setDraftDateRange(selectedDateRange);
      setDraftSearch(searchInput ?? '');
    }
  };

  const handleReset = () => {
    onRefresh();
    setDraftYear(currentYear);
    setDraftType([]);
    setDraftProof([]);
    setDraftProofStatus([]);
    setDraftStatus([]);
    if (role === 'admin') {
      setDraftDdate('');
      setDraftDateRange(undefined);
      setDraftSearch('');
      onClearSearch?.();
    }
    typeRef.current?.clear();
    proofRef.current?.clear();
    proofStatusRef.current?.clear();
    statusRef.current?.clear();
  };

  const applyFilters = () => {
    onYearChange(draftYear);
    onTypeChange(draftType);
    onProofChange(draftProof);
    onProofStatusChange(draftProofStatus);
    const statusToApply = role === 'manager' && activeTab !== 'all' ? [] : draftStatus;
    onStatusChange(statusToApply);
    if (role === 'admin') {
      onDdateChange?.(draftDdate);
      onDateRangeChange?.(draftDateRange);
      onSearchInputChange?.(draftSearch);
      onSearchSubmit?.(draftSearch);
    }
  };

  const handleApply = () => {
    applyFilters();
    activeMultiSelectRef.current?.close();
    requestAnimationFrame(() => setOpen(false));
  };

  const handleTabChange = (tab: FilterTab) => {
    onTabChange?.(tab);
    syncDraft();
  };

  const hasTabs = role !== 'admin';
  const tabs = hasTabs ? (TAB_CONFIG[role] ?? []) : [];
  const showStatus = role !== 'manager' || activeTab === 'all';

  return (
    <div className="mb-4">
      {hasTabs && (
        <div className="mb-3 flex rounded-sm bg-gray-300 p-1">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => handleTabChange(tab.value as FilterTab)}
              className={cn(
                'h-8 w-1/2 rounded-sm p-0 text-sm',
                activeTab === tab.value
                  ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                  : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
              )}>
              {tab.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-gray-500">
          <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" variant="ghost" className="has-[>svg]:px-0" onClick={syncDraft}>
                <ListFilter className="size-4" /> 필터
              </Button>
            </DrawerTrigger>
            <DrawerContent className="pointer-events-auto">
              <DrawerHeader>
                <div className="flex justify-between">
                  <DrawerTitle className="text-left">상세 필터</DrawerTitle>
                  <Button type="button" variant="ghost" size="xs" className="hover:text-primary-blue-500 text-gray-600" onClick={handleReset}>
                    <RefreshCw className="size-4" /> 초기화
                  </Button>
                </div>
              </DrawerHeader>

              <div className="flex flex-col gap-y-2 px-4 pb-8">
                {role === 'admin' ? (
                  <div className="flex justify-between gap-2">
                    <div className="flex-1">
                      <FilterTitle label="년도 선택" />
                      <Select value={draftYear} onValueChange={setDraftYear}>
                        <SelectTrigger className="w-full px-2">
                          <SelectValue placeholder="년도 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((y) => (
                            <SelectItem key={y} value={y}>{y}년</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <FilterTitle label="지급예정일 유무" />
                      <Select value={draftDdate} onValueChange={setDraftDdate}>
                        <SelectTrigger className="w-full px-2">
                          <SelectValue placeholder="지급예정일 유무" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">있음</SelectItem>
                          <SelectItem value="N">없음</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <FilterTitle label="년도 선택" />
                    <Select value={draftYear} onValueChange={setDraftYear}>
                      <SelectTrigger className="w-full px-2">
                        <SelectValue placeholder="년도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={y}>{y}년</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-between gap-2">
                  <div className="flex-1">
                    <FilterTitle label="비용 용도" />
                    <MultiSelect
                      className="w-full max-w-full min-w-auto!"
                      placeholder="비용 용도"
                      ref={typeRef}
                      options={typeOptions}
                      defaultValue={draftType}
                      onValueChange={setDraftType}
                      maxCount={0}
                      hideSelectAll={true}
                      closeOnSelect={true}
                      searchable={false}
                      simpleSelect={true}
                      modalPopover={true}
                      onOpen={() => multiOpen(typeRef.current)}
                    />
                  </div>
                  <div className="flex-1">
                    <FilterTitle label="증빙 수단" />
                    <MultiSelect
                      className="w-full max-w-full min-w-auto!"
                      placeholder="증빙 수단"
                      ref={proofRef}
                      options={proofMethod}
                      defaultValue={draftProof}
                      onValueChange={setDraftProof}
                      maxCount={0}
                      hideSelectAll={true}
                      closeOnSelect={true}
                      searchable={false}
                      simpleSelect={true}
                      modalPopover={true}
                      onOpen={() => multiOpen(proofRef.current)}
                    />
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <div className="flex-1">
                    <FilterTitle label="증빙 상태" />
                    <MultiSelect
                      className="w-full max-w-full min-w-auto!"
                      placeholder="증빙 상태"
                      ref={proofStatusRef}
                      options={proofStatusOptions}
                      defaultValue={draftProofStatus}
                      onValueChange={setDraftProofStatus}
                      maxCount={0}
                      hideSelectAll={true}
                      closeOnSelect={true}
                      searchable={false}
                      simpleSelect={true}
                      modalPopover={true}
                      onOpen={() => multiOpen(proofStatusRef.current)}
                    />
                  </div>
                  {showStatus && (
                    <div className="flex-1">
                      <FilterTitle label="비용 상태" />
                      <MultiSelect
                        className="w-full max-w-full min-w-auto!"
                        placeholder="비용 상태"
                        ref={statusRef}
                        options={statusOptions}
                        defaultValue={draftStatus}
                        onValueChange={setDraftStatus}
                        maxCount={0}
                        hideSelectAll={true}
                        closeOnSelect={true}
                        searchable={false}
                        simpleSelect={true}
                        modalPopover={true}
                        onOpen={() => multiOpen(statusRef.current)}
                      />
                    </div>
                  )}
                </div>

                {role === 'admin' && (
                  <>
                    <div>
                      <FilterTitle label="검색 날짜 범위" />
                      <DatePickerWithRange
                        key={datePickerKey}
                        className="[&_button]:text-muted-foreground [&_button]:h-10 [&_button]:gap-x-0.5 [&_button]:text-[13px]"
                        selected={draftDateRange}
                        onSelect={setDraftDateRange}
                      />
                    </div>
                    <div>
                      <FilterTitle label="비용 검색" />
                      <Input
                        className="w-full max-w-full"
                        placeholder="비용 제목 또는 작성자 검색"
                        value={draftSearch}
                        onChange={(e) => setDraftSearch(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <DrawerFooter className="flex gap-2">
                <DrawerClose asChild>
                  <Button onClick={handleApply}>적용하기</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <div className="flex gap-2">
          {role === 'admin' && (
            <>
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
    </div>
  );
}

function FilterTitle({ label }: { label: string }) {
  return <p className="mb-1 text-base font-medium text-gray-600">{label}</p>;
}
