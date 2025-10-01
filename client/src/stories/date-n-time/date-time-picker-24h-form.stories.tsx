import type { Meta, StoryObj } from '@storybook/react';
import { DateTimePicker24hForm } from '@/components/date-n-time/form/date-time-picker-24h-form';

const meta: Meta<typeof DateTimePicker24hForm> = {
  title: 'Date & Time/Forms/DateTimePicker24hForm',
  component: DateTimePicker24hForm,
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
      <DateTimePicker24hForm {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">날짜 및 시간 선택 (24시간 형식)</h3>
        <p className="text-sm text-muted-foreground">
          24시간 형식으로 날짜와 시간을 선택할 수 있는 폼 컴포넌트입니다.
        </p>
      </div>
      <DateTimePicker24hForm {...args} />
    </div>
  ),
};

export const SystemSchedule: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">시스템 일정 설정</h3>
        <p className="text-sm text-muted-foreground">
          시스템 작업의 날짜와 시간을 24시간 형식으로 선택해주세요.
        </p>
      </div>
      <DateTimePicker24hForm {...args} />
    </div>
  ),
};

export const FormValidation: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">폼 검증 예시</h3>
        <p className="text-sm text-muted-foreground">
          날짜와 시간을 선택하지 않고 제출하면 에러 메시지가 표시됩니다.
        </p>
      </div>
      <DateTimePicker24hForm {...args} />
    </div>
  ),
};

export const Comparison: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">시간 형식 비교</h3>
        <p className="text-sm text-muted-foreground">
          12시간 형식과 24시간 형식의 차이를 확인할 수 있습니다.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">12시간 형식</label>
          <DateTimePicker24hForm {...args} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">24시간 형식</label>
          <DateTimePicker24hForm {...args} />
        </div>
      </div>
    </div>
  ),
};
