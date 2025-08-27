import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, AlertTitle, AlertDescription } from '@components/ui/alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: {
    children: '안녕하세요',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>이건 기본 스타일의 알림입니다.</AlertDescription>
      </>
    ),
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <AlertTitle>오류 발생</AlertTitle>
        <AlertDescription>무언가 잘못되었어요. 다시 시도해주세요.</AlertDescription>
      </>
    ),
  },
};
