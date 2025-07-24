import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@components/ui/checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      defaultValue: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: (args) => (
    <div>
      <Checkbox {...args} checked />
      <div className="flex items-center space-x-2">
        <Checkbox {...args} />
        <span>with text</span>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox {...args} />
        <span>기본</span>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox disabled {...args} />
        <span>비활성화 (unchecked)</span>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox checked disabled {...args} />
        <span>체크됨 + 비활성화</span>
      </div>
    </div>
  ),
  args: {
    // 기본 상태로 넘길 args 설정
  },
};
