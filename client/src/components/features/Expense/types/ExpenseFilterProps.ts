import type { DateRange } from 'react-day-picker';
import type { MultiSelectOption, MultiSelectRef } from '@/components/multiselect/multi-select';

export type ExpenseRole = 'admin' | 'manager' | 'user' | 'mine';
export type FilterTab = 'all' | 'claimed' | 'saved' | 'pexpense' | 'nexpense';

export interface ExpenseFilterProps {
  role: ExpenseRole;

  selectedYear: string;
  yearOptions: string[];
  onYearChange: (v: string) => void;

  selectedType: string[];
  selectedStatus: string[];
  selectedProof: string[];
  selectedProofStatus: string[];

  typeOptions: MultiSelectOption[];
  statusOptions: MultiSelectOption[];
  proofMethod: MultiSelectOption[];
  proofStatusOptions: MultiSelectOption[];

  typeRef: React.RefObject<MultiSelectRef | null>;
  statusRef: React.RefObject<MultiSelectRef | null>;
  proofRef: React.RefObject<MultiSelectRef | null>;
  proofStatusRef: React.RefObject<MultiSelectRef | null>;

  onTypeChange: (v: string[]) => void;
  onStatusChange: (v: string[]) => void;
  onProofChange: (v: string[]) => void;
  onProofStatusChange: (v: string[]) => void;

  onRefresh: () => void;

  activeTab?: FilterTab;
  onTabChange?: (tab: FilterTab) => void;

  // admin-only
  selectedDdate?: string;
  onDdateChange?: (v: string) => void;
  searchInput?: string;
  onSearchInputChange?: (v: string) => void;
  onSearchSubmit?: (v?: string) => void;
  onClearSearch?: () => void;
  datePickerKey?: number;
  selectedDateRange?: DateRange;
  onDateRangeChange?: (range?: DateRange) => void;

  // actions
  checkedItems?: number[];
  onConfirm?: () => void;
  onReject?: () => void;
  onSAPRegi?: () => void;
  onCreate?: () => void;
}
