// _filters/ProjectFilterMobile.tsx
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ProjectFilterProps } from '../types/ProjectFilterProps';

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

import { Star, RefreshCw, ListFilter, X, Search } from 'lucide-react';

export function ProjectFilterMobile(props: ProjectFilterProps) {
  const {
    activeTab,
    yearOptions,
    selectedYear,
    selectedBrand,
    selectedCategory,
    selectedClient,
    selectedTeam,
    selectedStatus,
    searchInput,
    showFavoritesOnly,

    categoryRef,
    clientRef,
    teamRef,
    statusRef,

    categoryOptions,
    clientOptions,
    teamOptions,
    statusOptions,

    onTabChange,
    onFilterChange,
    onSearchInputChange,
    onSearchSubmit,
    onToggleFavorites,
    onReset,
    onCreate,
  } = props;

  /* ---------------- draft state ---------------- */
  type OpenKey = 'category' | 'client' | 'team' | 'status' | null;

  const [open, setOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(selectedYear);
  const [draftBrand, setDraftBrand] = useState(selectedBrand);
  const [draftCategory, setDraftCategory] = useState<string[]>(selectedCategory);
  const [draftClient, setDraftClient] = useState<string[]>(selectedClient);
  const [draftTeam, setDraftTeam] = useState<string[]>(selectedTeam);
  const [draftStatus, setDraftStatus] = useState<string[]>(selectedStatus);
  const [draftSearch, setDraftSearch] = useState(searchInput);

  const [openKey, setOpenKey] = useState<OpenKey>(null);

  const syncDraft = () => {
    setDraftYear(selectedYear);
    setDraftBrand(selectedBrand);
    setDraftCategory(selectedCategory);
    setDraftClient(selectedClient);
    setDraftTeam(selectedTeam);
    setDraftStatus(selectedStatus);
    setDraftSearch(searchInput);
  };

  const handleApply = () => {
    setOpen(false);

    requestAnimationFrame(() => {
      applyFilters();
    });
  };

  const applyFilters = () => {
    if (activeTab === 'others') {
      onFilterChange('project_year', draftYear);
    }

    onFilterChange('brand', draftBrand);
    onFilterChange('category', draftCategory);
    onFilterChange('client_id', draftClient);
    onFilterChange('team_id', draftTeam);
    onFilterChange('status', draftStatus);

    onSearchInputChange(draftSearch);
    onSearchSubmit();
  };

  return (
    <div className="mb-4 bg-white">
      <div className="mb-3 flex rounded-sm bg-gray-300 p-1">
        <Button
          onClick={() => onTabChange('mine')}
          className={`h-8 w-1/2 rounded-sm text-sm ${
            activeTab === 'mine'
              ? 'bg-primary hover:bg-primary active:bg-primary text-white'
              : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
          }`}>
          내 프로젝트
        </Button>
        <Button
          onClick={() => onTabChange('others')}
          className={`h-8 w-1/2 rounded-sm text-sm ${
            activeTab === 'others'
              ? 'bg-primary hover:bg-primary active:bg-primary text-white'
              : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
          }`}>
          전체 프로젝트
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-gray-500">
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
                  <Button type="button" variant="ghost" size="xs" className="hover:text-primary-blue-500 text-gray-600" onClick={onReset}>
                    <RefreshCw className="size-4" /> 초기화
                  </Button>
                </div>
              </DrawerHeader>
              <div className="flex flex-col gap-y-3 px-4 pb-8">
                <>
                  {activeTab === 'others' && (
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
                  )}

                  <div className="flex justify-between gap-2">
                    <div className="flex-1">
                      <FilterTitle label="소속 선택" />
                      <Select value={draftBrand} onValueChange={setDraftBrand}>
                        <SelectTrigger className="w-full px-2">
                          <SelectValue placeholder="소속 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="PMG">PMG</SelectItem>
                            <SelectItem value="MCS">MCS</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <FilterTitle label="카테고리 선택" />
                      <MultiSelect
                        ref={categoryRef}
                        className="w-full max-w-full min-w-auto!"
                        maxCount={0}
                        placeholder="카테고리 선택"
                        options={categoryOptions}
                        defaultValue={draftCategory}
                        onValueChange={setDraftCategory}
                        simpleSelect={true}
                        hideSelectAll={true}
                        modalPopover={true}
                        searchable={false}
                      />
                    </div>
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
                      hideSelectAll={true}
                      modalPopover={true}
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
                        hideSelectAll={true}
                        modalPopover={true}
                        searchable={false}
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
                        hideSelectAll={true}
                        modalPopover={true}
                        searchable={false}
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
          <Button
            size="sm"
            variant="ghost"
            className={`has-[>svg]:px-0 ${cn(showFavoritesOnly && 'text-primary-yellow-500')}`}
            onClick={onToggleFavorites}>
            <Star fill={showFavoritesOnly ? 'currentColor' : 'none'} className="size-4" /> 북마크
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onCreate}>
            프로젝트 생성
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterTitle({ label }: { label: string }) {
  return <p className="mb-1 text-base font-medium text-gray-600">{label}</p>;
}
