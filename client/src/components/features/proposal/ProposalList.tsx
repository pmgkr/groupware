import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppPagination } from '@/components/ui/AppPagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAmount, formatKST } from '@/utils';
import { useEffect, useState } from 'react';
import { generateReportNumber, type ReportCard } from '@/api/expense/proposal';
import type { ManagerReportCard } from '@/api/manager/proposal';
import { useNavigate, useSearchParams } from 'react-router';

interface ProposalListContentProps {
  reports: ReportCard[]; // ManagerReportCard도 포함 가능
  onRowClick: (id: number, tab: string) => void;
  onRegister?: () => void;
  pageSize?: number;

  // 매니저용 옵션
  isManager?: boolean; // 매니저 화면인지 여부
  showWriterInfo?: boolean; //기안자 확인용
  showRegisterButton?: boolean; //승인반려버튼
}
function isManagerReportCard(report: ReportCard | ManagerReportCard): report is ManagerReportCard {
  return 'manager_state' in report;
}

const tabs = [
  { key: 'draft', label: '기안 문서' },
  { key: 'complete', label: '완료 문서' },
];

const categories = [
  { value: '전체', label: '전체' },
  { value: '교육비', label: '교육비' },
  { value: '구매요청', label: '구매요청' },
  { value: '일반비용', label: '일반비용' },
];

export default function ProposalList({
  reports,
  pageSize = 10,
  onRowClick,
  onRegister,
  showWriterInfo = false,
  showRegisterButton = true,
  isManager,
}: ProposalListContentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL에 tab=... 있으면 그걸 기본값으로
  const initialTab = searchParams.get('tab') || (isManager ? 'pending' : 'draft');
  const [activeTab, setActiveTab] = useState(initialTab);
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    navigate(`?tab=${key}`);
  };
  useEffect(() => {
    const tab = searchParams.get('tab') || (isManager ? 'pending' : 'draft');
    setActiveTab(tab);
  }, [searchParams]);

  // 탭 필터링
  const managerTabs = [
    { key: 'pending', label: '결재 대기 문서' },
    { key: 'approved', label: '결재 완료 문서' },
  ];

  const userTabs = [
    { key: 'draft', label: '기안 문서' },
    { key: 'complete', label: '완료 문서' },
  ];

  const usedTabs = isManager ? managerTabs : userTabs;
  const tabFiltered = reports.filter((r) => {
    if (!isManager) {
      // 일반 유저 모드
      return activeTab === 'draft'
        ? r.state === '진행' || r.state === '대기'
        : activeTab === 'complete'
          ? r.state === '완료' || r.state === '반려'
          : true;
    }

    // 🔥 팀장용
    if (!isManagerReportCard(r)) return false;

    if (activeTab === 'pending') {
      return r.manager_state === '대기';
    }

    if (activeTab === 'approved') {
      return r.manager_state === '반려' || r.manager_state === '완료';
    }

    return true;
  });

  // 카테고리 필터링
  const categoryFiltered =
    !selectedCategory || selectedCategory === '전체' ? tabFiltered : tabFiltered.filter((r) => r.category === selectedCategory);

  // 정렬
  const filteredReports = categoryFiltered.sort((a, b) => b.id - a.id);

  // 페이지네이션
  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => setCurrentPage(page);

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

          <div className="flex items-center gap-x-2 before:mr-3 before:ml-3 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
            <TableHead className="w-[10%]">번호</TableHead>
            <TableHead className="w-[10%]">구분</TableHead>
            <TableHead className="w-[40%]">제목</TableHead>
            <TableHead className="w-[10%]">금액</TableHead>

            {showWriterInfo && (
              <>
                <TableHead className="w-[8%]">팀</TableHead>
                <TableHead className="w-[8%]">작성자</TableHead>
              </>
            )}
            <TableHead className="w-[10%]">일자</TableHead>
            <TableHead className="w-[10%]">상태</TableHead>
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
            paginatedReports.map((report) => {
              const writer = showWriterInfo ? { team: report.team, name: report.user } : null;

              return (
                <TableRow key={report.id} onClick={() => onRowClick(report.id, activeTab)} className="cursor-pointer hover:bg-gray-100">
                  <TableCell>{generateReportNumber(report.category, report.id)}</TableCell>
                  <TableCell>{report.category}</TableCell>

                  {/* 제목 */}
                  <TableCell className="text-left">{report.title}</TableCell>

                  {/* 금액 */}
                  <TableCell className="text-right">{formatAmount(report.price)}원</TableCell>

                  {/* 작성자 + 팀명 */}
                  {showWriterInfo && writer && (
                    <>
                      <TableCell>{writer.team}</TableCell>
                      <TableCell>{writer.name}</TableCell>
                    </>
                  )}

                  {/* 날짜 */}
                  <TableCell>{formatKST(report.date, true)}</TableCell>

                  {/* 상태 */}
                  <TableCell>
                    {(() => {
                      const displayStatus = (() => {
                        if (isManager && isManagerReportCard(report)) {
                          return report.approval_display_state;
                        }
                        return report.state;
                      })();

                      switch (displayStatus) {
                        case '팀장결재대기':
                          return (
                            <Badge variant="secondary" size="table">
                              결재대기
                            </Badge>
                          );
                        case '팀장결재완료':
                          return <Badge size="table">결재완료</Badge>;
                        case '팀장반려':
                          return (
                            <Badge size="table" className="bg-[#FF2200]">
                              반려
                            </Badge>
                          );
                        case '대기':
                          return (
                            <Badge variant="secondary" size="table">
                              대기
                            </Badge>
                          );
                        case '진행':
                          return (
                            <Badge variant="outline" size="table">
                              진행
                            </Badge>
                          );
                        case '완료':
                          return <Badge size="table">완료</Badge>;
                        case '반려':
                          return (
                            <Badge size="table" className="bg-[#FF2200]">
                              반려
                            </Badge>
                          );
                        default:
                          return null;
                      }
                    })()}
                  </TableCell>
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
