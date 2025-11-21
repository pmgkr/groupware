import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatAmount, formatKST } from '@/utils';
import { generateReportNumber, getReportList, type ReportCard } from '@/api/expense/proposal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const tabs = [
  { key: 'draft', label: '기안 문서' },
  { key: 'complete', label: '완료 문서' },
];
const pageSize = 10; // 한 페이지에 보여줄 개수

export default function ProposalList() {
  const [activeTab, setActiveTab] = useState('draft');
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const data = await getReportList();
        setReports(data);
      } catch (err) {
        console.error('❌ 보고서 목록 불러오기 실패:', err);
      }
    })();
  }, []);

  //filtering
  const tabFiltered = reports.filter((r) => {
    if (activeTab === 'draft') return true;
    if (activeTab === 'complete') return r.state === '완료' || r.state === '반려';
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
  const endIndex = startIndex + pageSize;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const categories = [
    { value: '전체', label: '전체' },
    { value: '교육비', label: '교육비' },
    { value: '구매요청', label: '구매요청' },
    { value: '일반비용', label: '일반비용' },
    { value: '프로젝트', label: '프로젝트' },
  ];

  return (
    <>
      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center">
              <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5">
                {tabs.map((tab) => (
                  <Button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`h-8 w-18 rounded-sm p-0 text-sm ${
                      activeTab === tab.key
                        ? 'bg-primary hover:bg-primary active:bg-primary text-white'
                        : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
                    } `}>
                    {tab.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-x-2 before:mr-3 before:ml-5 before:inline-flex before:h-7 before:w-[1px] before:bg-gray-300 before:align-middle">
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
          </div>
          <Button size="sm" onClick={() => navigate('register')}>
            기안서 작성하기
          </Button>
        </div>

        <Table variant="primary" align="center" className="table-fixed">
          <TableHeader>
            <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
              <TableHead className="w-[10%]">번호</TableHead>
              <TableHead className="w-[10%]">구분</TableHead>
              <TableHead className="w-[40%]">제목</TableHead>
              <TableHead className="w-[10%]">금액</TableHead>
              <TableHead className="w-[12%]">일자</TableHead>
              <TableHead className="w-[10%]">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableCell colSpan={9} className="h-100 py-10 text-center text-gray-500">
                문서가 없습니다.
              </TableCell>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} onClick={() => navigate(`view/${report.id}`)} className={`cursor-pointer hover:bg-gray-100`}>
                  <TableCell>{generateReportNumber(report.category, report.id)}</TableCell>
                  <TableCell>{report.category}</TableCell>
                  <TableCell className="text-left">{report.title}</TableCell>
                  <TableCell className="text-right">{formatAmount(report.price)}원</TableCell>
                  <TableCell>{formatKST(report.date, true)}</TableCell>
                  <TableCell>
                    {
                      {
                        대기: (
                          <Badge variant="secondary" className="w-[45px]">
                            대기
                          </Badge>
                        ),
                        진행: (
                          <Badge variant="outline" className="w-[45px]">
                            진행
                          </Badge>
                        ),
                        완료: <Badge className="w-[45px]">완료</Badge>,
                        반려: <Badge className="w-[45px] bg-[#FF2200]">반려</Badge>,
                      }[report.state]
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {reports.length > 0 && (
          <div className="mt-5">
            <AppPagination totalPages={totalPages} initialPage={currentPage} visibleCount={5} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </>
  );
}
