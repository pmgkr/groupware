// _filters/ExpenseFilterMo.tsx
import { cn } from '@/lib/utils';
import type { ExpenseFilterProps } from '../types/ExpenseFilterProps';

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

export function ExpenseFilterMo(props: ExpenseFilterProps) {
  const {
    activeTab,
    yearOptions,
    selectedYear,
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

    onTabChange,
    onFilterChange,
    onReset,
    onCreate,
  } = props;

  return (
    <div className="mb-4">
      {/* 탭 */}
      <div className="mb-3 flex rounded-sm bg-gray-300 p-1">
        <Button
          onClick={() => onTabChange('all')}
          className={`h-8 w-1/2 rounded-sm p-0 text-sm ${
            activeTab === 'all'
              ? 'bg-primary hover:bg-primary active:bg-primary text-white'
              : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
          }`}>
          전체
        </Button>
        <Button
          onClick={() => onTabChange('saved')}
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
          <Drawer direction="bottom">
            <DrawerTrigger asChild>
              <Button size="sm" variant="ghost" className="has-[>svg]:px-0">
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
                    onClick={() => onReset(activeTab)}>
                    <RefreshCw className="size-4" /> 초기화
                  </Button>
                </div>
              </DrawerHeader>
              <div className="flex flex-col gap-y-2 px-4 pb-2">
                <>
                  <div>
                    <FilterTitle label="년도 선택" />
                    <Select value={selectedYear} onValueChange={(v) => onFilterChange('year', v)}>
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
                        defaultValue={selectedType}
                        onValueChange={(v) => onFilterChange('type', v)}
                        maxCount={0}
                        hideSelectAll={true}
                        closeOnSelect={false}
                        searchable={false}
                        simpleSelect={true}
                        modalPopover={true}
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
                        defaultValue={selectedProof}
                        onValueChange={(v) => onFilterChange('method', v)}
                        maxCount={0}
                        hideSelectAll={true}
                        closeOnSelect={false}
                        searchable={false}
                        simpleSelect={true}
                        modalPopover={true}
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
                        defaultValue={selectedProofStatus}
                        onValueChange={(v) => onFilterChange('attach', v)}
                        maxCount={0}
                        hideSelectAll={true}
                        closeOnSelect={false}
                        searchable={false}
                        simpleSelect={true}
                        modalPopover={true}
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
                        defaultValue={selectedStatus}
                        onValueChange={(v) => onFilterChange('status', v)}
                        maxCount={0}
                        hideSelectAll={true}
                        closeOnSelect={false}
                        searchable={false}
                        simpleSelect={true}
                        modalPopover={true}
                      />
                    </div>
                  </div>
                </>
              </div>
              <DrawerFooter>
                <Button type="button" size="full">
                  적용하기
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <Button size="sm" onClick={onCreate}>
          비용 작성하기
        </Button>
      </div>
    </div>
  );
}

function FilterTitle({ label }: { label: string }) {
  return <p className="mb-1 text-base font-medium text-gray-600">{label}</p>;
}
