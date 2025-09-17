import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { AppPagination } from '@/components/ui/AppPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchGray } from '@/assets/images/icons';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { formatAmount } from '@/utils';

interface ReportCard {
  id: number;
  report_num: string;
  category: string; // 카테고리 (교육비, 구매요청 등)
  state: '대기' | '진행중' | '완료' | '반려';
  title: string;
  price: number;
  content: string;
  team: string; // 팀명
  user: string; // 작성자
  date: string; // 작성일
}

export const dummyReports: ReportCard[] = [
  {
    id: 1,
    report_num: '25-01-001',
    category: '교육비',
    state: '대기',
    title: '외부교육 신청합니다. (인프런 교육 신청)',
    content: '1. 외부 교육을 신청하고자 아래와 같이 보고 드리오니 재가하여 주세요.',
    price: 88000,
    team: 'CCP',
    user: '차혜리',
    date: '2025-09-08',
  },
  {
    id: 2,
    report_num: '25-02-001',
    category: '구매요청',
    state: '진행중',
    title: '노트북 신규 구매 요청',
    content: '디자인팀 신규 입사자 장비 지급을 위해 노트북 구매를 요청드립니다.',
    price: 77000,
    team: 'CCD',
    user: '김민준',
    date: '2025-09-07',
  },
  {
    id: 3,
    report_num: '25-03-001',
    category: '일반품의',
    state: '반려',
    title: '사내 행사 비용 정산',
    content: '워크샵 행사 비용 정산 관련 지출 보고 드립니다.',
    price: 230000,
    team: 'HR',
    user: '이수정',
    date: '2025-09-05',
  },
  {
    id: 4,
    report_num: '25-04-001',
    category: '비용청구',
    state: '완료',
    title: '출장 교통비 청구',
    content: '9월 1일~3일 부산 출장 교통비를 청구합니다.',
    price: 10000,
    team: 'CCP',
    user: '박지훈',
    date: '2025-09-02',
  },
  {
    id: 5,
    report_num: '25-04-002',
    category: '비용청구',
    state: '완료',
    title: '교통비 청구',
    content: '9월 1일~3일 부산 출장 교통비를 청구합니다.',
    price: 181300,
    team: 'CCP',
    user: '박지훈',
    date: '2025-09-02',
  },
  {
    id: 6,
    report_num: '25-01-001',
    category: '교육비',
    state: '대기',
    title: '외부교육 신청합니다. (인프런 교육 신청)',
    content: '1. 외부 교육을 신청하고자 아래와 같이 보고 드리오니 재가하여 주세요.',
    price: 88000,
    team: 'CCP',
    user: '차혜리',
    date: '2025-09-08',
  },
  {
    id: 7,
    report_num: '25-02-001',
    category: '구매요청',
    state: '진행중',
    title: '노트북 신규 구매 요청',
    content: '디자인팀 신규 입사자 장비 지급을 위해 노트북 구매를 요청드립니다.',
    price: 77000,
    team: 'CCD',
    user: '김민준',
    date: '2025-09-07',
  },
  {
    id: 8,
    report_num: '25-03-001',
    category: '일반품의',
    state: '반려',
    title: '사내 행사 비용 정산',
    content: '워크샵 행사 비용 정산 관련 지출 보고 드립니다.',
    price: 230000,
    team: 'HR',
    user: '이수정',
    date: '2025-09-05',
  },
  {
    id: 9,
    report_num: '25-04-001',
    category: '비용청구',
    state: '완료',
    title: '출장 교통비 청구',
    content: '9월 1일~3일 부산 출장 교통비를 청구합니다.',
    price: 10000,
    team: 'CCP',
    user: '박지훈',
    date: '2025-09-02',
  },
  {
    id: 10,
    report_num: '25-04-002',
    category: '비용청구',
    state: '완료',
    title: '교통비 청구',
    content: '9월 1일~3일 부산 출장 교통비를 청구합니다.',
    price: 181300,
    team: 'CCP',
    user: '박지훈',
    date: '2025-09-02',
  },
  {
    id: 11,
    report_num: '25-04-002',
    category: '비용청구',
    state: '완료',
    title: '교통비 청구',
    content: '9월 1일~3일 부산 출장 교통비를 청구합니다.',
    price: 181300,
    team: 'CCP',
    user: '박지훈',
    date: '2025-09-02',
  },
  {
    id: 12,
    report_num: '25-04-002',
    category: '비용청구',
    state: '완료',
    title: '교통비 청구',
    content: '9월 1일~3일 부산 출장 교통비를 청구합니다.',
    price: 181300,
    team: 'CCP',
    user: '박지훈',
    date: '2025-09-02',
  },
];

const tabs = [
  { key: 'draft', label: '기안 문서' },
  { key: 'receive', label: '수신 문서' },
  { key: 'complete', label: '완료 문서' },
  { key: 'reference', label: '참조 문서' },
];

export default function HorizList() {
  const [activeTab, setActiveTab] = useState('draft');
  const navigate = useNavigate();

  //filtering
  const filteredReports = dummyReports
    .filter((r) => {
      if (activeTab === 'draft') return true;
      if (activeTab === 'receive') return r.state === '대기';
      if (activeTab === 'complete') {
        return r.state === '완료' || r.state === '반려';
      }
      if (activeTab === 'reference') return r.state === '진행중';
      return true;
    })
    .sort((a, b) => b.id - a.id);

  return (
    <>
      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative ${activeTab === tab.key} ? "text-primary font-bold" : "text-gray-500"`}>
                  {tab.label} {activeTab === tab.key && <span className="absolute right-0 bottom-0 left-0 h-[2px] bg-gray-950" />}
                </Button>
              ))}
            </div>
          </div>
          {/* 검색창 */}
          <div className="relative w-[200px]">
            <Input className="h-[40px] px-4 [&]:bg-white" placeholder="검색어 입력" />
            <Button variant="svgIcon" size="icon" className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2" aria-label="검색">
              <SearchGray className="text-gray-400" />
            </Button>
          </div>
        </div>

        {/* 게시판 테이블 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">문서번호</TableHead>
              <TableHead className="w-[120px]">구분</TableHead>
              <TableHead className="w-[500px]">제목</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>팀</TableHead>
              <TableHead>기안자</TableHead>
              <TableHead>일자</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableCell colSpan={9} className="py-10 text-center text-gray-500">
                문서가 없습니다.
              </TableCell>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} onClick={() => navigate(`${report.id}`)} className={`cursor-pointer hover:bg-gray-100`}>
                  <TableCell>{report.report_num}</TableCell>
                  <TableCell>{report.category}</TableCell>
                  <TableCell className="text-left">{report.title}</TableCell>
                  <TableCell>{formatAmount(report.price)}</TableCell>
                  <TableCell>{report.team}</TableCell>
                  <TableCell>{report.user}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>
                    {
                      {
                        대기: <Badge className="w-[45px]">대기</Badge>,
                        진행중: (
                          <Badge variant="outline" className="w-[45px]">
                            진행중
                          </Badge>
                        ),
                        완료: (
                          <Badge variant="secondary" className="w-[45px]">
                            완료
                          </Badge>
                        ),
                        반려: (
                          <Badge variant="pink" className="w-[45px]">
                            반려
                          </Badge>
                        ),
                      }[report.state]
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-5">
          <AppPagination totalPages={10} initialPage={1} visibleCount={5} />
        </div>
      </div>
    </>
  );
}
