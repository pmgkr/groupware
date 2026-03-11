// _filters/ExpenseFilterMo.tsx
import { useState, useRef } from 'react';
import type { ExpenseFilterProps } from '../types/ExpenseFilterProps';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from '@/components/ui/select';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { MultiSelect, type MultiSelectRef } from '@/components/multiselect/multi-select';

import { Star, RefreshCw, ListFilter, X } from 'lucide-react';

export function ExpenseFilterMo(props: ExpenseFilterProps) {
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

  const [open, setOpen] = useState(false);
  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const [draftYear, setDraftYear] = useState(selectedYear);
  const [draftType, setDraftType] = useState(selectedType);
  const [draftProof, setDraftProof] = useState(selectedProof);
  const [draftProofStatus, setDraftProofStatus] = useState(selectedProofStatus);
  const [draftStatus, setDraftStatus] = useState(selectedStatus);
  const [draftSearch, setDraftSearch] = useState(searchInput);
  const activeMultiSelectRef = useRef<MultiSelectRef | null>(null); // Drawer 컴포넌트 내 MultiSelect 제어용

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
    setDraftSearch(searchInput);
  };

  const handleReset = () => {
    // 1. 부모 초기화
    onReset(activeTab);

    // 2. draft 상태 초기화
    setDraftYear(currentYear);
    setDraftType([]);
    setDraftProof([]);
    setDraftProofStatus([]);
    setDraftStatus([]);
    setDraftSearch('');

    // 3. MultiSelect UI 초기화
    typeRef.current?.clear();
    proofRef.current?.clear();
    proofStatusRef.current?.clear();
    statusRef.current?.clear();
  };

  const applyFilters = () => {
    onFilterChange('tab', activeTab);
    onFilterChange('year', draftYear);
    onFilterChange('type', draftType);
    onFilterChange('method', draftProof);
    onFilterChange('attach', draftProofStatus);
    onFilterChange('status', draftStatus);

    onSearchInputChange(draftSearch);
    onSearchSubmit(draftSearch);
  };

  const handleTabChange = (tab: 'all' | 'saved') => {
    onTabChange(tab);
    onFilterChange('tab', tab);
  };

  const handleApply = () => {
    applyFilters();

    if (activeMultiSelectRef.current) {
      activeMultiSelectRef.current.close();
    }

    requestAnimationFrame(() => {
      setOpen(false);
    });
  };

  return (
    <div className="mb-4">
      {/* 탭 */}
      <div className="mb-3 flex rounded-sm bg-gray-300 p-1">
        <Button
          onClick={() => handleTabChange('all')}
          className={`h-8 w-1/2 rounded-sm p-0 text-sm ${
            activeTab === 'all'
              ? 'bg-primary hover:bg-primary active:bg-primary text-white'
              : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
          }`}>
          전체
        </Button>
        <Button
          onClick={() => handleTabChange('saved')}
          className={`h-8 w-1/2 rounded-sm p-0 text-sm ${
            activeTab === 'saved'
              ? 'bg-primary hover:bg-primary active:bg-primary text-white'
              : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
          }`}>
          임시 저장
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-gray-500">
          <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="has-[>svg]:px-0"
                onClick={() => {
                  syncDraft();
                }}>
                <ListFilter className="size-4" /> 필터
              </Button>
            </DrawerTrigger>
            <DrawerContent className="pointer-events-auto">
              <DrawerHeader>
                <div className="flex justify-between">
                  <DrawerTitle className="text-left">상세 필터</DrawerTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="hover:text-primary-blue-500 text-gray-600"
                    onClick={handleReset}>
                    <RefreshCw className="size-4" /> 초기화
                  </Button>
                </div>
              </DrawerHeader>
              <div className="flex flex-col gap-y-2 px-4 pb-8">
                <>
                  <div>
                    <FilterTitle label="년도 선택" />
                    <Select value={draftYear} onValueChange={setDraftYear}>
                      <SelectTrigger className="w-full px-2">
                        <SelectValue placeholder="년도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}년
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                      {/* 증빙수단 다중 선택 */}
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
                      {/* 증빙상태 다중 선택 */}
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

                    <div className="flex-1">
                      <FilterTitle label="비용 상태" />
                      {/* 상태 다중 선택 */}
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
              </div>
              <DrawerFooter className="flex gap-2">
                <DrawerClose asChild>
                  <Button onClick={handleApply}>적용하기</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
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

function FilterTitle({ label }: { label: string }) {
  return <p className="mb-1 text-base font-medium text-gray-600">{label}</p>;
}
