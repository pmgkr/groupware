import type { Meta, StoryObj } from '@storybook/react';
import CalendarComponent from '@components/calendar/calendar';

const meta: Meta<typeof CalendarComponent> = {
  title: 'Components/Calendar/Calendar',
  component: CalendarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    events: {
      control: 'object',
      description: '캘린더에 표시할 이벤트 목록',
    },
    onEventSelect: {
      action: 'event selected',
      description: '이벤트 클릭 시 호출되는 콜백',
    },
    onSlotSelect: {
      action: 'slot selected',
      description: '빈 슬롯 클릭 시 호출되는 콜백',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CalendarComponent>;

// 샘플 이벤트 데이터
const sampleEvents = [
  {
    id: '1',
    title: '연차',
    start: new Date('2025-08-13T09:10:00'),
    end: new Date('2025-08-14T10:00:00'),
    type: '연차' as const,
  },
  {
    id: '2',
    title: '오전반차',
    start: new Date('2025-08-14T14:00:00'),
    end: new Date('2025-08-14T15:30:00'),
    type: '반차' as const,
  },
  {
    id: '3',
    title: '오후반반차',
    start: new Date('2025-08-14T11:00:00'),
    end: new Date('2025-08-14T12:00:00'),
    type: '반반차' as const,
  },
  {
    id: '4',
    title: '연차',
    start: new Date('2025-08-14T09:00:00'),
    end: new Date('2025-08-16T18:00:00'),
    type: '연차' as const,
  },
  {
    id: '5',
    title: '연차',
    start: new Date('2025-08-11T09:10:00'),
    end: new Date('2025-08-14T10:00:00'),
    type: '연차' as const,
  },
  {
    id: '6',
    title: '연차',
    start: new Date('2025-08-14T09:10:00'),
    end: new Date('2025-08-25T10:00:00'),
    type: '연차' as const,
  },
  {
    id: '7',
    title: '연차',
    start: new Date('2025-08-14T09:00:00'),
    end: new Date('2025-08-16T18:00:00'),
    type: '연차' as const,
  },
  {
    id: '8',
    title: '연차',
    start: new Date('2025-08-14T09:00:00'),
    end: new Date('2025-08-16T18:00:00'),
    type: '연차' as const,
  },
  {
    id: '9',
    title: '연차',
    start: new Date('2025-08-14T09:00:00'),
    end: new Date('2025-08-16T18:00:00'),
    type: '연차' as const,
  },
  {
    id: '10',
    title: '연차',
    start: new Date('2025-08-14T09:00:00'),
    end: new Date('2025-08-16T18:00:00'),
    type: '연차' as const,
  },
  {
    id: '11',
    title: '연차',
    start: new Date('2025-08-15T09:00:00'),
    end: new Date('2025-08-16T18:00:00'),
    type: '연차' as const,
  },
];

export const Default: Story = {
  args: {
    events: sampleEvents,
    onEventSelect: (event) => console.log('Event selected:', event),
    onSlotSelect: (slotInfo) => console.log('Slot selected:', slotInfo),
  },
};

export const Empty: Story = {
  args: {
    events: [],
    onEventSelect: (event) => console.log('Event selected:', event),
    onSlotSelect: (slotInfo) => console.log('Slot selected:', slotInfo),
  },
  parameters: {
    docs: {
      description: {
        story: '이벤트가 없는 빈 캘린더입니다.',
      },
    },
  },
};

export const WithManyEvents: Story = {
  args: {
    events: [
      ...sampleEvents,
      {
        id: '12',
        title: '아침 운동',
        start: new Date('2025-08-14T07:00:00'),
        end: new Date('2025-08-14T08:00:00'),
        type: '기타' as const,
      },
      {
        id: '13',
        title: '저녁 식사',
        start: new Date('2025-08-14T18:00:00'),
        end: new Date('2025-08-14T19:00:00'),
        type: '기타' as const,
      },
      {
        id: '14',
        title: '영화 보기',
        start: new Date('2025-08-14T20:00:00'),
        end: new Date('2025-08-14T22:00:00'),
        type: '기타' as const,
      },
      {
        id: '15',
        title: '회의',
        start: new Date('2025-08-14T10:00:00'),
        end: new Date('2025-08-14T11:00:00'),
        type: '기타' as const,
      },
      {
        id: '16',
        title: '점심 약속',
        start: new Date('2025-08-14T12:00:00'),
        end: new Date('2025-08-14T13:00:00'),
        type: '기타' as const,
      },
      {
        id: '17',
        title: '오후 미팅',
        start: new Date('2025-08-14T15:00:00'),
        end: new Date('2025-08-14T16:00:00'),
        type: '기타' as const,
      },
      {
        id: '18',
        title: '15일 연차',
        start: new Date('2025-08-15T09:00:00'),
        end: new Date('2025-08-16T18:00:00'),
        type: '연차' as const,
      },
      {
        id: '19',
        title: '15일 반차',
        start: new Date('2025-08-15T14:00:00'),
        end: new Date('2025-08-15T18:00:00'),
        type: '반차' as const,
      },
    ],
    onEventSelect: (event) => console.log('Event selected:', event),
    onSlotSelect: (slotInfo) => console.log('Slot selected:', slotInfo),
  },
  parameters: {
    docs: {
      description: {
        story: '한 날짜에 많은 이벤트가 있을 때 "더보기" 버튼이 표시됩니다.',
      },
    },
  },
};

export const MonthView: Story = {
  args: {
    events: sampleEvents,
    onEventSelect: (event) => console.log('Event selected:', event),
    onSlotSelect: (slotInfo) => console.log('Slot selected:', slotInfo),
  },
  parameters: {
    docs: {
      description: {
        story: '월별 뷰로 캘린더를 표시합니다. 한 달의 전체 스케줄을 확인할 수 있습니다.',
      },
    },
  },
}; 