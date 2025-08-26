import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from '@components/calendar/calendar';

const meta: Meta<typeof Calendar> = {
  title: 'Components/Calendar/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    showHolidays: {
      control: 'boolean',
      description: '공휴일 표시 여부',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

// 샘플 이벤트 데이터
const sampleEvents = [
  {
    id: '1',
    title: '연차',
    start: new Date('2025-08-13T09:10:00'),
    end: new Date('2025-08-14T10:00:00'),
    category: '연차',
    assignee: '이연상',
  },
  {
    id: '2',
    title: '오전반차',
    start: new Date('2025-08-14T14:00:00'),
    end: new Date('2025-08-14T15:30:00'),
    category: '반차',
    assignee: '이연상',
  },
  {
    id: '3',
    title: '오후반반차',
    start: new Date('2025-08-14T11:00:00'),
    end: new Date('2025-08-14T12:00:00'),
    category: '반반차',
    assignee: '김예솔',
  },
  {
    id: '4',
    title: '연차',
    start: new Date('2025-08-14T09:00:00'),
    end: new Date('2025-08-16T18:00:00'),
    category: '연차',
    assignee: '김노루',
  },
  {
    id: '5',
    title: '연차',
    start: new Date('2025-08-11T09:10:00'),
    end: new Date('2025-08-14T10:00:00'),
    category: '연차',
    assignee: '홍길동',
  },
  {
    id: '6',
    title: '연차',
    start: new Date('2025-08-14T09:10:00'),
    end: new Date('2025-08-25T10:00:00'),
    category: '연차',
    assignee: '홍길동2',
  },

];

export const Default: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
    showHolidays: true,
  },
};

export const WithoutHolidays: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
    showHolidays: false,
  },
  parameters: {
    docs: {
      description: {
        story: '공휴일 표시를 비활성화한 캘린더입니다.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    events: [],
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
    showHolidays: true,
  },
};

export const WithManyEvents: Story = {
  args: {
    events: [
      ...sampleEvents,
      {
        id: '6',
        title: '아침 운동',
        start: new Date('2025-08-14T07:00:00'),
        end: new Date('2025-08-14T08:00:00'),
        category: '운동',
        assignee: '정수진',
      },
      {
        id: '7',
        title: '저녁 식사',
        start: new Date('2025-08-14T18:00:00'),
        end: new Date('2025-08-14T19:00:00'),
        category: '식사',
        assignee: '한지민',
      },
      {
        id: '8',
        title: '영화 보기',
        start: new Date('2025-08-14T20:00:00'),
        end: new Date('2025-08-14T22:00:00'),
        category: '기타',
        assignee: '송혜교',
      },
    ],
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
    showHolidays: true,
  },
};

export const DayView: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
    showHolidays: true,
    initialViewMode: 'day',
  },
  parameters: {
    docs: {
      description: {
        story: '일별 뷰로 캘린더를 표시합니다. 시간별로 이벤트를 확인할 수 있습니다.',
      },
    },
  },
};

export const WeekView: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
    showHolidays: true,
    initialViewMode: 'week',
  },
  parameters: {
    docs: {
      description: {
        story: '주별 뷰로 캘린더를 표시합니다. 한 주의 스케줄을 시간별로 확인할 수 있습니다.',
      },
    },
  },
};

export const MonthView: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
    showHolidays: true,
    initialViewMode: 'month',
  },
  parameters: {
    docs: {
      description: {
        story: '월별 뷰로 캘린더를 표시합니다. 한 달의 전체 스케줄과 공휴일을 확인할 수 있습니다.',
      },
    },
  },
};

export const YearView: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
    showHolidays: true,
    initialViewMode: 'year',
  },
  parameters: {
    docs: {
      description: {
        story: '년별 뷰로 캘린더를 표시합니다. 한 해의 전체 월과 공휴일을 확인할 수 있습니다.',
      },
    },
  },
}; 