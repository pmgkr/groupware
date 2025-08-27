import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@components/ui/checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/UI/Checkbox',
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
      <Checkbox id="chb01" {...args} />
    </div>
  ),
};

export const Examples: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="chb02" label="기본" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox checked id="chb05" label="기본" />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox disabled id="chb03" label="비활성화" />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox checked disabled id="chb04" label="체크됨 + 비활성화" />
      </div>
    </div>
  ),
};
