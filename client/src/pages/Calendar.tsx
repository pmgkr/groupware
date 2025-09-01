import CustomCalendar from '@/components/calendar/calendar';

export default function Calendar() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">캘린더</h1>
        <CustomCalendar />
      </div>
    </div>
  );
} 