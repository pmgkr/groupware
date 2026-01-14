import CustomCalendar from '@/components/calendar/calendar';
import { customSelectConfigs, customEventTitleMapper, customEventFilter } from '@/components/calendar/config';
import { useCalendar } from '@/hooks/useCalendar';

interface CalendarProps {
  filterMyEvents?: boolean;
}

export default function Calendar({ filterMyEvents = false }: CalendarProps) {
  const { events, handleSaveEvent, handleDateChange, refreshEvents } = useCalendar({ filterMyEvents });

  return (
    <CustomCalendar 
      initialEvents={events}
      selectConfigs={customSelectConfigs}
      eventTitleMapper={customEventTitleMapper}
      eventFilter={customEventFilter}
      defaultView="month"
      defaultDate={new Date()}
      onSaveEvent={handleSaveEvent}
      onDateChange={handleDateChange}
      onRefreshEvents={refreshEvents}
    />
  );
} 