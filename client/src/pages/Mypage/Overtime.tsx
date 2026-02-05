import { useState } from 'react';
import MyOvertimeHistoryComponent from '@components/features/Overtime/history';
import Overview from '@components/features/Overtime/Overview';

export default function ManagerOvertime() {
  const [activeTab, setActiveTab] = useState<'weekday' | 'weekend'>('weekday');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year));
  };

  return (
    <div>
      
      <Overview 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onYearChange={handleYearChange}
      />
      <MyOvertimeHistoryComponent
        activeTab={activeTab}
        selectedYear={selectedYear}
      />
    </div>
  );
}
