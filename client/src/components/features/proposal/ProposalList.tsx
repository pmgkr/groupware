import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppPagination } from '@/components/ui/AppPagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAmount, formatKST } from '@/utils';
import { useEffect, useState } from 'react';
import { generateReportNumber, type ReportCard } from '@/api/expense/proposal';
import type { ManagerReportCard } from '@/api/manager/proposal';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

interface ProposalListContentProps {
  reports: ReportCard[]; // ManagerReportCard도 포함 가능
  onRowClick: (id: number, tab: string) => void;
  onRegister?: () => void;
  pageSize?: number;

  // 매니저용 옵션
  isManager?: boolean; // 매니저 화면인지 여부
  showWriterInfo?: boolean; //기안자 확인용
  showRegisterButton?: boolean; //승인반려버튼

  isAdmin?: boolean;
  adminRole?: 'finance' | 'gm' | null;
}
function isManagerReportCard(report: ReportCard | ManagerReportCard): report is ManagerReportCard {
  return 'manager_state' in report;
}

export default function ProposalList({
  reports,
  pageSize = 10,
  onRowClick,
  onRegister,
  showWriterInfo = false,
  showRegisterButton = true,
  isManager,
  isAdmin,
  adminRole,
}: ProposalListContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [matchStatus, setMatchStatus] = useState<string | undefined>();
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get('page') || 1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const navigate = useNavigate();

  // URL에 tab=... 있으면 그걸 기본값으로
  const initialTab =
    searchParams.get('tab') ||
    (isAdmin
      ? adminRole === 'finance'
        ? 'pending' // 회계 기본 탭: 회계 대기 문서
        : adminRole === 'gm'
          ? 'pending' // GM 기본 탭: GM 대기 문서
          : 'all'
      : isManager
        ? 'pending'
        : 'draft');
  const [activeTab, setActiveTab] = useState(initialTab);
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // 필터 초기화
    setSelectedCategory('');
    setMatchStatus('');
    // 페이지 초기화
    setCurrentPage(1);

    navigate(`?tab=${key}&page=1`);
  };
  useEffect(() => {
    const tab = searchParams.get('tab') || (isManager ? 'pending' : 'draft');
    setActiveTab(tab);
  }, [searchParams]);

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

  // 🔥 usedTabs 분기
  let usedTabs = userTabs;

  if (isManager) {
    usedTabs = managerTabs;
  }

  if (isAdmin) {
    if (adminRole === 'finance') {
      usedTabs = financeTabs;
    } else if (adminRole === 'gm') {
      usedTabs = gmTabs;
    }
  }

  const tabFiltered = reports.filter((r) => {
    // --------------------------
    // 1) 일반 유저 모드
    // --------------------------
    if (!isManager && !isAdmin) {
      return activeTab === 'draft'
        ? r.state === '진행' || r.state === '대기'
        : activeTab === 'complete'
          ? ['완료', '반려', '승인완료'].includes(r.state)
          : true;
    }

    // --------------------------
    // 2) 팀장 모드
    // --------------------------
    if (isManager) {
      if (!isManagerReportCard(r)) return false;

      if (activeTab === 'pending') {
        return r.manager_state === '대기';
      }

      if (activeTab === 'approved') {
        return r.manager_state !== '대기'; // 완료+반려 모두
      }

      return true;
    }

    // --------------------------
    // 3) 어드민 모드 (회계 / GM)
    // --------------------------
    if (isAdmin) {
      // 회계(adminRole === "finance")
      if (adminRole === 'finance') {
        if (activeTab === 'all') return true;

        if (activeTab === 'pending') {
          return r.manager_state === '완료' && r.finance_state === '대기';
        }

        if (activeTab === 'complete') {
          return r.finance_state !== '대기'; // 완료 + 반려
        }
      }

      // GM(adminRole === "gm")
      if (adminRole === 'gm') {
        if (activeTab === 'all') return true;

        if (activeTab === 'pending') {
          return r.manager_state === '완료' && r.finance_state === '완료' && r.gm_state === '대기';
        }

        if (activeTab === 'complete') {
          return r.gm_state !== '대기'; // 완료 + 반려
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
  const categories = isManagerPage
    ? [
        { value: '전체', label: '전체' },
        { value: '교육비', label: '교육비' },
        { value: '구매요청', label: '구매요청' },
        { value: '일반비용', label: '일반비용' },
        { value: '프로젝트', label: '프로젝트' }, // 🔥 매니저 전용
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
  // 매칭 상태 필터 적용
  const matchFiltered = categoryFiltered.filter((r) => {
    if (!matchStatus || matchStatus === 'all') return true;

    // 구매요청은 matched/unmatched에서 제외
    if (r.category === '구매요청') return false;

    if (matchStatus === 'matched') return !!r.expense_no;

    if (matchStatus === 'unmatched') return !r.expense_no;

    return true;
  });
  /*  // 카테고리 변경 시 1페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
    navigate(`?tab=${activeTab}&page=1`);
  }, [selectedCategory]);

  // 비용 매칭 상태 변경 시 1페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
    navigate(`?tab=${activeTab}&page=1`);
  }, [matchStatus]); */

  // 정렬
  const filteredReports = matchFiltered.sort((a, b) => b.id - a.id);

  // 페이지네이션
  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    navigate(`?tab=${activeTab}&page=${page}`, {
      replace: true, // 히스토리 누적 방지 (선택)
    });
  };

  return (
    <div>
      {/* 탭 + 필터 + 작성 버튼 */}
      <div className="mb-4 flex items-end justify-between gap-3">
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

        {showRegisterButton && onRegister && (
          <Button size="sm" onClick={onRegister}>
            기안서 작성하기
          </Button>
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
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedReports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showWriterInfo ? 8 : 6} className="py-10 text-center text-gray-500">
                문서가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            paginatedReports.map((report, index) => {
              const writer = showWriterInfo ? { team: report.team, name: report.user } : null;
              const displayStatus = report.approval_manager_display_state ?? report.approval_user_display_state ?? report.state;

              const rowNumber = filteredReports.length - ((currentPage - 1) * pageSize + index);

              const isCostCategory = report.category === '일반비용' || report.category === '교육비' || report.category === '프로젝트';

              return (
                <TableRow
                  key={report.id}
                  onClick={() => onRowClick(report.id, activeTab)}
                  className="cursor-pointer hover:bg-gray-100 [&_td]:text-[13px]">
                  {/* <TableCell>{generateReportNumber(report.category, report.id)}</TableCell> */}
                  <TableCell>{rowNumber}</TableCell>

                  <TableCell>{report.category}</TableCell>

                  {/* 제목 */}
                  <TableCell className="text-left">{report.title}</TableCell>
                  {/* 금액 */}
                  <TableCell className="text-right">{formatAmount(report.price)}원</TableCell>
                  {/* 비용 매칭 */}
                  {/* <TableCell>{report.expense_no}</TableCell> */}
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
                  {/* 상태 */}
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

                  {/* 작성자 + 팀명 */}
                  {showWriterInfo && writer && (
                    <>
                      <TableCell>{writer.team}</TableCell>
                      <TableCell>{writer.name}</TableCell>
                    </>
                  )}

                  {/* 날짜 */}
                  <TableCell>{formatKST(report.date, true)}</TableCell>
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
