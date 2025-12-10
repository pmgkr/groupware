import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppPagination } from '@/components/ui/AppPagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAmount, formatKST } from '@/utils';
import { useEffect, useState, useMemo } from 'react';
import { generateReportNumber, type ReportCard } from '@/api/expense/proposal';
import type { ManagerReportCard } from '@/api/manager/proposal';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { SearchGray } from '@/assets/images/icons';

interface ProposalListContentProps {
  // 🔥 기존 방식 (User, Manager)
  reports?: ReportCard[] | ManagerReportCard[];

  onRowClick: (id: number, tab: string) => void;
  onRegister?: () => void;
  pageSize?: number;

  // 매니저용 옵션
  isManager?: boolean;
  showWriterInfo?: boolean;
  showRegisterButton?: boolean;

  isAdmin?: boolean;
  adminRole?: 'finance' | 'gm' | null;

  // 🔥 새로운 방식 (Admin) - API 호출 함수
  onFetchData?: (params: { page: number; size: number; type?: string; q?: string }) => Promise<ReportCard[] | ManagerReportCard[]>;
}

function isManagerReportCard(report: ReportCard | ManagerReportCard): report is ManagerReportCard {
  return 'manager_state' in report;
}

export default function ProposalList({
  reports: reportsProp, // 🔥 기존 방식용 props
  pageSize = 10,
  onRowClick,
  onRegister,
  showWriterInfo = false,
  showRegisterButton = true,
  isManager,
  isAdmin,
  adminRole,
  onFetchData, // 🔥 새로운 방식용 props
}: ProposalListContentProps) {
  // 🔥 API에서 받아온 데이터 (새로운 방식용)
  const [fetchedReports, setFetchedReports] = useState<(ReportCard | ManagerReportCard)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 검색창 입력값
  const [searchQuery, setSearchQuery] = useState('');
  // 🔥 실제 검색에 사용되는 값 (엔터나 클릭 시에만 업데이트)
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [matchStatus, setMatchStatus] = useState<string | undefined>();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get('page') || 1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('');

  // 🔥 일괄 선택 관련 state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 🔥 실제 사용할 reports: reportsProp이 있으면 그것 사용, 없으면 fetchedReports 사용
  const reports = reportsProp || fetchedReports;

  // 🔥 API 호출 함수 (onFetchData가 있을 때만)
  const fetchReports = async () => {
    if (!onFetchData) return;

    setIsLoading(true);
    try {
      const data = await onFetchData({
        page: 1,
        size: 100000,
        type: activeTab !== 'all' ? activeTab : undefined,
        q: activeSearchQuery || undefined, // 🔥 searchQuery → activeSearchQuery
      });

      setFetchedReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 검색 실행 (엔터 or 돋보기 클릭 시)
  const handleSearch = () => {
    setActiveSearchQuery(searchQuery); // 🔥 입력값을 실제 검색어로 반영
    setCurrentPage(1);
    navigate(`?tab=${activeTab}&page=1`, { replace: true });
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  useEffect(() => {
    let defaultTab = '';

    if (searchParams.get('tab')) {
      defaultTab = searchParams.get('tab')!;
    } else if (isAdmin) {
      if (adminRole === 'gm') defaultTab = 'pending';
      else defaultTab = 'pending';
    } else if (isManager) {
      defaultTab = 'pending';
    } else {
      defaultTab = 'draft';
    }

    setActiveTab(defaultTab);
  }, [searchParams, isAdmin, adminRole, isManager]);

  // 🔥 탭, 페이지, 실제 검색어 변경 시 API 재호출 (onFetchData가 있을 때만)
  useEffect(() => {
    if (activeTab && onFetchData) {
      fetchReports();
    }
  }, [activeTab, activeSearchQuery, onFetchData]); // 🔥 searchQuery → activeSearchQuery

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

  // 탭 필터링
  const userTabs = [
    { key: 'draft', label: '기안 문서' },
    { key: 'complete', label: '완료 문서' },
  ];
  const managerTabs = [
    { key: 'pending', label: '결재 대기 문서' },
    { key: 'approved', label: '결재 완료 문서' },
  ];
  const financeTabs = [
    { key: 'all', label: '전체' },
    { key: 'pending', label: '회계 대기 문서' },
    { key: 'complete', label: '회계 완료 문서' },
  ];
  const gmTabs = [
    { key: 'all', label: '전체' },
    { key: 'pending', label: 'GM 대기 문서' },
    { key: 'complete', label: 'GM 완료 문서' },
  ];

  let usedTabs = userTabs;

  if (isManager) {
    usedTabs = managerTabs;
  }

  if (isAdmin) {
    if (adminRole === 'gm') {
      usedTabs = gmTabs;
    } else {
      usedTabs = financeTabs;
    }
  }

  // 🔥 프론트 필터링 (카테고리, 매칭 상태)
  const tabFiltered = reports.filter((r) => {
    if (!isManager && !isAdmin) {
      return activeTab === 'draft'
        ? r.state === '진행' || r.state === '대기'
        : activeTab === 'complete'
          ? ['완료', '반려', '승인완료'].includes(r.state)
          : true;
    }

    if (isManager) {
      if (!isManagerReportCard(r)) return false;

      if (activeTab === 'pending') {
        return r.manager_state === '대기';
      }

      if (activeTab === 'approved') {
        return r.manager_state !== '대기';
      }

      return true;
    }

    if (isAdmin) {
      if (adminRole === 'gm') {
        if (activeTab === 'all') return true;

        if (activeTab === 'pending') {
          return r.manager_state === '완료' && r.finance_state === '완료' && r.gm_state === '대기';
        }

        if (activeTab === 'complete') {
          return r.gm_state !== '대기';
        }
      } else {
        if (activeTab === 'all') return true;

        if (activeTab === 'pending') {
          return r.manager_state === '완료' && r.finance_state === '대기';
        }

        if (activeTab === 'complete') {
          return r.finance_state !== '대기';
        }
      }
    }

    return true;
  });

  // 카테고리 필터링
  const location = useLocation();
  const path = location.pathname;
  const isManagerPage = path.startsWith('/manager/proposal');
  const isProjectPage = path.startsWith('/project/proposal');
  const isAdminPage = isAdmin;
  const categories =
    isManagerPage || isAdminPage
      ? [
          { value: '전체', label: '전체' },
          { value: '교육비', label: '교육비' },
          { value: '구매요청', label: '구매요청' },
          { value: '일반비용', label: '일반비용' },
          { value: '프로젝트', label: '프로젝트' },
        ]
      : [
          { value: '전체', label: '전체' },
          { value: '교육비', label: '교육비' },
          { value: '구매요청', label: '구매요청' },
          { value: '일반비용', label: '일반비용' },
        ];
  const categoryFiltered =
    !selectedCategory || selectedCategory === '전체' ? tabFiltered : tabFiltered.filter((r) => r.category === selectedCategory);

  const matchStatusOptions = [
    { value: 'all', label: '전체' },
    { value: 'matched', label: '완료' },
    { value: 'unmatched', label: '매칭전' },
  ];

  const matchFiltered = categoryFiltered.filter((r) => {
    if (!matchStatus || matchStatus === 'all') return true;

    if (r.category === '구매요청') return false;

    if (matchStatus === 'matched') return !!r.expense_no;

    if (matchStatus === 'unmatched') return !r.expense_no;

    return true;
  });

  // 정렬
  const filteredReports = matchFiltered.sort((a, b) => b.id - a.id);

  // 페이지네이션
  const { totalPages, paginatedReports } = useMemo(() => {
    const total = Math.ceil(filteredReports.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = filteredReports.slice(startIndex, startIndex + pageSize);

    return {
      totalPages: total,
      paginatedReports: paginated,
    };
  }, [filteredReports, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]);
    setIsAllSelected(false);

    //navigate(`?tab=${activeTab}&page=${page}`, { replace: true});
    //window.history.replaceState(null, '', `?tab=${activeTab}&page=${page}`);
  };

  const showBulkApproval = isAdmin && activeTab === 'pending';

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = paginatedReports.map((r) => r.id);
      setSelectedIds(allIds);
      setIsAllSelected(true);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      const newIds = selectedIds.filter((selectedId) => selectedId !== id);
      setSelectedIds(newIds);
      setIsAllSelected(false);
    } else {
      const newIds = [...selectedIds, id];
      setSelectedIds(newIds);
      if (newIds.length === paginatedReports.length) {
        setIsAllSelected(true);
      }
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      alert('승인할 문서를 선택해주세요.');
      return;
    }

    const confirmMessage = `선택한 ${selectedIds.length}개 문서를 승인하시겠습니까?`;
    if (!confirm(confirmMessage)) return;

    try {
      console.log('🔥 일괄 승인 요청:', selectedIds);
      console.log('🔥 adminRole:', adminRole);

      alert('승인이 완료되었습니다.');

      setSelectedIds([]);
      setIsAllSelected(false);

      // 🔥 onFetchData가 있으면 목록 새로고침
      if (onFetchData) {
        fetchReports();
      }
    } catch (error) {
      console.error('❌ 일괄 승인 실패:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

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
              {matchStatusOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔥 검색창 - admin일 때만 표시 */}
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
            {showRegisterButton && onRegister && (
              <Button size="sm" onClick={onRegister}>
                기안서 작성하기
              </Button>
            )}
            {showBulkApproval && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleBulkApprove} disabled={selectedIds.length === 0}>
                  승인 하기
                </Button>
              </div>
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
              const writer = showWriterInfo ? { team: report.team, name: report.user } : null;
              const displayStatus = report.approval_manager_display_state ?? report.approval_user_display_state ?? report.state;

              const rowNumber = filteredReports.length - ((currentPage - 1) * pageSize + index);

              const isCostCategory = report.category === '일반비용' || report.category === '교육비' || report.category === '프로젝트';

              const isSelected = selectedIds.includes(report.id);

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
                      : isCostCategory &&
                        (report.expense_no ? (
                          <Badge size="table" variant="outline">
                            완료
                          </Badge>
                        ) : (
                          <Badge size="table" variant="outline" className="border-gray-600 text-gray-600">
                            매칭전
                          </Badge>
                        ))}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      switch (displayStatus) {
                        case '팀장대기':
                          return (
                            <Badge variant="secondary" size="table">
                              팀장대기
                            </Badge>
                          );
                        case '팀장결재완료':
                          return <Badge size="table">팀장결재완료</Badge>;

                        case '회계대기':
                          return (
                            <Badge variant="secondary" size="table" className="bg-primary-yellow-150 text-primary-orange">
                              회계대기
                            </Badge>
                          );

                        case 'GM대기':
                          return (
                            <Badge variant="secondary" size="table" className="bg-primary-purple-150 text-primary-purple">
                              GM대기
                            </Badge>
                          );

                        case '승인완료':
                          return <Badge size="table">승인완료</Badge>;

                        case '반려':
                          return (
                            <Badge size="table" className="bg-[#FF2200]">
                              반려
                            </Badge>
                          );

                        default:
                          return <Badge size="table">진행</Badge>;
                      }
                    })()}
                  </TableCell>

                  {showWriterInfo && writer && (
                    <>
                      <TableCell>{writer.team}</TableCell>
                      <TableCell>{writer.name}</TableCell>
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
