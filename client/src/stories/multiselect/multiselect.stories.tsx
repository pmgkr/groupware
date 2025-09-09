import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { MultiSelect } from '../../components/multiselect/multi-select';

const meta: Meta<typeof MultiSelect> = {
  title: 'Components/Multiselect/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'fill', 'secondary', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'full'],
    },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
    maxCount: {
      control: 'number',
    },
    searchable: {
      control: 'boolean',
    },
    hideSelectAll: {
      control: 'boolean',
    },
    autoSize: {
      control: 'boolean',
    },
    modalPopover: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

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
const MultiSelectWithState = ({ options = sampleOptions, ...props }: any) => {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <MultiSelect
      {...props}
      options={options}
      onValueChange={setSelected}
      defaultValue={selected}
    />
  );
};

export const Default: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: '프레임워크를 선택하세요.',
    variant: 'default',
    size: 'default',
    disabled: false,
    maxCount: 5,
    searchable: true,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: false,
  },
};

export const WithPreselected: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>(['react', 'typescript']);
    return (
      <MultiSelect
        {...args}
        options={sampleOptions}
        onValueChange={setSelected}
        defaultValue={selected}
      />
    );
  },
  args: {
    placeholder: '프레임워크를 선택하세요.',
    variant: 'default',
    size: 'default',
    disabled: false,
    maxCount: 5,
    searchable: true,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: false,
  },
};

export const Disabled: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>(['react', 'vue']);
    return (
      <MultiSelect
        {...args}
        options={sampleOptions}
        onValueChange={setSelected}
        defaultValue={selected}
      />
    );
  },
  args: {
    placeholder: '비활성화된 상태입니다.',
    variant: 'default',
    disabled: true,
    maxCount: 5,
    searchable: true,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: false,
  },
};

export const WithoutSearch: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: '검색기능이 없는 다중 선택창창',
    variant: 'default',
    size: 'default',
    disabled: false,
    maxCount: 5,
    searchable: false,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: false,
  },
};

export const HideSelectAll: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: '전체 선택 버튼 숨김',
    variant: 'default',
    size: 'default',
    disabled: false,
    maxCount: 5,
    searchable: true,
    hideSelectAll: true,
    autoSize: false,
    modalPopover: false,
  },
};

export const AutoSize: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: '자동 크기 조절',
    variant: 'default',
    size: 'default',
    disabled: false,
    maxCount: 5,
    searchable: true,
    hideSelectAll: false,
    autoSize: true,
    modalPopover: false,
  },
};

export const ModalPopover: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: '모달 팝오버',
    variant: 'default',
    size: 'default',
    disabled: false,
    maxCount: 5,
    searchable: true,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: true,
  },
};

export const SmallSize: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: 'Small size...',
    variant: 'default',
    size: 'sm',
    disabled: false,
    maxCount: 3,
    searchable: true,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: false,
  },
};

export const LargeSize: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: 'Large size...',
    variant: 'default',
    size: 'lg',
    disabled: false,
    maxCount: 8,
    searchable: true,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: false,
  },
};

export const FullSize: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: 'Full width size...',
    variant: 'default',
    size: 'full',
    disabled: false,
    maxCount: 5,
    searchable: true,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: false,
  },
};

export const DifferentVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <MultiSelectWithState 
        placeholder="Default variant" 
        variant="default"
        size="default"
      />
      <MultiSelectWithState 
        placeholder="fill variant" 
        variant="fill"
        size="default"
      />
      <MultiSelectWithState 
        placeholder="Secondary variant" 
        variant="secondary"
        size="default"
      />
      <MultiSelectWithState 
        placeholder="Ghost variant" 
        variant="ghost"
        size="default"
      />
    </div>
  ),
};

export const ManyOptions: Story = {
  render: (args) => {
    const manyOptions = Array.from({ length: 50 }, (_, i) => ({
      label: `옵션 ${i + 1}`,
      value: `option-${i + 1}`,
    }));
    return <MultiSelectWithState {...args} options={manyOptions} />;
  },
  args: {
    placeholder: '옵션이 아주 많을 때',
    variant: 'default',
    size: 'default',
    disabled: false,
    maxCount: 10,
    searchable: true,
    hideSelectAll: false,
    autoSize: false,
    modalPopover: false,
  },
};