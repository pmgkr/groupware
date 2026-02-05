import { useState } from 'react';
import { Select, SelectItem, SelectGroup, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getGrowingYears } from '@/utils';

interface OverviewProps {
  activeTab?: 'weekday' | 'weekend';
  onTabChange?: (tab: 'weekday' | 'weekend') => void;
  onYearChange?: (year: string) => void;
}

export default function Overview({
  activeTab = 'weekday',
  onTabChange = () => {},
  onYearChange = () => {}
}: OverviewProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  const yearOptions = getGrowingYears().reverse();

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    onYearChange(value);
  };

  return (
    <div className="w-full flex items-center flex-wrap gap-2 mb-5 max-md:gap-2">
      {/* 탭 버튼 */}
      <div className="flex items-center rounded-sm bg-gray-300 p-1 px-1.5 max-md:w-full max-md:p-1">
        <Button
          onClick={() => onTabChange('weekday')}
          className={`h-8 w-22 rounded-sm p-0 text-sm max-md:w-1/2 max-md:flex-1 ${
            activeTab === 'weekday'
              ? 'bg-primary hover:bg-primary active:bg-primary text-white'
              : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
          }`}>
          평일 연장근무
        </Button>
        <Button
          onClick={() => onTabChange('weekend')}
          className={`h-8 w-18 rounded-sm p-0 text-sm max-md:w-1/2 max-md:flex-1 ${
            activeTab === 'weekend'
              ? 'bg-primary hover:bg-primary active:bg-primary text-white'
              : 'text-muted-foreground bg-transparent hover:bg-transparent active:bg-transparent'
          }`}>
          휴일 근무
        </Button>
      </div>

      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger
          size="sm"
          className="ml-4 w-[120px] max-md:ml-0 max-md:w-[100px]"
        >
          <SelectValue placeholder="연도 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {yearOptions.map((year) => (
              <SelectItem key={year} size="sm" value={year}>
                {year}년
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

