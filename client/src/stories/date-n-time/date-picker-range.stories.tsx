import type { Meta, StoryObj } from '@storybook/react';
import { DatePickerWithRange } from '@/components/date-n-time/date-picker-range';

const meta: Meta<typeof DatePickerWithRange> = {
  title: 'Date & Time/DatePickerRange',
  component: DatePickerWithRange,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: '추가 CSS 클래스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithContainer: Story = {
  args: {},
  render: (args) => (
    <div className="w-80">
      <DatePickerWithRange {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">날짜 범위 선택</label>
      <DatePickerWithRange {...args} />
    </div>
  ),
};

export const CustomClassName: Story = {
  args: {
    className: 'w-96',
  },
  render: (args) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">넓은 날짜 범위 선택</label>
      <DatePickerWithRange {...args} />
    </div>
  ),
};
