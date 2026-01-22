import type { MultiSelectOption, MultiSelectRef } from '@/components/multiselect/multi-select';

export type ProjectFilterProps = {
  activeTab: 'mine' | 'others';
  yearOptions: string[];
  selectedYear: string;
  selectedBrand: string;
  selectedCategory: string[];
  selectedClient: string[];
  selectedTeam: string[];
  selectedStatus: string[];
  searchInput: string;
  showFavoritesOnly: boolean;

  categoryRef: React.RefObject<MultiSelectRef | null>;
  clientRef: React.RefObject<MultiSelectRef | null>;
  teamRef: React.RefObject<MultiSelectRef | null>;
  statusRef: React.RefObject<MultiSelectRef | null>;

  categoryOptions: MultiSelectOption[];
  clientOptions: MultiSelectOption[];
  teamOptions: MultiSelectOption[];
  statusOptions: MultiSelectOption[];

  onTabChange: (tab: 'mine' | 'others') => void;
  onFilterChange: (key: string, value: any) => void;
  onSearchInputChange: (v: string) => void;
  onSearchSubmit: () => void;
  onToggleFavorites: () => void;
  onReset: () => void;
  onCreate: () => void;
};
