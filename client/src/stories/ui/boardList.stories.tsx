// boardList.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import BoardList from '@/components/board/BoardList';
import BoardDetail from '@/components/board/BoardDetail';

const meta: Meta<typeof BoardList> = {
  title: 'Components/BoardList',
  component: BoardList,
  tags: ['autodocs'],
};

export default meta;
export const List: StoryObj = {
  render: () => <BoardList />,
};

export const Detail: StoryObj = {
  render: () => <BoardDetail />,
};
