import type { Meta, StoryObj } from '@storybook/react';
import { DatePickerForm } from '@/components/date-n-time/form/date-picker-form';

const meta: Meta<typeof DatePickerForm> = {
  title: 'Date & Time/Forms/DatePickerForm',
  component: DatePickerForm,
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
      <DatePickerForm {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {},
  render: (args) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">생년월일 입력</h3>
        <p className="text-sm text-muted-foreground">
          폼 검증이 포함된 날짜 선택 컴포넌트입니다.
        </p>
      </div>
      <DatePickerForm {...args} />
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
          날짜를 선택하지 않고 제출하면 에러 메시지가 표시됩니다.
        </p>
      </div>
      <DatePickerForm {...args} />
    </div>
  ),
};
