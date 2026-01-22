// _filters/ProjectFilterPC.tsx
import { cn } from '@/lib/utils';
import type { ProjectFilterProps } from '../types/ProjectFilterProps';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from '@/components/ui/select';
import { MultiSelect } from '@/components/multiselect/multi-select';

import { Star, RefreshCw } from 'lucide-react';

export function ProjectFilterPC(props: ProjectFilterProps) {
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
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        {/* 탭 */}
        <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
          <Button
            onClick={() => onTabChange('mine')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'mine'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            내 프로젝트
          </Button>
          <Button
            onClick={() => onTabChange('others')}
            className={`h-8 w-18 rounded-sm p-0 text-sm ${
              activeTab === 'others'
                ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
            }`}>
            전체 프로젝트
          </Button>
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300">
          {activeTab === 'others' && (
            <Select value={selectedYear} onValueChange={(v) => onFilterChange('project_year', v)}>
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
          )}

          <Select value={selectedBrand} onValueChange={(v) => onFilterChange('brand', v)}>
            <SelectTrigger size="sm" className="px-2">
              <SelectValue placeholder="소속 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem size="sm" value="PMG">
                  PMG
                </SelectItem>
                <SelectItem size="sm" value="MCS">
                  MCS
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <MultiSelect
            ref={categoryRef}
            size="sm"
            className="max-w-[80px] min-w-auto! max-xl:hidden"
            maxCount={0}
            autoSize={true}
            placeholder="카테고리"
            defaultValue={selectedCategory}
            options={categoryOptions}
            onValueChange={(v) => onFilterChange('category', v)}
            simpleSelect={true}
            hideSelectAll={true}
          />

          <MultiSelect
            ref={clientRef}
            size="sm"
            className="max-w-[80px] min-w-auto!"
            maxCount={0}
            autoSize={true}
            placeholder="클라이언트"
            defaultValue={selectedClient}
            options={clientOptions}
            onValueChange={(v) => onFilterChange('client_id', v)}
            simpleSelect={true}
            hideSelectAll={true}
          />

          <MultiSelect
            size="sm"
            ref={teamRef}
            className="max-w-[80px] min-w-auto! max-xl:hidden"
            maxCount={0}
            autoSize={true}
            placeholder="팀 선택"
            defaultValue={selectedTeam}
            options={teamOptions}
            onValueChange={(v) => onFilterChange('team_id', v)}
            simpleSelect={true}
            hideSelectAll={true}
          />

          <MultiSelect
            size="sm"
            ref={statusRef}
            className="max-w-[80px] min-w-auto! max-xl:hidden"
            maxCount={0}
            autoSize={true}
            placeholder="상태 선택"
            defaultValue={selectedStatus}
            options={statusOptions}
            onValueChange={(v) => onFilterChange('status', v)}
            simpleSelect={true}
            hideSelectAll={true}
          />

          <Button
            variant="svgIcon"
            size="icon"
            className={cn('size-6', showFavoritesOnly ? 'text-primary-yellow-500' : 'hover:text-primary-yellow-500 text-gray-600')}
            onClick={onToggleFavorites}>
            <Star fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          </Button>

          <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500 size-6 text-gray-600" onClick={onReset}>
            <RefreshCw />
          </Button>
        </div>
      </div>

      {/* 검색 + 생성 */}
      <div className="flex gap-x-2">
        <Input
          className="max-w-42"
          size="sm"
          placeholder="검색어 입력"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
        />

        <Button size="sm" onClick={onCreate}>
          프로젝트 생성
        </Button>
      </div>
    </div>
  );
}
