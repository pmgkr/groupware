import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from '@components/calendar/calendar';

const meta: Meta<typeof Calendar> = {
  title: 'Components/Calendar/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

// 샘플 이벤트 데이터
const sampleEvents = [
  {
    id: '1',
    title: '팀 미팅',
    start: new Date('2025-07-25T09:00:00'),
    end: new Date('2025-07-25T10:00:00'),
    color: 'blue',
  },
  {
    id: '2',
    title: '프로젝트 리뷰',
    start: new Date('2025-07-25T14:00:00'),
    end: new Date('2025-07-25T15:30:00'),
    color: 'green',
  },
  {
    id: '3',
    title: '고객 미팅',
    start: new Date('2025-07-25T11:00:00'),
    end: new Date('2025-07-25T12:00:00'),
    color: 'purple',
  },
  {
    id: '4',
    title: '점심 약속',
    start: new Date('2025-07-25T12:00:00'),
    end: new Date('2025-07-25T13:00:00'),
    color: 'orange',
  },
  {
    id: '5',
    title: '코딩 세션',
    start: new Date('2025-07-25T15:00:00'),
    end: new Date('2025-07-25T17:00:00'),
    color: 'pink',
  },
];

export const Default: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
  },
};

export const Empty: Story = {
  args: {
    events: [],
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
  },
};

export const WithManyEvents: Story = {
  args: {
    events: [
      ...sampleEvents,
      {
        id: '6',
        title: '아침 운동',
        start: new Date('2025-07-25T07:00:00'),
        end: new Date('2025-07-25T08:00:00'),
        color: 'red',
      },
      {
        id: '7',
        title: '저녁 식사',
        start: new Date('2025-07-25T18:00:00'),
        end: new Date('2025-07-25T19:00:00'),
        color: 'yellow',
      },
      {
        id: '8',
        title: '영화 보기',
        start: new Date('2025-07-25T20:00:00'),
        end: new Date('2025-07-25T22:00:00'),
        color: 'gray',
      },
    ],
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
  },
};

export const DayView: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
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
  },
  parameters: {
    docs: {
      description: {
        story: '월별 뷰로 캘린더를 표시합니다. 한 달의 전체 스케줄을 확인할 수 있습니다.',
      },
    },
  },
};

export const YearView: Story = {
  args: {
    events: sampleEvents,
    onEventClick: (event) => console.log('Event clicked:', event),
    onDateClick: (date) => console.log('Date clicked:', date),
  },
  parameters: {
    docs: {
      description: {
        story: '년별 뷰로 캘린더를 표시합니다. 한 해의 전체 월을 확인할 수 있습니다.',
      },
    },
  },
}; 