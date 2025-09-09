import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '@components/ui/label';
import { Textbox } from '@components/ui/textbox';
import { Textarea } from '@components/ui/textarea';
import { Checkbox } from '@components/ui/checkbox';

const meta: Meta<typeof Label> = {
  title: 'Components/UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: '추가 CSS 클래스',
    },
    children: {
      control: 'text',
      description: '라벨 텍스트',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '기본 라벨',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">이메일</Label>
      <Textbox
        id="email"
        type="email"
        placeholder="이메일을 입력하세요"
        className="w-full"
      />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="required-field">
        필수 입력 필드 <span className="text-red-500">*</span>
      </Label>
      <Textbox
        id="required-field"
        type="text"
        placeholder="필수 입력"
        required
        className="w-full"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled-field" className="opacity-50">
        비활성화된 필드
      </Label>
      <Textbox
        id="disabled-field"
        type="text"
        placeholder="비활성화됨"
        disabled
        className="w-full"
      />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2 cursor-pointer">
      <Checkbox
        id="terms"
        type="checkbox"
        className="w-4 h-4"
      />
      <Label htmlFor="terms">이용약관에 동의합니다</Label>
    </div>
  ),
};

export const CustomStyling: Story = {
  args: {
    children: '커스텀 스타일 라벨',
    className: 'text-blue-600 font-bold text-lg',
  },
};
