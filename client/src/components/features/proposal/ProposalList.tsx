import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppPagination } from '@/components/ui/AppPagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAmount, formatKST } from '@/utils';
import { useEffect, useState, useMemo } from 'react';
import type { ReportCard } from '@/api/expense/proposal';
import type { ManagerReportCard } from '@/api/manager/proposal';
import { approveReport, type AdminReportCard } from '@/api/admin/proposal';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { SearchGray } from '@/assets/images/icons';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { CircleCheck, CircleX } from 'lucide-react';

interface ProposalListContentProps {
  reports?: ReportCard[] | ManagerReportCard[] | AdminReportCard[];
  onRowClick: (id: number, tab: string) => void;
  onRegister?: () => void;
  pageSize?: number;
  isManager?: boolean;
  showWriterInfo?: boolean;
  showRegisterButton?: boolean;
  isAdmin?: boolean;
  adminRole?: 'finance' | 'gm' | null;
  onFetchData?: (params: {
    page: number;
    size: number;
    type?: string;
    q?: string;
    status?: 'finance' | 'gm' | 'rejected' | 'completed';
  }) => Promise<ReportCard[] | ManagerReportCard[] | AdminReportCard[]>;
}

// 상수 정의
const tablist = {
  user: [
    { key: 'draft', label: '기안 문서' },
    { key: 'completed', label: '완료 문서' },
    { key: 'rejected', label: '반려 문서' },
  ],
  manager: [
    { key: 'pending', label: '결재 대기 문서' },
    { key: 'approved', label: '결재 완료 문서' },
    { key: 'rejected', label: '반려 문서' },
  ],
  finance: [
    { key: 'all', label: '전체' },
    { key: 'pending', label: '회계 대기 문서' },
    { key: 'completed', label: '회계 완료 문서' },
    { key: 'rejected', label: '반려 문서' },
  ],
  gm: [
    { key: 'all', label: '전체' },
    { key: 'pending', label: 'GM 대기 문서' },
    { key: 'completed', label: 'GM 완료 문서' },
    { key: 'rejected', label: '반려 문서' },
  ],
};

const match_state = [
  { value: 'all', label: '전체' },
  { value: 'matched', label: '완료' },
  { value: 'unmatched', label: '매칭전' },
];

const cost_categories = ['일반비용', '교육비', '프로젝트'];

const badge_status: Record<string, { variant?: string; className?: string; label: string }> = {
  팀장대기: { variant: 'secondary', label: '팀장대기' },
  팀장완료: { label: '팀장완료' },
  회계대기: { variant: 'secondary', className: 'bg-primary-yellow-150 text-primary-orange', label: '회계대기' },
  회계완료: { variant: 'secondary', className: 'bg-primary-yellow text-white', label: '회계완료' },
  GM대기: { variant: 'secondary', className: 'bg-primary-purple-150 text-primary-purple', label: 'GM대기' },
  승인완료: { label: '승인완료' },
  반려: { className: 'bg-[#FF2200]', label: '반려' },
};

export default function ProposalList({
  reports: reportsProp,
  pageSize = 10,
  onRowClick,
  onRegister,
  showWriterInfo = false,
  showRegisterButton = true,
  isManager,
  isAdmin,
  adminRole,
  onFetchData,
}: ProposalListContentProps) {
  const [fetchedReports, setFetchedReports] = useState<(ReportCard | ManagerReportCard | AdminReportCard)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [matchStatus, setMatchStatus] = useState<string | undefined>();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page') || 1));
  const [activeTab, setActiveTab] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const reports = reportsProp || fetchedReports;
  const isProjectPage = location.pathname.startsWith('/project/proposal');
  const isManagerPage = location.pathname.startsWith('/manager/proposal');
  const showBulkApproval = isAdmin && activeTab === 'pending';

  // 유틸리티 함수들
  const getStatusParam = (): 'finance' | 'gm' | 'rejected' | undefined => {
    if (!isAdmin) return undefined;

    const statusMap: Record<'gm' | 'finance', Record<string, 'finance' | 'gm' | 'rejected' | undefined>> = {
      gm: { pending: 'gm', completed: 'gm', rejected: 'rejected' },
      finance: { pending: 'finance', completed: 'gm', rejected: 'rejected' },
    };

    return statusMap[adminRole!]?.[activeTab];
  };

  const getDefaultTab = () => {
    if (searchParams.get('tab')) return searchParams.get('tab')!;
    if (isAdmin || isManager) return 'pending';
    return 'draft';
  };

  const getUserType = () => {
    if (isAdmin) return adminRole === 'gm' ? 'gm' : 'finance';
    if (isManager) return 'manager';
    return 'user';
  };

  const getDisplayStatus = (report: ReportCard | ManagerReportCard | AdminReportCard) => {
    const statusKeys = ['approval_gm_display_state', 'approval_finance_display_state', 'approval_manager_display_state'];
    for (const key of statusKeys) {
      if (key in report && report[key as keyof typeof report]) {
        return report[key as keyof typeof report] as string;
      }
    }
    return report.state;
  };

  const getCategoryOptions = () => {
    const baseCategories = [
      { value: '전체', label: '전체' },
      { value: '교육비', label: '교육비' },
      { value: '구매요청', label: '구매요청' },
      { value: '일반비용', label: '일반비용' },
    ];

    if (isManagerPage || isAdmin) {
      baseCategories.push({ value: '프로젝트', label: '프로젝트' });
    }

    return baseCategories;
  };

  // 필터 함수
  const filterByTab = (report: ReportCard | ManagerReportCard | AdminReportCard) => {
    // 일반 사용자
    if (!isManager && !isAdmin) {
      const tabStateMap = {
        draft: ['진행', '대기'],
        completed: ['완료', '승인완료'],
        rejected: ['반려'],
      };
      return tabStateMap[activeTab as keyof typeof tabStateMap]?.includes(report.state) ?? true;
    }

    // 매니저
    if (isManager && activeTab === 'rejected') {
      return ['state', 'manager_state', 'finance_state', 'gm_state'].some((key) => report[key as keyof typeof report] === '반려');
    }

    // Admin
    if (isAdmin) {
      if (activeTab === 'rejected') return report.state === '반려';
      console.log('🔍 Filter Debug:', {
        activeTab,
        adminRole,
        id: report.id,
        manager_state: report.manager_state,
        finance_state: report.finance_state,
        gm_state: report.gm_state,
      });

      const filterMap = {
        finance: {
          pending: () => report.manager_state === '완료' && report.finance_state === '대기',
          completed: () => report.manager_state === '완료' && report.finance_state === '완료' && report.gm_state === '대기',
        },
        gm: {
          pending: () => report.manager_state === '완료' && report.finance_state === '완료' && report.gm_state === '대기',
          completed: () => report.manager_state === '완료' && report.finance_state === '완료' && report.gm_state === '완료',
        },
      };

      return filterMap[adminRole!]?.[activeTab as 'pending' | 'completed']?.() ?? true;
    }

    return true;
  };

  const filterByCategory = (report: ReportCard | ManagerReportCard | AdminReportCard) => {
    return !selectedCategory || selectedCategory === '전체' || report.category === selectedCategory;
  };

  const filterByMatchStatus = (report: ReportCard | ManagerReportCard | AdminReportCard) => {
    if (!matchStatus || matchStatus === 'all') return true;
    if (report.category === '구매요청') return false;
    return matchStatus === 'matched' ? !!report.expense_no : !report.expense_no;
  };
  const filterBySearch = (report: ReportCard | ManagerReportCard | AdminReportCard) => {
    if (!activeSearchQuery) return true;

    const searchLower = activeSearchQuery.toLowerCase();
    const searchableFields = [report.title, report.category, report.user, report.team, String(report.id), String(report.expense_no || '')];

    return searchableFields.some((field) => field && String(field).toLowerCase().includes(searchLower));
  };

  // API 호출
  const fetchReports = async () => {
    if (!onFetchData) return;

    setIsLoading(true);
    try {
      const payload: any = {
        page: 1,
        size: 1000,
        type: activeTab !== 'all' ? activeTab : undefined,
        q: activeSearchQuery || undefined,
      };

      if (isAdmin) {
        payload.status = getStatusParam();
      }

      const data = await onFetchData(payload);
      setFetchedReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
    setCurrentPage(1);
    navigate(`?tab=${activeTab}&page=1`, { replace: true });
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSelectedCategory('');
    setMatchStatus('');
    setCurrentPage(1);
    setSelectedIds([]);
    setIsAllSelected(false);
    setSearchQuery('');
    navigate(`?tab=${key}&page=1`);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      setSelectedIds(paginatedReports.map((r) => r.id));
      setIsAllSelected(true);
    }
  };

  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();

  const handleSelectOne = (id: number) => {
    const newIds = selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id];

    setSelectedIds(newIds);
    setIsAllSelected(newIds.length === paginatedReports.length);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      addAlert({
        title: '선택 필요',
        message: '승인할 문서를 선택해주세요.',
        icon: <CircleX />,
        duration: 2000,
      });
      return;
    }

    addDialog({
      title: '<span class="font-semibold">일괄 승인 확인</span>',
      message: `선택한 <strong>${selectedIds.length}</strong>개 문서를 승인하시겠습니까?`,
      confirmText: '승인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          console.log('🔥 일괄 승인 요청 seq:', selectedIds);

          // Swagger 기준 payload
          await approveReport(selectedIds.map(Number));

          addAlert({
            title: '승인 완료',
            message: `<p>${selectedIds.length}개 문서가 승인되었습니다.</p>`,
            icon: <CircleCheck />,
            duration: 2000,
          });

          // 상태 초기화
          setSelectedIds([]);
          setIsAllSelected(false);

          // 목록 재조회
          if (onFetchData) {
            await fetchReports();
          }
        } catch (error) {
          console.error('❌ 일괄 승인 실패:', error);

          addAlert({
            title: '승인 실패',
            message: '<p>승인 처리 중 오류가 발생했습니다.</p>',
            icon: <CircleX />,
            duration: 2000,
          });
        }
      },
    });
  };

  // Effects
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [searchParams, isAdmin, adminRole, isManager]);

  useEffect(() => {
    if (activeTab && onFetchData) {
      fetchReports();
    }
  }, [activeTab, activeSearchQuery, onFetchData]);

  // 필터링 및 페이지네이션
  const filteredReports = useMemo(() => {
    return reports
      .filter(filterByTab)
      .filter(filterByCategory)
      .filter(filterByMatchStatus)
      .filter(filterBySearch)
      .sort((a, b) => b.id - a.id);
  }, [reports, activeTab, selectedCategory, matchStatus, isAdmin, adminRole, isManager]);

  const { totalPages, paginatedReports } = useMemo(() => {
    const total = Math.ceil(filteredReports.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = filteredReports.slice(startIndex, startIndex + pageSize);

    return { totalPages: total, paginatedReports: paginated };
  }, [filteredReports, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const usedTabs = tablist[getUserType()];
  const categories = getCategoryOptions();

  return (
    <div>
      {/* 탭 + 필터 + 작성 버튼 */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
            {usedTabs.map((tab) => (
              <Button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`h-8 w-22 rounded-sm p-0 text-sm ${
                  activeTab === tab.key
                    ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                    : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
                }`}>
                {tab.label}
              </Button>
            ))}
          </div>

          {!isProjectPage && (
            <div className="flex items-center gap-x-2 before:mr-3 before:ml-3 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300">
              <Select value={selectedCategory || ''} onValueChange={setSelectedCategory}>
                <SelectTrigger size="sm" className="w-[100px]">
                  <SelectValue placeholder="구분 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Select value={matchStatus || ''} onValueChange={setMatchStatus}>
            <SelectTrigger size="sm" className="w-[120px]">
              <SelectValue placeholder="비용 매칭 상태" />
            </SelectTrigger>
            <SelectContent>
              {match_state.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showRegisterButton && onRegister && (
          <Button size="sm" onClick={onRegister}>
            기안서 작성하기
          </Button>
        )}

        {isAdmin && (
          <div className="flex gap-x-2">
            <div className="relative w-[175px]">
              <Input
                className="h-[32px] px-4 [&]:bg-white"
                placeholder="검색어 입력"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="svgIcon"
                size="icon"
                className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2"
                aria-label="검색"
                onClick={handleSearch}>
                <SearchGray className="text-gray-400" />
              </Button>
            </div>

            {showBulkApproval && (
              <Button size="sm" onClick={handleBulkApprove} disabled={selectedIds.length === 0}>
                승인 하기
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 리스트 테이블 */}
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[5%]">번호</TableHead>
            <TableHead className="w-[10%]">구분</TableHead>
            <TableHead>제목</TableHead>
            <TableHead className="w-[10%]">금액</TableHead>
            <TableHead className="w-[10%]">비용 매칭</TableHead>
            <TableHead className="w-[8%]">결재 상태</TableHead>
            {showWriterInfo && (
              <>
                <TableHead className="w-[8%]">팀</TableHead>
                <TableHead className="w-[8%]">작성자</TableHead>
              </>
            )}
            <TableHead className="w-[10%]">작성일</TableHead>
            {showBulkApproval && (
              <TableHead className="w-[50px] px-2.5">
                <Checkbox size="sm" checked={isAllSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedReports.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showBulkApproval ? (showWriterInfo ? 10 : 8) : showWriterInfo ? 9 : 7}
                className="py-10 text-center text-gray-500">
                문서가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            paginatedReports.map((report, index) => {
              const rowNumber = filteredReports.length - ((currentPage - 1) * pageSize + index);
              const isCostCategory = cost_categories.includes(report.category);
              const isSelected = selectedIds.includes(report.id);
              const displayStatus = getDisplayStatus(report);
              const badgeConfig = badge_status[displayStatus] || { label: '진행' };

              return (
                <TableRow
                  key={report.id}
                  onClick={() => onRowClick(report.id, activeTab)}
                  className="cursor-pointer hover:bg-gray-100 [&_td]:text-[13px]">
                  <TableCell>{rowNumber}</TableCell>
                  <TableCell>{report.category}</TableCell>
                  <TableCell className="text-left">{report.title}</TableCell>
                  <TableCell className="text-right">{formatAmount(report.price)}원</TableCell>
                  <TableCell>
                    {report.category === '구매요청'
                      ? '-'
                      : isCostCategory && (
                          <Badge size="table" variant="outline" className={!report.expense_no ? 'border-gray-600 text-gray-600' : ''}>
                            {report.expense_no ? '완료' : '매칭전'}
                          </Badge>
                        )}
                  </TableCell>
                  <TableCell>
                    <Badge size="table" variant={badgeConfig.variant as any} className={badgeConfig.className}>
                      {badgeConfig.label}
                    </Badge>
                  </TableCell>
                  {showWriterInfo && (
                    <>
                      <TableCell>{report.team}</TableCell>
                      <TableCell>{report.user}</TableCell>
                    </>
                  )}
                  <TableCell>{formatKST(report.date, true)}</TableCell>
                  {showBulkApproval && (
                    <TableCell onClick={(e) => e.stopPropagation()} className="px-2.5">
                      <Checkbox checked={isSelected} onCheckedChange={() => handleSelectOne(report.id)} />
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* 페이지네이션 */}
      {filteredReports.length > 0 && (
        <div className="mt-5">
          <AppPagination totalPages={totalPages} initialPage={currentPage} visibleCount={5} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}
