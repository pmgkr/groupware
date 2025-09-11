import type { Meta, StoryObj } from '@storybook/react';
import { DatePickerDemo } from '@/components/date-n-time/date-picker';

const meta: Meta<typeof DatePickerDemo> = {
  title: 'Date & Time/DatePicker',
  component: DatePickerDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
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
      <DatePickerDemo {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">날짜 선택</label>
      <DatePickerDemo {...args} />
    </div>
  ),
};
