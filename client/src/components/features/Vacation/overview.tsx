import { useState, useMemo, useEffect } from 'react';
import { Select, SelectItem, SelectGroup, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMyVacation, type MyVacationInfo } from '@/api/common/vacation';

interface OverviewProps {
  onYearChange?: (year: string) => void;
}

export default function Overview({ 
  onYearChange = () => {}
}: OverviewProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedYearSummary, setSelectedYearSummary] = useState<MyVacationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 2024년부터 현재 연도까지의 연도 배열 생성
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = 2024; year <= currentYear; year++) {
      years.push(year);
    }
    return years.reverse(); // 최신 연도부터 표시
  }, [currentYear]);

  // 선택된 연도의 휴가 요약 데이터 가져오기
  useEffect(() => {
    const loadVacationSummary = async () => {
      setLoading(true);
      try {
        const year = parseInt(selectedYear);
        const response = await getMyVacation(year);
        
        // summary 배열에서 선택된 연도 정보 찾기
        const yearSummary = response.summary.find(info => info.va_year === year);
        setSelectedYearSummary(yearSummary || null);
      } catch (error) {
        console.error('휴가 요약 정보를 불러오는데 실패했습니다:', error);
        setSelectedYearSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadVacationSummary();
  }, [selectedYear]);

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    onYearChange(value);
  };

  return (
    <div className="w-full flex items-center mb-5">
      {/* 연도 단일 선택 */}
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger size="sm">
          <SelectValue placeholder="연도 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {yearOptions.map((year) => (
              <SelectItem key={year} size="sm" value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2 ml-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-sm">총 사용휴가일수</span>
          <span className="text-gray-900 text-sm font-medium">
            {loading ? '-' : selectedYearSummary?.va_used || '0'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-sm">기본연차</span>
          <span className="text-gray-900 text-sm font-medium">
            {loading ? '-' : selectedYearSummary?.va_current || '0'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-sm">이월연차</span>
          <span className="text-gray-900 text-sm font-medium">
            {loading ? '-' : selectedYearSummary?.va_carryover || '0'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-sm">특별대휴</span>
          <span className="text-gray-900 text-sm font-medium">
            {loading ? '-' : selectedYearSummary?.va_comp || '0'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-sm">근속휴가</span>
          <span className="text-gray-900 text-sm font-medium">
            {loading ? '-' : selectedYearSummary?.va_long || '0'}
          </span>
        </div>
      </div>
    </div>
  );
}

