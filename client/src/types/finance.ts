// /types/finance.ts
import type { DateRange } from 'react-day-picker';
import type { MultiSelectOption, MultiSelectRef } from '@/components/multiselect/multi-select';

export interface PexpenseFilterProps {
  yearOptions: string[];

  selectedYear: string;
  selectedType: string[];
  selectedStatus: string[];
  selectedProof: string[];
  selectedProofStatus: string[];
  selectedDdate: string;

  typeOptions: MultiSelectOption[];
  statusOptions: MultiSelectOption[];
  proofMethod: MultiSelectOption[];
  proofStatusOptions: MultiSelectOption[];

  typeRef: MultiSelectRef | null;
  statusRef: MultiSelectRef | null;
  proofRef: MultiSelectRef | null;
  proofStatusRef: MultiSelectRef | null;
  checkedItems: number[];
  searchInput: string;
  datePickerKey: number;
  selectedDateRange?: DateRange;

  onYearChange: (v: string) => void;
  onTypeChange: (v: string[]) => void;
  onStatusChange: (v: string[]) => void;
  onProofChange: (v: string[]) => void;
  onProofStatusChange: (v: string[]) => void;
  onDdateChange: (v: string) => void;
  onSearchInputChange: (v: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
  onDateRangeChange: (range?: DateRange) => void;

  onConfirm: () => void;
  onReject: () => void;
  onRefresh: () => void;
}
