// _filters/ProjectFilterMobile.tsx
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ReportFilterProps } from '../types/ReportFilterProps';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { MultiSelect, type MultiSelectRef } from '@/components/multiselect/multi-select';

import { Star, RefreshCw, ListFilter, Lock, LockOpen } from 'lucide-react';

export function ReportFilterMobile(props: ReportFilterProps) {
  const {
    pageSize,
    onPageSizeChange,

    yearOptions,
    selectedYear,
    onYearChange,

    selectedClient,
    selectedTeam,
    selectedStatus,
    isLocked,

    clientOptions,
    teamOptions,
    statusOptions,

    clientRef,
    teamRef,
    statusRef,

    onClientChange,
    onTeamChange,
    onStatusChange,

    searchInput,
    onSearchInputChange,
    onSearchSubmit,
    onReset,

    onLockToggle,
  } = props;

  /* ---------------- draft state ---------------- */
  const [open, setOpen] = useState(false);
  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const [draftYear, setDraftYear] = useState(selectedYear);
  const [draftClient, setDraftClient] = useState<string[]>(selectedClient);
  const [draftTeam, setDraftTeam] = useState<string[]>(selectedTeam);
  const [draftStatus, setDraftStatus] = useState<string[]>(selectedStatus);
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
    setDraftClient(selectedClient);
    setDraftTeam(selectedTeam);
    setDraftStatus(selectedStatus);
    setDraftSearch(searchInput);
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

  const handleReset = () => {
    // 1. 부모 초기화
    onReset();

    // 2. draft 상태 초기화
    setDraftYear(currentYear);
    setDraftClient([]);
    setDraftTeam([]);
    setDraftStatus([]);
    setDraftSearch('');

    // 3. MultiSelect UI 초기화
    clientRef.current?.clear();
    teamRef.current?.clear();
    statusRef.current?.clear();
  };

  const applyFilters = () => {
    onYearChange(draftYear);
    onClientChange(draftClient);
    onTeamChange(draftTeam);
    onStatusChange(draftStatus);

    onSearchInputChange(draftSearch);
    onSearchSubmit();
  };

  return (
    <div className="mb-4 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500">
          <Drawer direction="bottom" open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button
                type="button"
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
              <div className="flex flex-col gap-y-3 px-4 pb-8">
                <>
                  <div>
                    <FilterTitle label="년도 선택" />
                    <Select value={selectedYear} onValueChange={onYearChange}>
                      <SelectTrigger className="w-full px-2">
                        <SelectValue />
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

                  <div>
                    <FilterTitle label="클라이언트 선택" />
                    <MultiSelect
                      ref={clientRef}
                      className="w-full max-w-full min-w-auto!"
                      maxCount={0}
                      placeholder="클라이언트"
                      options={clientOptions}
                      defaultValue={draftClient}
                      onValueChange={setDraftClient}
                      simpleSelect={true}
                      closeOnSelect={true}
                      hideSelectAll={true}
                      modalPopover={true}
                      onOpen={() => multiOpen(clientRef.current)}
                    />
                  </div>

                  <div className="flex justify-between gap-2">
                    <div className="flex-1">
                      <FilterTitle label="팀 선택" />
                      <MultiSelect
                        ref={teamRef}
                        className="w-full max-w-full min-w-auto!"
                        maxCount={0}
                        placeholder="팀 선택"
                        options={teamOptions}
                        defaultValue={draftTeam}
                        onValueChange={setDraftTeam}
                        simpleSelect={true}
                        closeOnSelect={true}
                        hideSelectAll={true}
                        modalPopover={true}
                        searchable={false}
                        onOpen={() => multiOpen(teamRef.current)}
                      />
                    </div>

                    <div className="flex-1">
                      <FilterTitle label="상태 선택" />
                      <MultiSelect
                        ref={statusRef}
                        className="w-full max-w-full min-w-auto!"
                        maxCount={0}
                        placeholder="상태 선택"
                        options={statusOptions}
                        defaultValue={draftStatus}
                        onValueChange={setDraftStatus}
                        simpleSelect={true}
                        closeOnSelect={true}
                        hideSelectAll={true}
                        modalPopover={true}
                        searchable={false}
                        onOpen={() => multiOpen(statusRef.current)}
                      />
                    </div>
                  </div>

                  <div>
                    <FilterTitle label="프로젝트 검색" />
                    <Input
                      className="w-full max-w-full"
                      placeholder="검색어 입력"
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('text-gray-500 has-[>svg]:px-0', isLocked === '' ? 'hover:text-primary-blue-500' : '[&_rect]:fill-gray-500')}
          onClick={onLockToggle}>
          {isLocked === 'N' ? <LockOpen className="size-4" /> : <Lock className="size-4" />} 보기
        </Button>
      </div>
    </div>
  );
}

function FilterTitle({ label }: { label: string }) {
  return <p className="mb-1 text-base font-medium text-gray-600">{label}</p>;
}
