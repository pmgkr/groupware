// boardList.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import BoardList from '@/components/board/BoardList';
import BoardDetail from '@/components/board/BoardDetail';
import { MemoryRouter } from 'react-router';
import BoardWrite from '@/components/board/BoardWrite';

const meta: Meta<typeof BoardList> = {
  title: 'Board/BoardList',
  component: BoardList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '게시판 리스트, 상세, 글쓰기 페이지 UI',
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
export const List: StoryObj = {
  render: () => <BoardList />,
};

export const Detail: StoryObj = {
  render: () => <BoardDetail id="999" />,
};

export const Write: StoryObj = {
  render: () => <BoardWrite />,
};
