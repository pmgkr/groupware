// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'], // 자동 문서화를 위해 추가
  args: {
    children: '버튼',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
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

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"></Button>
    </div>
  ),
};
