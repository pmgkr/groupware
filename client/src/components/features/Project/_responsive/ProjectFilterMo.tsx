// _filters/ProjectFilterMobile.tsx
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
import { MultiSelect } from '@/components/multiselect/multi-select';

import { Star, RefreshCw, ListFilter, X } from 'lucide-react';

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
          <Drawer direction="bottom">
            <DrawerTrigger asChild>
              <Button size="sm" variant="ghost" className="has-[>svg]:px-0">
                <ListFilter className="size-3" /> 필터
              </Button>
            </DrawerTrigger>
            <DrawerContent className="pointer-events-auto">
              <DrawerHeader>
                <div className="flex justify-between">
                  <DrawerTitle className="text-left">상세 필터</DrawerTitle>
                  <Button type="button" variant="ghost" size="xs" className="hover:text-primary-blue-500 text-gray-600" onClick={onReset}>
                    <RefreshCw className="size-3" /> 초기화
                  </Button>
                </div>
              </DrawerHeader>
              <div className="flex flex-col gap-y-2 px-4 pb-8">
                <>
                  {activeTab === 'others' && (
                    <div>
                      <FilterTitle label="년도 선택" />
                      <Select value={selectedYear} onValueChange={(v) => onFilterChange('project_year', v)}>
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
                      <Select value={selectedBrand} onValueChange={(v) => onFilterChange('brand', v)}>
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
                        defaultValue={selectedCategory}
                        options={categoryOptions}
                        onValueChange={(v) => onFilterChange('category', v)}
                        simpleSelect={true}
                        hideSelectAll={true}
                        modalPopover={true}
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
                      defaultValue={selectedClient}
                      options={clientOptions}
                      onValueChange={(v) => onFilterChange('client_id', v)}
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
                        defaultValue={selectedTeam}
                        options={teamOptions}
                        onValueChange={(v) => onFilterChange('team_id', v)}
                        simpleSelect={true}
                        hideSelectAll={true}
                        modalPopover={true}
                      />
                    </div>

                    <div className="flex-1">
                      <FilterTitle label="상태 선택" />
                      <MultiSelect
                        ref={statusRef}
                        className="w-full max-w-full min-w-auto!"
                        maxCount={0}
                        placeholder="상태 선택"
                        defaultValue={selectedStatus}
                        options={statusOptions}
                        onValueChange={(v) => onFilterChange('status', v)}
                        simpleSelect={true}
                        hideSelectAll={true}
                        modalPopover={true}
                      />
                    </div>
                  </div>
                </>
              </div>
              {/* <DrawerFooter className="mt-5 border-t-1 border-gray-300">
                <DrawerClose asChild>
                  <Button type="button" size="full">
                    닫기
                  </Button>
                </DrawerClose>
              </DrawerFooter> */}
            </DrawerContent>
          </Drawer>
          <Button
            size="sm"
            variant="ghost"
            className={`has-[>svg]:px-0 ${cn(showFavoritesOnly && 'text-primary-yellow-500')}`}
            onClick={onToggleFavorites}>
            <Star fill={showFavoritesOnly ? 'currentColor' : 'none'} className="size-3" /> 북마크
          </Button>
        </div>

        <Button size="sm" onClick={onCreate}>
          프로젝트 생성
        </Button>
      </div>
    </div>
  );
}

function FilterTitle({ label }: { label: string }) {
  return <p className="mb-1 text-base font-medium text-gray-600">{label}</p>;
}
