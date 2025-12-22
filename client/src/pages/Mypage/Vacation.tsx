import { useState } from 'react';
import { useSearchParams } from 'react-router';
import VacationHistory from '@components/features/Vacation/history';
import Overview from '@components/features/Vacation/overview';
import { getGrowingYears } from '@/utils';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ManagerVacation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = String(new Date().getFullYear());
  const yearOptions = getGrowingYears().reverse(); // 최신 연도부터 표시
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || currentYear);

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    const newParams = new URLSearchParams(searchParams);
    if (value === currentYear) {
      newParams.delete('year');
    } else {
      newParams.set('year', value);
    }
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div>
      <div className="mb-4">
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger size="sm" className="w-[120px]">
            <SelectValue placeholder="연도 선택" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem size="sm" key={y} value={y}>
                {y}년
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Overview year={selectedYear} />
      <VacationHistory year={Number(selectedYear)} />
    </div>
  );
}
