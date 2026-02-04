import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { formatAmount, formatKST } from '@/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface ProposalCardListProps {
  reports: any[];
  activeQuery?: string;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  activeTab: string;
  badgeStatus: Record<string, { label: string; variant?: string; className?: string }>;
  costCategories: string[];
  isManager?: boolean;
  isAdmin?: boolean;
  adminRole?: 'finance' | 'gm' | null;
  showBulkApproval?: boolean;
  selectedIds?: number[];
  onSelectOne?: (id: number) => void;
  onRowClick: (id: number, tab: string) => void;
  isAllSelected: boolean;
  onSelectAll: () => void;
}

export default function ProposalListCard({
  reports,
  activeQuery,
  currentPage,
  pageSize,
  totalCount,
  activeTab,
  badgeStatus,
  costCategories,
  isManager,
  isAdmin,
  adminRole,
  showBulkApproval,
  selectedIds = [],
  onRowClick,
  onSelectOne,
  isAllSelected,
  onSelectAll,
}: ProposalCardListProps) {
  const navigate = useNavigate();

  const getDisplayStatus = (report: {
    state: string;
    approval_manager_display_state?: string;
    approval_finance_display_state?: string;
    approval_gm_display_state?: string;
  }) => {
    if (
      report.state === '반려' ||
      report.approval_manager_display_state === '반려' ||
      report.approval_finance_display_state === '반려' ||
      report.approval_gm_display_state === '반려'
    ) {
      return '반려';
    }

    if (isAdmin && adminRole === 'finance' && activeTab === 'completed') {
      return report.approval_finance_display_state || report.approval_manager_display_state || report.state;
    }

    if (isAdmin && adminRole === 'gm') {
      return (
        report.approval_gm_display_state || report.approval_finance_display_state || report.approval_manager_display_state || report.state
      );
    }

    if (isManager) {
      return report.approval_manager_display_state || report.state;
    }

    return (
      report.approval_gm_display_state || report.approval_finance_display_state || report.approval_manager_display_state || report.state
    );
  };

  // 검색 결과 없음
  if (reports.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        {activeQuery ? `‘${activeQuery}’에 대한 검색 결과가 없습니다.` : '등록된 기안서가 없습니다.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showBulkApproval && (
        <div className="mb-2 flex items-center gap-2 px-1" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} className="bg-white" />
          <span className="text-sm text-gray-700">전체 선택</span>
        </div>
      )}
      {reports.map((report, index) => {
        const isCostCategory = costCategories.includes(report.category);
        const displayStatus = getDisplayStatus(report); // 부모에서 미리 계산해도 좋음
        const badgeConfig = badgeStatus[displayStatus] || { label: '진행' };
        const isSelected = selectedIds.includes(report.id);

        return (
          <div
            key={report.id}
            onClick={() => onRowClick(report.id, activeTab)}
            className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-4 active:bg-gray-100">
            <div className="mb-2 flex items-center justify-between border-b border-gray-300 pb-2">
              <div className="flex items-center gap-x-2">
                {showBulkApproval && onSelectOne && (
                  <div
                    className=""
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOne(report.id);
                    }}>
                    <Checkbox checked={isSelected} onCheckedChange={() => onSelectOne(report.id)} className="bg-white" />
                  </div>
                )}
                <span className="text-sm text-gray-800">{report.category}</span>
              </div>

              <Badge size="default" variant={badgeConfig.variant as any} className={badgeConfig.className}>
                {badgeConfig.label}
              </Badge>
            </div>

            <div className="line-clamp-2 text-gray-900">{report.title}</div>

            <div className="mt-1 text-right text-base text-gray-600">
              <span className="font-medium text-gray-900">{formatAmount(report.price)}원</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-sm text-gray-500">{formatKST(report.date, true)}</span>
              <span className="text-sm text-gray-500">
                {report.team} · {report.user}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
