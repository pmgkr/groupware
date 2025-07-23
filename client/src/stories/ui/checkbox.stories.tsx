import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@components/ui/checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    children: '안녕하세요',
  },
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Checkbox />
      </>
    ),
  },
};
