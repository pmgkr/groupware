import { Emoji, Pin, Plus } from '@/assets/images/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

interface ReportCard {
  id: number;
  report_num: string;
  category: string; // 카테고리 (교육비, 구매요청 등)
  state: '대기' | '진행중' | '완료' | '반려';
  title: string;
  content: string;
  price: number;
  team: string; // 팀명
  user: string; // 작성자
  date: string; // 작성일
}
interface BlockItemProps {
  filter?: '대기' | '진행중' | '완료' | '반려' | 'all'; // 필터 조건
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

export default function BlockItem({ filter = 'all' }: BlockItemProps) {
  //필터
  const filteredReports = dummyReports.filter((report) => {
    if (filter === 'all') return true;
    if (filter === '완료') {
      return report.state === '완료' || report.state === '반려';
    }
    return report.state === filter;
  });
  if (filteredReports.length === 0) {
    return <div className="py-10 text-center text-gray-500">문서가 없습니다.</div>;
  }

  // id별 선택된 이모티콘 저장
  const [selectedEmojis, setSelectedEmojis] = useState<Record<number, string>>({});
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const handleSelectEmoji = (id: number, emoji: string) => {
    setSelectedEmojis((prev) => ({ ...prev, [id]: emoji }));
    setOpenPopoverId(null); // ✅ 선택하면 popover 닫기
  };
  const emojis = ['💗', '😀', '🔥', '👍', '🎉', '😢', '💡'];

  return (
    <>
      {filteredReports.map((report) => (
        <div key={report.id} className="border-primary-blue-100 mb-3 rounded-2xl border-2 bg-white px-4 py-3 pb-2.5 last:mb-0">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-sm">{report.category}</span>
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
          </div>
          <h3 className="mb-2.5 font-bold">{report.title}</h3>
          <p className="mb-3.5 w-full truncate text-sm text-gray-600">{report.content}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="자세히 보기">
                <Plus className="size-5" />
              </Button>
              <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="고정하기">
                <Pin className="size-5" />
              </Button>
              {/* 이모티콘 버튼 */}
              <Popover open={openPopoverId === report.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? report.id : null)}>
                <PopoverTrigger asChild>
                  <Button variant="svgIcon" size="icon" aria-label="이모티콘">
                    {selectedEmojis[report.id] ? (
                      <span className="text-xl">{selectedEmojis[report.id]}</span>
                    ) : (
                      <Emoji className="size-5" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="grid w-[220px] grid-cols-6 gap-2 p-2">
                  {emojis.map((em) => (
                    <button key={em} onClick={() => handleSelectEmoji(report.id, em)} className="text-xl transition hover:scale-110">
                      {em}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center text-sm">
              <span className="pr-1">{report.team}</span>
              <div className="pr-4">{report.user}</div>
              <div>{report.date}</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
