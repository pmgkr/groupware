// textbox.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textbox } from '@components/ui/textbox';

const meta: Meta<typeof Textbox> = {
  title: 'Components/UI/Textbox',
  component: Textbox,
  tags: ['autodocs'], // 자동 문서화를 위해 추가
  args: {
    placeholder: 'Textbox',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'focus', 'disabled', 'error'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'full', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textbox>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default',
    placeholder: 'Placeholder',
    description: '내용을 입력해주세요.'
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    size: 'default',
    placeholder: 'Placeholder',
    defaultValue: 'Typed text',
    description: ''
  },
};

export const Focus: Story = {
  args: {
    variant: 'focus',
    size: 'default',
    placeholder: 'Placeholder',
    description: ''    
  },
};

export const Disabled: Story = {
  args: {
    variant: 'disabled',
    size: 'default',
    placeholder: 'Placeholder',
    description: ''
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    size: 'default',
    placeholder: 'Placeholder',
    defaultValue: 'Error Message',
    readOnly: true,
    errorMessage: '내용을 올바르게 입력해주세요.'
  },
};


export const Examples: Story = {
  render: () => (
    <>
      <div className="flex flex-wrap gap-4">
        <Textbox size="sm" placeholder="Small Textbox" />
        <Textbox size="default" placeholder="Default Textbox" />
        <Textbox size="lg" placeholder="Large Textbox" />
      </div>
      <div className="mt-4 mb-4 flex flex-wrap gap-4">
        <Textbox variant="filled" size="sm" placeholder="Small Textbox" />
        <Textbox variant="filled" size="default" placeholder="Default Textbox" />
        <Textbox variant="filled" size="lg" placeholder="Large Textbox" />
      </div>
      <div className="flex flex-col flex-wrap gap-4">
        <Textbox size="full" placeholder="Full Textbox" />
      </div>
    </>
  ),
};
