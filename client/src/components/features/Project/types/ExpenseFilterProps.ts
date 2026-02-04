import { type projectOverview } from '@/api/project';
import type { MultiSelectOption, MultiSelectRef } from '@/components/multiselect/multi-select';

export type ExpenseFilterProps = {
  data: projectOverview['info'];
  activeTab: 'all' | 'saved';
  yearOptions: string[];
  selectedYear: string;
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

  onTabChange: (tab: 'all' | 'saved') => void;
  onFilterChange: (key: string, value: string | string[]) => void;
  onReset: (tab: 'all' | 'saved') => void;
  onCreate: () => void;
};
