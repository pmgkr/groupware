import type { Meta, StoryObj } from '@storybook/react';
import { DateTimePicker } from '@/components/date-n-time/date-time-picker';

const meta: Meta<typeof DateTimePicker> = {
  title: 'Date & Time/DateTimePicker',
  component: DateTimePicker,
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
      <DateTimePicker {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">날짜 및 시간 선택 (12시간 형식)</label>
      <DateTimePicker {...args} />
    </div>
  ),
};

export const WithDescription: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">날짜 및 시간 선택</label>
      <p className="text-sm text-muted-foreground">
        AM/PM 형식으로 시간을 선택할 수 있습니다.
      </p>
      <DateTimePicker {...args} />
    </div>
  ),
};
