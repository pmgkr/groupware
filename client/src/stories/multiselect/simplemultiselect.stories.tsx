import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { SimpleMultiSelect } from '../../components/multiselect/SimpleMultiSelect';

const meta: Meta<typeof SimpleMultiSelect> = {
  title: 'Components/Multiselect/SimpleMultiSelect',
  component: SimpleMultiSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SimpleMultiSelect>;

// 샘플 옵션 데이터
const sampleOptions = [
  { label: '한글테스트', value: '한글테스트' },
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Next.js', value: 'nextjs' },
  { label: 'Nuxt.js', value: 'nuxtjs' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C#', value: 'csharp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Swift', value: 'swift' },
  { label: 'Kotlin', value: 'kotlin' },
];

// 상태를 관리하는 래퍼 컴포넌트
const SimpleMultiSelectWithState = ({ options = sampleOptions, ...props }: any) => {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <SimpleMultiSelect
      {...props}
      options={options}
      selected={selected}
      onChange={setSelected}
    />
  );
};

export const Default: Story = {
  render: (args) => <SimpleMultiSelectWithState {...args} />,
  args: {
    placeholder: '프레임워크를 선택하세요...',
    disabled: false,
  },
};

export const WithPreselected: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>(['react', 'typescript', 'nextjs']);
    return (
      <SimpleMultiSelect
        {...args}
        options={sampleOptions}
        selected={selected}
        onChange={setSelected}
      />
    );
  },
  args: {
    placeholder: '선택하세요...',
    disabled: false,
  },
};

export const Disabled: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>(['react', 'vue']);
    return (
      <SimpleMultiSelect
        {...args}
        options={sampleOptions}
        selected={selected}
        onChange={setSelected}
      />
    );
  },
  args: {
    placeholder: '비활성화된 상태입니다...',
    disabled: true,
  },
};

export const Empty: Story = {
  render: (args) => <SimpleMultiSelectWithState {...args} />,
  args: {
    placeholder: '옵션을 선택하세요...',
    disabled: false,
  },
};

export const ManyOptions: Story = {
  render: (args) => {
    const manyOptions = Array.from({ length: 50 }, (_, i) => ({
      label: `옵션 ${i + 1}`,
      value: `option-${i + 1}`,
    }));
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <SimpleMultiSelect
        {...args}
        options={manyOptions}
        selected={selected}
        onChange={setSelected}
      />
    );
  },
  args: {
    placeholder: '옵션이 아주 많을 때...',
    disabled: false,
  },
};

export const FewOptions: Story = {
  render: (args) => {
    const fewOptions = [
      { label: '사과', value: 'apple' },
      { label: '바나나', value: 'banana' },
      { label: '오렌지', value: 'orange' },
    ];
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <SimpleMultiSelect
        {...args}
        options={fewOptions}
        selected={selected}
        onChange={setSelected}
      />
    );
  },
  args: {
    placeholder: '과일을 선택하세요...',
    disabled: false,
  },
};

export const CustomWidth: Story = {
  render: (args) => <SimpleMultiSelectWithState {...args} />,
  args: {
    placeholder: '커스텀 너비...',
    disabled: false,
    className: 'w-96',
  },
};

export const SmallWidth: Story = {
  render: (args) => <SimpleMultiSelectWithState {...args} />,
  args: {
    placeholder: '작은 너비...',
    disabled: false,
    className: 'w-48',
  },
};

export const MultipleInstances: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold">프레임워크</h3>
        <SimpleMultiSelectWithState 
          placeholder="프레임워크를 선택하세요..." 
          options={[
            { label: 'React', value: 'react' },
            { label: 'Vue', value: 'vue' },
            { label: 'Angular', value: 'angular' },
            { label: 'Svelte', value: 'svelte' },
          ]}
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">언어</h3>
        <SimpleMultiSelectWithState 
          placeholder="언어를 선택하세요..." 
          options={[
            { label: 'TypeScript', value: 'typescript' },
            { label: 'JavaScript', value: 'javascript' },
            { label: 'Python', value: 'python' },
            { label: 'Java', value: 'java' },
          ]}
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">도구</h3>
        <SimpleMultiSelectWithState 
          placeholder="도구를 선택하세요..." 
          options={[
            { label: 'VSCode', value: 'vscode' },
            { label: 'WebStorm', value: 'webstorm' },
            { label: 'Sublime', value: 'sublime' },
          ]}
        />
      </div>
    </div>
  ),
};

export const LongLabels: Story = {
  render: (args) => {
    const longLabelOptions = [
      { label: '이것은 매우 긴 라벨을 가진 첫 번째 옵션입니다', value: 'option1' },
      { label: '두 번째 옵션도 상당히 긴 라벨을 가지고 있습니다', value: 'option2' },
      { label: '세 번째 옵션의 라벨도 꽤 길게 작성되었습니다', value: 'option3' },
      { label: '짧은 옵션', value: 'option4' },
    ];
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <SimpleMultiSelect
        {...args}
        options={longLabelOptions}
        selected={selected}
        onChange={setSelected}
      />
    );
  },
  args: {
    placeholder: '긴 라벨 테스트...',
    disabled: false,
  },
};

