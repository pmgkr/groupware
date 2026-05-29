import type { projectOverview } from '@/api/project';
import type { MultiSelectOption, MultiSelectRef } from '@/components/multiselect/multi-select';

export type PExpenseFilterProps = {
  role: 'manager' | 'user';
  // tab
  activeTab: 'all' | 'claimed' | 'saved';
  onTabChange: (tab: 'all' | 'claimed' | 'saved') => void;
  // year
  yearOptions: string[];
  selectedYear: string;
  onYearChange: (v: string) => void;
  // filters
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
  // actions
  onRefresh: () => void;
  // manager-only
  checkedItems?: number[];
  onConfirm?: () => void;
  // user-only
  searchInput?: string;
  onSearchInputChange?: (v: string) => void;
  onSearchSubmit?: (v: string) => void;
  data?: projectOverview['info'];
  onCreate?: () => void;
};
