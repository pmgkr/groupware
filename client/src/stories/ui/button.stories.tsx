// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'], // 자동 문서화를 위해 추가
  args: {
    children: 'Button',
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
type Story = StoryObj<typeof Button>;

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
        <Button size="sm">Small Button</Button>
        <Button size="default">Default Button</Button>
        <Button size="lg">Large Button</Button>
      </div>
      <div className="mt-4 mb-4 flex flex-wrap gap-4">
        <Button variant="secondary" size="sm">
          Small Button
        </Button>
        <Button variant="secondary" size="default">
          Default Button
        </Button>
        <Button variant="secondary" size="lg">
          Large Button
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button variant="outline" size="sm">
          <ChartNoAxesColumnIncreasing /> Chart
        </Button>
        <Button variant="ghost" size="icon">
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="icon">
          <ChevronRight />
        </Button>
        <Button variant="transparent" size="lg">
          Large Button
        </Button>
        <Button size="full">Full Button</Button>
      </div>
    </>
  ),
};
