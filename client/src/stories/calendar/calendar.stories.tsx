// calendar.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar } from '@components/calendar/calendar';

const meta: Meta<typeof Calendar> = {
  title: 'Components/UI/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  args: {
    mode: 'single',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'minimal'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'full'],
    },
    mode: {
      control: 'select',
      options: ['single', 'multiple', 'range'],
    },
    captionLayout: {
      control: 'select',
      options: ['label', 'dropdown'],
    },
    buttonVariant: {
      control: 'select',
      options: ['ghost', 'outline', 'default'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

// 상태를 관리하는 래퍼 컴포넌트
const CalendarWithState = ({ mode, ...props }: any) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dates, setDates] = useState<Date[] | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  if (mode === 'multiple') {
    return <Calendar mode="multiple" selected={dates} onSelect={setDates} {...props} />;
  }
  
  if (mode === 'range') {
    return <Calendar mode="range" selected={dateRange} onSelect={setDateRange} {...props} />;
  }
  
  return <Calendar mode="single" selected={date} onSelect={setDate} {...props} />;
};

export const Default: Story = {
  render: (args) => <CalendarWithState {...args} />,
  args: {
    variant: 'default',
    size: 'default',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const Filled: Story = {
  render: (args) => <CalendarWithState {...args} />,
  args: {
    variant: 'filled',
    size: 'default',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const Minimal: Story = {
  render: (args) => <CalendarWithState {...args} />,
  args: {
    variant: 'minimal',
    size: 'default',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const WithDropdown: Story = {
  render: (args) => <CalendarWithState {...args} />,
  args: {
    variant: 'default',
    size: 'default',
    mode: 'single',
    captionLayout: 'dropdown',
  },
};

export const Small: Story = {
  render: (args) => <CalendarWithState {...args} />,
  args: {
    variant: 'default',
    size: 'sm',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const Large: Story = {
  render: (args) => <CalendarWithState {...args} />,
  args: {
    variant: 'default',
    size: 'lg',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const MultipleSelection: Story = {
  render: (args) => <CalendarWithState {...args} />,
  args: {
    variant: 'default',
    size: 'default',
    mode: 'multiple',
    captionLayout: 'label',
  },
};

export const RangeSelection: Story = {
  render: (args) => <CalendarWithState {...args} />,
  args: {
    variant: 'default',
    size: 'default',
    mode: 'range',
    captionLayout: 'label',
  },
};

export const Examples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <CalendarWithState variant="default" size="sm" mode="single" captionLayout="label" />
      <CalendarWithState variant="filled" size="default" mode="single" captionLayout="dropdown" />
      <CalendarWithState variant="minimal" size="lg" mode="single" captionLayout="label" />
    </div>
  ),
}; 