// src/types/ReportFilterProps.ts
import type { MultiSelectOption, MultiSelectRef } from '@/components/multiselect/multi-select';
import type { RefObject } from 'react';

export interface ReportFilterProps {
  /* pagination */
  pageSize: number;
  onPageSizeChange: (size: number) => void;

  /* year */
  yearOptions: string[];
  selectedYear: string;
  onYearChange: (v: string) => void;

  /* filters */
  selectedClient: string[];
  selectedTeam: string[];
  selectedStatus: string[];
  isLocked: 'Y' | 'N' | '';

  clientOptions: MultiSelectOption[];
  teamOptions: MultiSelectOption[];
  statusOptions: MultiSelectOption[];

  clientRef: RefObject<MultiSelectRef | null>;
  teamRef: RefObject<MultiSelectRef | null>;
  statusRef: RefObject<MultiSelectRef | null>;

  onClientChange: (v: string[]) => void;
  onTeamChange: (v: string[]) => void;
  onStatusChange: (v: string[]) => void;

  /* search */
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  onSearchSubmit: () => void;
  onReset: () => void;

  /* lock */
  onLockToggle: () => void;
}
