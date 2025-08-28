// src/stories/ui/SectionHeader.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions'; // ✅ SB9 경로
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Edit, Add } from '@/assets/images/icons';

const meta: Meta<typeof SectionHeader> = {
  title: 'Components/UI/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    title: { control: 'text' },
    buttonText: { control: 'text' },
    className: { control: 'text' },
    buttonVariant: { control: 'text' },
    buttonSize: { control: 'text' },
    onButtonClick: { table: { category: 'events' } },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '프로필 수정',
    buttonText: '수정',
    buttonVariant: 'outlinePrimary',
    buttonSize: 'sm',
    onButtonClick: action('button clicked'), // ✅ 타입 OK
  },
  render: (args) => (
    <div className="w-[900px]">
      <SectionHeader {...args} buttonIcon={<Edit className="size-4" />} />
    </div>
  ),
};

export const NoButton: Story = {
  args: { title: '공지사항' }, // buttonText 없음 → 버튼 비표시
  render: (args) => (
    <div className="w-[900px]">
      <SectionHeader {...args} />
    </div>
  ),
};

export const CustomStyle: Story = {
  args: {
    title: '계좌 관리',
    buttonText: '계좌 추가하기',
    className: 'bg-gray-50',
    buttonVariant: 'outlinePrimary',
    buttonSize: 'sm',
    onButtonClick: action('button clicked'),
  },
  render: (args) => (
    <div className="w-[900px]">
      <SectionHeader {...args} buttonIcon={<Add className="size-4" />} />
    </div>
  ),
};
