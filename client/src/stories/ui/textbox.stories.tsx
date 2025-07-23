// textbox.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textbox } from '@components/ui/textbox';

const meta: Meta<typeof Textbox> = {
  title: 'Components/Textbox',
  component: Textbox,
  tags: ['autodocs'], // 자동 문서화를 위해 추가
  args: {
    children: 'Textbox',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'transparent', 'destructive', 'outline', 'ghost', 'link'],
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
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    size: 'default',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    size: 'default',
  },
};

export const Examples: Story = {
  render: () => (
    <>
      <div className="flex flex-wrap gap-4">
        <Textbox size="sm">Small Textbox</Textbox>
        <Textbox size="default">Default Textbox</Textbox>
        <Textbox size="lg">Large Textbox</Textbox>
      </div>
      <div className="mt-4 mb-4 flex flex-wrap gap-4">
        <Textbox variant="secondary" size="sm">
          Small Textbox
        </Textbox>
        <Textbox variant="secondary" size="default">
          Default Textbox
        </Textbox>
        <Textbox variant="secondary" size="lg">
          Large Textbox
        </Textbox>
      </div>
      <div className="flex flex-wrap gap-4">
        <Textbox variant="outline" size="sm">
          <ChartNoAxesColumnIncreasing /> Chart
        </Textbox>
        <Textbox variant="ghost" size="icon">
          <ChevronLeft />
        </Textbox>
        <Textbox variant="ghost" size="icon">
          <ChevronRight />
        </Textbox>
        <Textbox variant="transparent" size="lg">
          Large Textbox
        </Textbox>
        <Textbox size="full">Full Textbox</Textbox>
      </div>
    </>
  ),
};
