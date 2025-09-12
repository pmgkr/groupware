import type { Meta, StoryObj } from '@storybook/react';
import { DateTimePicker24h } from '@/components/date-n-time/date-time-picker-24h';

const meta: Meta<typeof DateTimePicker24h> = {
  title: 'Date & Time/DateTimePicker24h',
  component: DateTimePicker24h,
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
      <DateTimePicker24h {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">날짜 및 시간 선택 (24시간 형식)</label>
      <DateTimePicker24h {...args} />
    </div>
  ),
};

export const WithDescription: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">날짜 및 시간 선택</label>
      <p className="text-sm text-muted-foreground">
        24시간 형식으로 시간을 선택할 수 있습니다.
      </p>
      <DateTimePicker24h {...args} />
    </div>
  ),
};

export const Comparison: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">12시간 형식</label>
        <div className="w-80">
          <DateTimePicker24h {...args} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">24시간 형식</label>
        <div className="w-80">
          <DateTimePicker24h {...args} />
        </div>
      </div>
    </div>
  ),
};
