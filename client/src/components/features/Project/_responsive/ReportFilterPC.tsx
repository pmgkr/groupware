// src/components/features/Report/_components/filter/ReportFilter.tsx
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect } from '@/components/multiselect/multi-select';
import { X, RefreshCw, Lock, LockOpen } from 'lucide-react';

import type { ReportFilterProps } from '../types/ReportFilterProps';

export function ReportFilterPC({
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
}: ReportFilterProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      {/* left */}
      <div className="flex items-center gap-x-2">
        {/* row size */}
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[15, 30, 50, 100].map((v) => (
              <SelectItem key={v} value={String(v)} size="sm">
                {v} Rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* year */}
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger size="sm" className="px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={y} size="sm">
                {y}년
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* client */}
        <MultiSelect
          size="sm"
          ref={clientRef}
          className="max-w-[80px] min-w-auto!"
          maxCount={0}
          autoSize={true}
          placeholder="클라이언트 선택"
          options={clientOptions}
          defaultValue={selectedClient}
          onValueChange={onClientChange}
          simpleSelect={true}
          hideSelectAll={true}
        />

        {/* team */}
        <MultiSelect
          size="sm"
          ref={teamRef}
          className="max-w-[80px] min-w-auto!"
          maxCount={0}
          autoSize={true}
          placeholder="팀 선택"
          options={teamOptions}
          defaultValue={selectedTeam}
          onValueChange={onTeamChange}
          simpleSelect={true}
          hideSelectAll={true}
        />

        {/* status */}
        <MultiSelect
          size="sm"
          ref={statusRef}
          className="max-w-[80px] min-w-auto!"
          maxCount={0}
          autoSize={true}
          placeholder="상태 선택"
          options={statusOptions}
          defaultValue={selectedStatus}
          onValueChange={onStatusChange}
          simpleSelect={true}
        />

        {/* lock */}
        <Button
          type="button"
          variant="svgIcon"
          size="icon"
          className={cn('size-6 text-gray-600', isLocked === '' ? 'hover:text-primary-blue-500' : '[&_rect]:fill-gray-600')}
          onClick={onLockToggle}>
          {isLocked === 'N' ? <LockOpen /> : <Lock />}
        </Button>

        {/* reset */}
        <Button type="button" variant="svgIcon" size="icon" className="hover:text-primary-blue-500 size-6 text-gray-600" onClick={onReset}>
          <RefreshCw />
        </Button>
      </div>

      {/* right */}
      <div className="relative">
        <Input
          size="sm"
          className="max-w-42 pr-6"
          placeholder="검색어를 입력해 주세요."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchSubmit();
          }}
        />
        {searchInput && (
          <Button type="button" variant="svgIcon" className="absolute top-0 right-0 h-full w-6 px-0 text-gray-500" onClick={onReset}>
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
