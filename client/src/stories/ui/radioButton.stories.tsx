import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioButton, RadioGroup } from '../../components/ui/radioButton';
import React from 'react';

const meta: Meta<typeof RadioButton> = {
  title: 'Components/UI/RadioButton',
  component: RadioButton,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      defaultValue: 'sm',
      description: 'RadioButton 크기를 설정합니다',
    },
    label: {
      control: 'text',
      description: '라디오 버튼 안에 표시될 라벨 텍스트 (필수)',
    },
    value: {
      control: 'text',
      description: '라디오 버튼의 값',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline', 'dynamic'],
      defaultValue: 'outline',
      description: 'default: 파란색 배경, outline: 회색 테두리, dynamic: 체크 상태에 따라 자동 변경',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioButton>;

export const Default: Story = {
  args: {
    label: '기본 라디오 버튼',
    value: 'option1',
  },
  render: (args) => (
    <RadioGroup>
      <RadioButton id="radio1" {...args} />
    </RadioGroup>
  ),
};

export const Examples: Story = {
  render: () => (
    <RadioGroup>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <RadioButton id="radio1" size="sm" label="작은 라디오(sm)" value="small" />
        </div>
        <div className="flex items-center space-x-2">
          <RadioButton id="radio2" size="md" label="중간 라디오(md)" value="medium" />
        </div>
        <div className="flex items-center space-x-2">
          <RadioButton id="radio3" size="lg" label="큰 라디오(lg)" value="large" />
        </div>
        <div className="flex items-center space-x-2">
          <RadioButton id="radio4" disabled label="비활성화" value="disabled" />
        </div>
      </div>
    </RadioGroup>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Variant</h3>
        <RadioGroup>
          <div className="flex items-center space-x-4">
            <RadioButton id="default1" variant="default" label="Default Option 1" value="default1" />
            <RadioButton id="default2" variant="default" label="Default Option 2" value="default2" />
          </div>
        </RadioGroup>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Outline Variant</h3>
        <RadioGroup>
          <div className="flex items-center space-x-4">
            <RadioButton id="outline1" variant="outline" label="Outline Option 1" value="outline1" />
            <RadioButton id="outline2" variant="outline" label="Outline Option 2" value="outline2" />
          </div>
        </RadioGroup>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Dynamic Variant (체크 상태에 따라 자동 변경)</h3>
        <RadioGroup>
          <div className="flex items-center space-x-4">
            <RadioButton id="dynamic1" variant="dynamic" label="Dynamic Option 1" value="dynamic1" />
            <RadioButton id="dynamic2" variant="dynamic" label="Dynamic Option 2" value="dynamic2" />
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};

export const RadioGroupExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">라디오 그룹 예시</h3>
        <RadioGroup defaultValue="option2">
          <div className="space-y-2">
            <RadioButton id="group1" label="옵션 1" value="option1" />
            <RadioButton id="group2" label="옵션 2" value="option2" />
            <RadioButton id="group3" label="옵션 3" value="option3" />
          </div>
        </RadioGroup>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Dynamic Variant 그룹</h3>
        <RadioGroup defaultValue="dynamic2">
          <div className="space-y-2">
            <RadioButton id="dgroup1" variant="dynamic" label="동적 옵션 1" value="dynamic1" />
            <RadioButton id="dgroup2" variant="dynamic" label="동적 옵션 2" value="dynamic2" />
            <RadioButton id="dgroup3" variant="dynamic" label="동적 옵션 3" value="dynamic3" />
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <RadioButton id="disabled1" variant="default" disabled label="Default Disabled" value="disabled1" />
          <RadioButton id="disabled2" variant="default" disabled checked label="Default Disabled Checked" value="disabled2" />
        </div>
        <div className="flex items-center space-x-4">
          <RadioButton id="disabled3" variant="outline" disabled label="Outline Disabled" value="disabled3" />
          <RadioButton id="disabled4" variant="outline" disabled checked label="Outline Disabled Checked" value="disabled4" />
        </div>
        <div className="flex items-center space-x-4">
          <RadioButton id="disabled5" variant="dynamic" disabled label="Dynamic Disabled" value="disabled5" />
          <RadioButton id="disabled6" variant="dynamic" disabled checked label="Dynamic Disabled Checked" value="disabled6" />
        </div>
      </div>
    </RadioGroup>
  ),
};
