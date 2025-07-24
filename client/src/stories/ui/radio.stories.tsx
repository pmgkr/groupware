import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  args: {
    children: 'Radio',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      defaultValue: 'md',
    },
  },
};

export default meta;
type Story = StoryObj<{ size: 'sm' | 'md' | 'lg' }>;

export const Default: Story = {
  args: {
    size: 'md',
  },
  render: ({ size }) => (
    <RadioGroup defaultValue="option-ex">
      <div className="flex items-center space-x-2">
        <RadioGroupItem id="option-ex" value="option-ex" size={size} />
        <Label htmlFor="option-ex">Option ex</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem id="option-ex2" value="option-ex2" size={size} />
        <Label htmlFor="option-ex2">Option ex2</Label>
      </div>
    </RadioGroup>
  ),
};

export const Examples: Story = {
  render: () => (
    <>
      <RadioGroup defaultValue="option-one" className="mb-10">
        <div className="flex items-center space-x-2">
          <RadioGroupItem id="option-one" value="option-one" size="sm" />
          <Label htmlFor="option-one">Option sm</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem id="option-two" value="option-two" size="sm" />
          <Label htmlFor="option-two">Option sm</Label>
        </div>
      </RadioGroup>
      <RadioGroup defaultValue="option-three" className="mb-10">
        <div className="flex items-center space-x-2">
          <RadioGroupItem id="option-three" value="option-three" size="md" />
          <Label htmlFor="option-three">Option md</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem id="option-four" value="option-four" size="md" />
          <Label htmlFor="option-four">Option md</Label>
        </div>
      </RadioGroup>
      <RadioGroup defaultValue="option-five" className="mb-10">
        <div className="flex items-center space-x-2">
          <RadioGroupItem id="option-five" value="option-five" size="lg" />
          <Label htmlFor="option-five">Option lg</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem id="option-six" value="option-six" size="lg" />
          <Label htmlFor="option-six">Option lg</Label>
        </div>
      </RadioGroup>
    </>
  ),
};
