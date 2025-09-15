import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/UI/Radio',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'disabled'],
    },
  },
  parameters: {
    docs: {
      description: {
        component: '일반적인 도트형 라디오 버튼',
      },
    },
  },
};

export default meta;

type Story = StoryObj<{
  args: {
    size: 'sm' | 'default' | 'lg';
    variant: 'default' | 'disabled';
  };
}>;

export const Customizable: Story = {
  args: {
    size: 'default',
    variant: 'default',
  },
  render: (args) => (
    <RadioGroup defaultValue="option-one">
      <RadioGroupItem id="option-one" value="option-one" size={args.size} variant={args.variant} label="Option One" />
      <RadioGroupItem id="option-two" value="option-two" size={args.size} variant={args.variant} label="Option Two" />
    </RadioGroup>
  ),
};

export const Examples: Story = {
  render: () => (
    <>
      <div className="mb-5">
        <h3 className="mb-3 text-lg font-semibold">Radio Button</h3>
        <RadioGroup defaultValue="option-0">
          <RadioGroupItem id="option-0" value="option-0" size="default" />
          <RadioGroupItem id="option-01" value="option-01" size="default" />
        </RadioGroup>
      </div>
      <div className="mb-5">
        <h3 className="mb-3 text-lg font-semibold">Default (Radio Button with Lable)</h3>
        <RadioGroup defaultValue="option-3">
          <RadioGroupItem id="option-3" value="option-3" size="default" label="Default (Selected)" />
          <RadioGroupItem id="option-4" value="option-4" size="default" label="Default" />
        </RadioGroup>
      </div>

      <div className="mb-5">
        <h3 className="mb-3 text-lg font-semibold">Disabled</h3>
        <RadioGroup disabled defaultValue="option-5">
          <RadioGroupItem id="option-5" value="option-5" size="default" variant="disabled" label="Disabled (Selected)" />
          <RadioGroupItem id="option-6" value="option-6" size="default" variant="disabled" label="Disabled" />
        </RadioGroup>
      </div>
    </>
  ),
};
