// calendar.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DayPicker } from '@components/calendar/daypicker';

const meta: Meta<typeof DayPicker> = {
  title: 'Components/Calendar/DayPicker',
  component: DayPicker,
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
type Story = StoryObj<typeof DayPicker>;

// 상태를 관리하는 래퍼 컴포넌트
const DayPickerWithState = ({ mode, ...props }: any) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dates, setDates] = useState<Date[] | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);

  if (mode === 'multiple') {
    return <DayPicker mode="multiple" selected={dates} onSelect={setDates} {...props} />;
  }
  
  if (mode === 'range') {
    return <DayPicker mode="range" selected={dateRange} onSelect={setDateRange} {...props} />;
  }
  
  return <DayPicker mode="single" selected={date} onSelect={setDate} {...props} />;
};

export const Default: Story = {
  render: (args) => <DayPickerWithState {...args} />, 
  args: {
    variant: 'default',
    size: 'default',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const Filled: Story = {
  render: (args) => <DayPickerWithState {...args} />, 
  args: {
    variant: 'filled',
    size: 'default',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const Minimal: Story = {
  render: (args) => <DayPickerWithState {...args} />, 
  args: {
    variant: 'minimal',
    size: 'default',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const WithDropdown: Story = {
  render: (args) => <DayPickerWithState {...args} />, 
  args: {
    variant: 'default',
    size: 'default',
    mode: 'single',
    captionLayout: 'dropdown',
  },
};

export const Small: Story = {
  render: (args) => <DayPickerWithState {...args} />, 
  args: {
    variant: 'default',
    size: 'sm',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const Large: Story = {
  render: (args) => <DayPickerWithState {...args} />, 
  args: {
    variant: 'default',
    size: 'lg',
    mode: 'single',
    captionLayout: 'label',
  },
};

export const MultipleSelection: Story = {
  render: (args) => <DayPickerWithState {...args} />, 
  args: {
    variant: 'default',
    size: 'default',
    mode: 'multiple',
    captionLayout: 'label',
  },
};

export const RangeSelection: Story = {
  render: (args) => <DayPickerWithState {...args} />, 
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
      <DayPickerWithState variant="default" size="sm" mode="single" captionLayout="label" />
      <DayPickerWithState variant="filled" size="default" mode="single" captionLayout="dropdown" />
      <DayPickerWithState variant="minimal" size="lg" mode="single" captionLayout="label" />
    </div>
  ),
}; 