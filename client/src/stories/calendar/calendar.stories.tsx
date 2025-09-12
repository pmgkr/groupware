import type { Meta, StoryObj } from '@storybook/react';
import { parse } from "date-fns/parse";
import CalendarComponent from '../../components/calendar/calendar';

const meta: Meta<typeof CalendarComponent> = {
  title: 'Calendar/Calendar',
  component: CalendarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    initialEvents: {
      control: 'object',
      description: '캘린더에 표시할 초기 이벤트 목록',
    },
    selectConfigs: {
      control: 'object',
      description: '툴바의 셀렉트 옵션 설정',
    },
    eventTitleMapper: {
      control: false,
      description: '이벤트 타입별 제목 매핑 함수',
    },
    eventFilter: {
      control: false,
      description: '이벤트 필터링 함수',
    },
    defaultView: {
      control: 'select',
      options: ['month', 'week', 'day'],
      description: '기본 뷰',
    },
    defaultDate: {
      control: 'date',
      description: '기본 날짜',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CalendarComponent>;

// 샘플 이벤트 데이터
const sampleEvents = [
  {
    title: "연차",
    start: parse("2025-08-20 10:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-05 11:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "연차입니다.",
    resource: {
      seq: 1,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      teamId: 1,
      teamName: "dev",
      schTitle: "연차",
      schType: "vacation",
      schVacationType: "day" as string | null,
      schEventType: null,
      schSdate: "2025-08-20",
      schStime: "10:00:00",
      schEdate: "2025-09-05", 
      schEtime: "11:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "연차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "오전 반차",
    start: parse("2025-09-02 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-02 13:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: false,
    author: "이동훈",
    description: "오전 반차입니다.",
    resource: {
      seq: 2,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557y",
      teamId: 2,
      teamName: "design",
      schTitle: "오전 반차",
      schType: "vacation",
      schVacationType: "half" as string | null,
      schEventType: null,
      schSdate: "2025-09-02",
      schStime: "09:00:00",
      schEdate: "2025-09-02",
      schEtime: "13:00:00",
      schIsAllday: "N",
      schIsHoliday: "N",
      schDescription: "오전 반차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "오전 반반차",
    start: parse("2025-09-03 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-03 10:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: false,
    author: "이동훈",
    description: "오전 반반차입니다.",
    resource: {
      seq: 3,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557z",
      teamId: 3,
      teamName: "design",
      schTitle: "오전 반반차",
      schType: "vacation",
      schVacationType: "quarter" as string | null,
      schEventType: null,
      schSdate: "2025-09-03",
      schStime: "09:00:00",
      schEdate: "2025-09-03",
      schEtime: "10:00:00",
      schIsAllday: "N",
      schIsHoliday: "N",
      schDescription: "오전 반반차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "오후 반차",
    start: parse("2025-09-04 13:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-04 18:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: false,
    author: "이동훈",
    description: "오후 반차입니다.",
    resource: {
      seq: 4,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557a",
      teamId: 1,
      teamName: "design",
      schTitle: "오후 반차",
      schType: "vacation",
      schVacationType: "half" as string | null,
      schEventType: null,
      schSdate: "2025-09-04",
      schStime: "13:00:00",
      schEdate: "2025-09-04",
      schEtime: "18:00:00",
      schIsAllday: "N",
      schIsHoliday: "N",
      schDescription: "오후 반차입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "외부 일정",
    start: parse("2025-08-30 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-01 10:00", "yyyy-MM-dd HH:mm", new Date()), 
    allDay: true,
    author: "이연상",
    description: "외부 일정입니다.",
    resource: {
      seq: 5,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      teamId: 1,
      teamName: "dev",
      schTitle: "외부 일정",
      schType: "event",
      schVacationType: null,
      schEventType: "field" as string | null,
      schSdate: "2025-08-30",
      schStime: "09:00:00",
      schEdate: "2025-09-01",
      schEtime: "10:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "외부 일정입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
  {
    title: "외부 일정",
    start: parse("2025-09-20 09:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2025-09-21 10:00", "yyyy-MM-dd HH:mm", new Date()),
    allDay: true,
    author: "이연상",
    description: "외부 일정입니다.",
    resource: {
      seq: 6,
      userId: "ec1f6076-9fcc-48c6-b0e9-e39dbc29557x",
      teamId: 1,
      teamName: "dev",
      schTitle: "외부 일정",
      schType: "event",
      schVacationType: null,
      schEventType: "field" as string | null,
      schSdate: "2025-09-20",
      schStime: "09:00:00",
      schEdate: "2025-09-21",
      schEtime: "10:00:00",
      schIsAllday: "Y",
      schIsHoliday: "N",
      schDescription: "외부 일정입니다.",
      schStatus: "Y",
      schModifiedAt: new Date(),
      schCreatedAt: new Date()
    }
  },
];

// 기본 셀렉트 설정
const defaultSelectConfigs = [
  {
    id: 'team',
    placeholder: '팀 선택',
    options: [
      { value: 'team_dev', label: '개발팀' },
      { value: 'team_design', label: '디자인팀' },
      { value: 'team_marketing', label: '마케팅팀' },
      { value: 'team_sales', label: '영업팀' },
    ],
    value: [],
    autoSize: true,
    searchable: true,
    hideSelectAll: false,
    maxCount: 0
  },
  {
    id: 'type',
    placeholder: '타입 선택',
    options: [
      { value: 'type_vacation', label: '연차' },
      { value: 'type_halfday', label: '반차' },
      { value: 'type_quarter', label: '반반차' },
      { value: 'type_remote', label: '재택' },
      { value: 'type_field', label: '외부 일정' },
    ],
    value: [],
    autoSize: true,
    searchable: true,
    hideSelectAll: false,
    maxCount: 0,
  }
];

// 기본 이벤트 제목 매핑 함수
const defaultEventTitleMapper = (eventType: string) => {
  switch (eventType) {
    case 'eventVacation':
      return '연차';
    case 'eventHalfDayMorning':
      return '오전 반차';
    case 'eventHalfDayAfternoon':
      return '오후 반차';
    case 'eventQuarter':
      return '반반차';
    case 'eventOfficialLeave':
      return '공가';
    case 'eventRemote':
      return '재택';
    case 'eventField':
      return '외부 일정';
    default:
      return '일정';
  }
};

// 기본 이벤트 필터링 함수
const defaultEventFilter = (events: any[], selectConfigs: any[]) => {
  let filteredEvents = [...events];
  
  // 팀 필터링
  const teamConfig = selectConfigs.find(config => config.id === 'team');
  if (teamConfig && teamConfig.value && teamConfig.value.length > 0) {
    filteredEvents = filteredEvents.filter(event => {
      return teamConfig.value?.some((selectedTeam: string) => {
        if (!event.resource.teamName) return false;
        switch (selectedTeam) {
          case 'team_dev':
            return event.resource.teamName === 'dev';
          case 'team_design':
            return event.resource.teamName === 'design';
          case 'team_marketing':
            return event.resource.teamName === 'marketing';
          case 'team_sales':
            return event.resource.teamName === 'sales';
          default:
            return false;
        }
      });
    });
  }
  
  // 타입 필터링
  const typeConfig = selectConfigs.find(config => config.id === 'type');
  if (typeConfig && typeConfig.value && typeConfig.value.length > 0) {
    filteredEvents = filteredEvents.filter(event => {
      const eventType = event.resource.schType;
      const vacationType = event.resource.schVacationType;
      
      return typeConfig.value?.some((selectedType: string) => {
        switch (selectedType) {
          case 'type_vacation':
            return eventType === 'vacation' && vacationType === 'day';
          case 'type_halfday':
            return eventType === 'vacation' && vacationType === 'half';
          case 'type_quarter':
            return eventType === 'vacation' && vacationType === 'quarter';
          case 'type_remote':
            return eventType === 'event' && event.resource.schEventType === 'remote';
          case 'type_field':
            return eventType === 'event' && event.resource.schEventType === 'field';
          default:
            return false;
        }
      });
    });
  }
  
  return filteredEvents;
};

export const Default: Story = {
  args: {
    initialEvents: sampleEvents,
    selectConfigs: defaultSelectConfigs,
    eventTitleMapper: defaultEventTitleMapper,
    eventFilter: defaultEventFilter,
    defaultView: 'month',
    defaultDate: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story: '기본 캘린더입니다. 팀과 타입별로 필터링할 수 있습니다.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    initialEvents: [],
    selectConfigs: defaultSelectConfigs,
    eventTitleMapper: defaultEventTitleMapper,
    eventFilter: defaultEventFilter,
    defaultView: 'month',
    defaultDate: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story: '이벤트가 없는 빈 캘린더입니다.',
      },
    },
  },
};

export const WeekView: Story = {
  args: {
    initialEvents: sampleEvents,
    selectConfigs: defaultSelectConfigs,
    eventTitleMapper: defaultEventTitleMapper,
    eventFilter: defaultEventFilter,
    defaultView: 'week',
    defaultDate: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story: '주별 뷰로 캘린더를 표시합니다. 한 주의 상세한 스케줄을 확인할 수 있습니다.',
      },
    },
  },
};

export const DayView: Story = {
  args: {
    initialEvents: sampleEvents,
    selectConfigs: defaultSelectConfigs,
    eventTitleMapper: defaultEventTitleMapper,
    eventFilter: defaultEventFilter,
    defaultView: 'day',
    defaultDate: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story: '일별 뷰로 캘린더를 표시합니다. 하루의 상세한 스케줄을 확인할 수 있습니다.',
      },
    },
  },
};

export const WithTeamFilter: Story = {
  args: {
    initialEvents: sampleEvents,
    selectConfigs: [
      {
        id: 'team',
        placeholder: '팀 선택',
        options: [
          { value: 'team_dev', label: '개발팀' },
          { value: 'team_design', label: '디자인팀' },
        ],
        value: ['team_dev'],
        autoSize: true,
        searchable: true,
        hideSelectAll: false,
        maxCount: 0
      },
      {
        id: 'type',
        placeholder: '타입 선택',
        options: [
          { value: 'type_vacation', label: '연차' },
          { value: 'type_halfday', label: '반차' },
          { value: 'type_quarter', label: '반반차' },
          { value: 'type_remote', label: '재택' },
          { value: 'type_field', label: '외부 일정' },
        ],
        value: [],
        autoSize: true,
        searchable: true,
        hideSelectAll: false,
        maxCount: 0,
      }
    ],
    eventTitleMapper: defaultEventTitleMapper,
    eventFilter: defaultEventFilter,
    defaultView: 'month',
    defaultDate: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story: '개발팀으로 필터링된 캘린더입니다. 개발팀 이벤트만 표시됩니다.',
      },
    },
  },
};

export const WithTypeFilter: Story = {
  args: {
    initialEvents: sampleEvents,
    selectConfigs: [
      {
        id: 'team',
        placeholder: '팀 선택',
        options: [
          { value: 'team_dev', label: '개발팀' },
          { value: 'team_design', label: '디자인팀' },
          { value: 'team_marketing', label: '마케팅팀' },
          { value: 'team_sales', label: '영업팀' },
        ],
        value: [],
        autoSize: true,
        searchable: true,
        hideSelectAll: false,
        maxCount: 0
      },
      {
        id: 'type',
        placeholder: '타입 선택',
        options: [
          { value: 'type_vacation', label: '연차' },
          { value: 'type_halfday', label: '반차' },
          { value: 'type_quarter', label: '반반차' },
          { value: 'type_remote', label: '재택' },
          { value: 'type_field', label: '외부 일정' },
        ],
        value: ['type_vacation'],
        autoSize: true,
        searchable: true,
        hideSelectAll: false,
        maxCount: 0,
      }
    ],
    eventTitleMapper: defaultEventTitleMapper,
    eventFilter: defaultEventFilter,
    defaultView: 'month',
    defaultDate: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story: '연차로 필터링된 캘린더입니다. 연차 이벤트만 표시됩니다.',
      },
    },
  },
}; 