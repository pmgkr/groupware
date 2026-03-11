import type { MultiSelectOption, MultiSelectRef } from '@/components/multiselect/multi-select';

export type ManagerFilterProps = {
  /* tab */
  activeTab: 'all' | 'claimed';
  onTabChange: (tab: 'all' | 'claimed') => void;

  /* year */
  selectedYear: string;
  yearOptions: string[];
  onYearChange: (year: string) => void;

  /* filters */
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

  /* actions */
  checkedItems: number[];
  onRefresh: () => void;
  onConfirm: () => void;
};
