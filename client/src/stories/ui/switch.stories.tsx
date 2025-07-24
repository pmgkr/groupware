import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '@/components/ui/label';
import { Switch } from '@components/ui/switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    children: (
      <>
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" />
        </div>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    id: 'airplane-mode',
    disabled: true,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch {...args} className="peer" disabled />
      <Label htmlFor={args.id} className="text-base text-gray-400 peer-data-[disabled]:text-gray-400">
        Disabled Switch
      </Label>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" className="peer" />
      <Label
        htmlFor="airplane-mode"
        className="text-base text-gray-500 transition-colors peer-data-[state=checked]:text-[color:var(--color-primary-blue-500)]">
        Lable Text
      </Label>
    </div>
  ),
};
