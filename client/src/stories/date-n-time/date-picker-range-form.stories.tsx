import type { Meta, StoryObj } from '@storybook/react';
import { DatePickerWithRangeForm } from '@/components/date-n-time/form/date-picker-range-form';

const meta: Meta<typeof DatePickerWithRangeForm> = {
  title: 'Date & Time/Forms/DatePickerRangeForm',
  component: DatePickerWithRangeForm,
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
      <DatePickerWithRangeForm {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">날짜 범위 선택</h3>
        <p className="text-sm text-muted-foreground">
          시작일과 종료일을 선택할 수 있는 폼 컴포넌트입니다.
        </p>
      </div>
      <DatePickerWithRangeForm {...args} />
    </div>
  ),
};

export const EventPlanning: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">이벤트 기간 설정</h3>
        <p className="text-sm text-muted-foreground">
          이벤트의 시작일과 종료일을 선택해주세요.
        </p>
      </div>
      <DatePickerWithRangeForm {...args} />
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
          날짜 범위를 선택하지 않고 제출하면 에러 메시지가 표시됩니다.
        </p>
      </div>
      <DatePickerWithRangeForm {...args} />
    </div>
  ),
};
