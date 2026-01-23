import { type pExpenseViewDTO, type pExpenseItemDTO, type EstimateItemsView, type ProjectViewDTO } from '@/api';
import { type EstimateItemsMatch } from '@/api/project';
import type { expenseInfo } from '@/types/estimate';

export interface pExpenseItemWithMatch extends pExpenseItemDTO {
  matchedList?: EstimateItemsMatch[];
}

export interface pExpenseViewWithMatch extends pExpenseViewDTO {
  items: pExpenseItemWithMatch[];
  project: ProjectViewDTO;
}

export type ExpenseViewProps = {
  data: pExpenseViewWithMatch | null;
  statusBadge: React.ReactNode;
  totals: {
    amount: number;
    tax: number;
    total: number;
  };

  matchedItems: EstimateItemsView[];
  matchedMap: number | any[];
  expenseInfo: expenseInfo | null;
  openDialog: () => void;
  openEstimateDialog: (expSeq: number, amount: number) => void;
  loadMatchedItems: (item: pExpenseItemWithMatch) => void;
  selectedEstId: number | null;
  setSelectedEstId: number | null;
};
