import type { Meta, StoryObj } from '@storybook/react';
import { DateTimePickerForm } from '@/components/date-n-time/form/date-time-picker-form';

const meta: Meta<typeof DateTimePickerForm> = {
  title: 'Date & Time/Forms/DateTimePickerForm',
  component: DateTimePickerForm,
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
      <DateTimePickerForm {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">날짜 및 시간 선택 (12시간 형식)</h3>
        <p className="text-sm text-muted-foreground">
          AM/PM 형식으로 날짜와 시간을 선택할 수 있는 폼 컴포넌트입니다.
        </p>
      </div>
      <DateTimePickerForm {...args} />
    </div>
  ),
};

export const MeetingSchedule: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">회의 일정 설정</h3>
        <p className="text-sm text-muted-foreground">
          회의의 날짜와 시간을 선택해주세요.
        </p>
      </div>
      <DateTimePickerForm {...args} />
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
      <DateTimePickerForm {...args} />
    </div>
  ),
};
