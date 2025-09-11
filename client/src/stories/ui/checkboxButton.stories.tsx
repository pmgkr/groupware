import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxButton } from '../../components/ui/checkboxButton';
import { Checkbox } from '../../components/ui/checkbox';
import React from 'react';

const meta: Meta<typeof CheckboxButton> = {
  title: 'Components/UI/CheckboxButton',
  component: CheckboxButton,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      defaultValue: 'sm',
      description: 'CheckboxButton 크기를 설정합니다',
    },
    label: {
      control: 'text',
      description: '체크박스 버튼 안에 표시될 라벨 텍스트 (필수)',
    },
    checked: {
      control: 'boolean',
      description: '체크박스 버튼의 체크 상태',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline', 'dynamic', 'dynamicBlue'],
      defaultValue: 'outline',
      description: 'default: 파란색 배경, outline: 회색 테두리, dynamic: 체크 상태에 따라 자동 변경 (연한 파란색), dynamicBlue: 체크 상태에 따라 자동 변경 (진한 파란색)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxButton>;

export const Default: Story = {
  args: {
    label: '기본 버튼',
  },
  render: (args) => (
    <div>
      <CheckboxButton id="chbb01" {...args} />
    </div>
  ),
};

export const Examples: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <CheckboxButton id="chbb02-1" size="sm" label="작은 버튼(sm)" />
      </div>
      <div className="flex items-center space-x-2">
        <CheckboxButton checked id="chbb02-2" size="sm" label="작은 버튼(sm) - 체크됨" />
      </div>
      <div className="flex items-center space-x-2">
        <CheckboxButton id="chbb03" size="md" label="중간 버튼(md)" />
      </div>
      <div className="flex items-center space-x-2">
        <CheckboxButton checked id="chbb03-2" size="md" label="중간 버튼(md) - 체크됨" />
      </div>
      <div className="flex items-center space-x-2">
        <CheckboxButton id="chbb04" size="lg" label="큰 버튼(lg)" />
      </div>
      <div className="flex items-center space-x-2">
        <CheckboxButton checked id="chbb04-2" size="lg" label="큰 버튼(lg) - 체크됨" />
      </div>
      <div className="flex items-center space-x-2">
        <CheckboxButton disabled id="chbb05" label="비활성화" />
      </div>
      <div className="flex items-center space-x-2">
        <CheckboxButton checked disabled id="chbb06" label="체크됨 + 비활성화" />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">체크박스 버튼 그룹 예시 <span className="text-sm text-gray-500">※ 라디오 버튼과의 차이: 체크박스는 다중 선택이 가능함</span></h3>
        <div className="flex align-center gap-2 space-y-2">
          <CheckboxButton id="comp1" label="옵션1" />
          <CheckboxButton id="comp2" label="옵션2" />
          <CheckboxButton id="comp5" label="옵션3" />
        </div>
      </div>
    </div>
  ),
};

export const Comparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">기본 체크박스</h3>
        <div className="space-y-2">
          <Checkbox id="comp1" label="기본 체크박스" />
          <Checkbox checked id="comp2" label="기본 체크박스 (체크됨)" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">체크박스 버튼</h3>
        <div className="flex align-center gap-2 space-y-2">
          <CheckboxButton id="comp3" label="체크박스 버튼" />
          <CheckboxButton checked id="comp4" label="체크박스 버튼 (체크됨)" />
        </div>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <CheckboxButton id="size1" size="sm" label="Small" />
        <CheckboxButton checked id="size1-checked" size="sm" label="Small (Checked)" />
      </div>
      <div className="flex items-center space-x-4">
        <CheckboxButton id="size2" size="md" label="Medium" />
        <CheckboxButton checked id="size2-checked" size="md" label="Medium (Checked)" />
      </div>
      <div className="flex items-center space-x-4">
        <CheckboxButton id="size3" size="lg" label="Large" />
        <CheckboxButton checked id="size3-checked" size="lg" label="Large (Checked)" />
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Variant</h3>
        <div className="flex items-center space-x-4">
          <CheckboxButton id="default1" variant="default" label="Default Unchecked" />
          <CheckboxButton id="default2" variant="default" checked label="Default Checked" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Outline Variant</h3>
        <div className="flex items-center space-x-4">
          <CheckboxButton id="outline1" variant="outline" label="Outline Unchecked" />
          <CheckboxButton id="outline2" variant="outline" checked label="Outline Checked" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Dynamic Variant (체크 상태에 따라 자동 변경, 연한 파란색)</h3>
        <div className="flex items-center space-x-4">
          <CheckboxButton id="dynamic1" variant="dynamic" label="Dynamic Unchecked" />
          <CheckboxButton id="dynamic2" variant="dynamic" checked label="Dynamic Checked" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">DynamicBlue Variant (체크 상태에 따라 자동 변경, 진한 파란색)</h3>
        <div className="flex items-center space-x-4">
          <CheckboxButton id="dynamicBlue1" variant="dynamicBlue" label="DynamicBlue Unchecked" />
          <CheckboxButton id="dynamicBlue2" variant="dynamicBlue" checked label="DynamicBlue Checked" />
        </div>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <CheckboxButton id="disabled1" variant="default" disabled label="Default Disabled" />
        <CheckboxButton id="disabled2" variant="default" disabled checked label="Default Disabled Checked" />
      </div>
      <div className="flex items-center space-x-4">
        <CheckboxButton id="disabled3" variant="outline" disabled label="Outline Disabled" />
        <CheckboxButton id="disabled4" variant="outline" disabled checked label="Outline Disabled Checked" />
      </div>
      <div className="flex items-center space-x-4">
        <CheckboxButton id="disabled5" variant="dynamic" disabled label="Dynamic Disabled" />
        <CheckboxButton id="disabled6" variant="dynamic" disabled checked label="Dynamic Disabled Checked" />
      </div>
    </div>
  ),
};
