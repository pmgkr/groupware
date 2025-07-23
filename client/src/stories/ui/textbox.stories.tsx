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
      options: ['default', 'filled', 'focus', 'disabled', 'error', 'ghost', 'link'],
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
    placeholder: 'Placeholder text',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    size: 'default',
    placeholder: 'Filled Textbox',
    defaultValue: 'Typed text',
  },
};

export const Focus: Story = {
  args: {
    variant: 'focus',
    size: 'default',
    placeholder: 'focus Textbox',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'disabled',
    size: 'default',
    placeholder: 'disabled Textbox',
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
        <Textbox variant="secondary" size="sm" placeholder="Small Textbox" />
        <Textbox variant="secondary" size="default" placeholder="Default Textbox" />
        <Textbox variant="secondary" size="lg" placeholder="Large Textbox" />
      </div>
      <div className="flex flex-wrap gap-4">
        <Textbox variant="outline" size="sm" placeholder="Chart" icon={<ChartNoAxesColumnIncreasing />} />
        <Textbox variant="ghost" size="icon" placeholder="Left" icon={<ChevronLeft />} />
        <Textbox variant="ghost" size="icon" placeholder="Right" icon={<ChevronRight />} />
        <Textbox variant="transparent" size="lg" placeholder="Large Textbox" />
        <Textbox size="full" placeholder="Full Textbox" />
      </div>
    </>
  ),
};
