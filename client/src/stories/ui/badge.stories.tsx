import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@components/ui/badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    children: 'Badge',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'lightpink', 'pink'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Badge',
  },
};
export const secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Lightpink: Story = {
  args: {
    variant: 'lightpink',
  },
};

export const Pink: Story = {
  args: {
    variant: 'pink',
  },
};

export const Dot: Story = {
  args: {
    variant: 'dot',
  },
};

export const Examples: Story = {
  render: () => (
    <>
      <div className="my-5 flex gap-1">
        <h3 className="mr-2">기본</h3>
        <Badge>default</Badge>
        <Badge>공지</Badge>
        <Badge>+99</Badge>
        <Badge>1</Badge>
        <Badge>N</Badge>
        <Badge>!</Badge>
        <Badge variant="dot-default" />
      </div>
      <div className="my-5 flex gap-1">
        <h3 className="mr-2">Secondary</h3>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="secondary">공지</Badge>
        <Badge variant="secondary">+99</Badge>
        <Badge variant="secondary">1</Badge>
        <Badge variant="secondary">N</Badge>
        <Badge variant="secondary">!</Badge>
        <Badge variant="dot-secondary" />
      </div>
      <div className="my-5 flex gap-1">
        <h3 className="mr-2">Outline</h3>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="outline">공지</Badge>
        <Badge variant="outline">+99</Badge>
        <Badge variant="outline">1</Badge>
        <Badge variant="outline">N</Badge>
        <Badge variant="outline">!</Badge>
        <Badge variant="dot-default" />
      </div>
      <div className="my-5 flex gap-1">
        <h3 className="mr-2">Lightpink</h3>
        <Badge variant="lightpink">Lightpink</Badge>
        <Badge variant="lightpink">공지</Badge>
        <Badge variant="lightpink">+99</Badge>
        <Badge variant="lightpink">1</Badge>
        <Badge variant="lightpink">N</Badge>
        <Badge variant="lightpink">!</Badge>
        <Badge variant="dot-pink" />
      </div>
      <div className="my-5 flex gap-1">
        <h3 className="mr-2">Pink</h3>
        <Badge variant="pink">Pink</Badge>
        <Badge variant="pink">공지</Badge>
        <Badge variant="pink">+99</Badge>
        <Badge variant="pink">1</Badge>
        <Badge variant="pink">N</Badge>
        <Badge variant="pink">!</Badge>
        <Badge variant="dot-pink" />
      </div>
      <div className="my-5 flex gap-1">
        <h3 className="mr-2">Dot</h3>
        <Badge variant="dot" className="before:bg-[#FF6B6B]">
          연차휴가
        </Badge>
        <Badge variant="dot" className="before:bg-[#6BADFF]">
          반차휴가
        </Badge>
        <Badge variant="dot" className="before:bg-[#FFA46B]">
          반반차휴가
        </Badge>
        <Badge variant="dot" className="before:bg-[#2FC05D]">
          외부일정
        </Badge>
        <Badge variant="dot" className="before:bg-[#5E6BFF]">
          휴일근무
        </Badge>
        <Badge variant="dot" className="before:bg-[#DA6BFF]">
          기타
        </Badge>
      </div>
    </>
  ),
};
