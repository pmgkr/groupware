import { Emoji, Pin, Plus } from '@/assets/images/icons';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ReportCard {
  id: number;
  category: string; // 카테고리 (교육비, 구매요청 등)
  state: '대기' | '진행중' | '완료' | '반려';
  title: string;
  content: string;
  team: string; // 팀명
  user: string; // 작성자
  date: string; // 작성일
}

export const dummyReports: ReportCard[] = [
  {
    id: 1,
    category: '교육비',
    state: '대기',
    title: '외부교육 신청합니다. (인프런 교육 신청)',
    content: '1. 외부 교육을 신청하고자 아래와 같이 보고 드리오니 재가하여 주세요.',
    team: 'CCP',
    user: '차혜리',
    date: '2025-09-08',
  },
  {
    id: 2,
    category: '구매요청',
    state: '진행중',
    title: '노트북 신규 구매 요청',
    content: '디자인팀 신규 입사자 장비 지급을 위해 노트북 구매를 요청드립니다.',
    team: 'CCD',
    user: '김민준',
    date: '2025-09-07',
  },
  {
    id: 3,
    category: '일반품의',
    state: '반려',
    title: '사내 행사 비용 정산',
    content: '워크샵 행사 비용 정산 관련 지출 보고 드립니다.',
    team: 'HR',
    user: '이수정',
    date: '2025-09-05',
  },
  {
    id: 4,
    category: '비용청구',
    state: '완료',
    title: '출장 교통비 청구',
    content: '9월 1일~3일 부산 출장 교통비를 청구합니다.',
    team: 'CCP',
    user: '박지훈',
    date: '2025-09-02',
  },
];

export default function BlockItem() {
  return (
    <>
      <div>
        {dummyReports.map((report) => (
          <div className="border-primary-blue-100 mb-4 rounded-2xl border-2 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm">{report.category}</span>
              <Badge variant="secondary" className="px-4">
                {report.state}
              </Badge>
            </div>
            <h3 className="mb-3 font-bold">{report.title}</h3>
            <p className="mb-5 w-full truncate text-sm text-gray-600">{report.content}</p>
            <div className="flex items-center justify-between">
              <div>
                <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="자세히 보기">
                  <Plus className="size-5" />
                </Button>
                <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="고정하기">
                  <Pin className="size-5" />
                </Button>
                <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="이모티콘">
                  <Emoji className="size-5" />
                </Button>
              </div>
              <div className="flex items-center text-sm">
                <span className="pr-1">{report.team}</span>
                <div className="pr-4">{report.user}</div>
                <div>{report.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
