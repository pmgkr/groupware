import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@components/ui/select';

const meta: Meta<typeof Select> = {
  title: 'Components/UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    size: 'default',
  },
  render: ({ size }) => (
    <Select>
      <SelectTrigger size={size} className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem size={size} value="apple">
            Apple
          </SelectItem>
          <SelectItem size={size} value="banana">
            Banana
          </SelectItem>
          <SelectItem size={size} value="blueberry">
            Blueberry
          </SelectItem>
          <SelectItem size={size} value="grapes">
            Grapes
          </SelectItem>
          <SelectItem size={size} value="pineapple">
            Pineapple
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Scrollable: Story = {
  args: {
    size: 'default',
  },
  render: ({ size }) => (
    <Select>
      <SelectTrigger size={size} className="w-[280px]">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem size={size} value="est">
            Eastern Standard Time (EST)
          </SelectItem>
          <SelectItem size={size} value="cst">
            Central Standard Time (CST)
          </SelectItem>
          <SelectItem size={size} value="mst">
            Mountain Standard Time (MST)
          </SelectItem>
          <SelectItem size={size} value="pst">
            Pacific Standard Time (PST)
          </SelectItem>
          <SelectItem size={size} value="akst">
            Alaska Standard Time (AKST)
          </SelectItem>
          <SelectItem size={size} value="hst">
            Hawaii Standard Time (HST)
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Europe & Africa</SelectLabel>
          <SelectItem size={size} value="gmt">
            Greenwich Mean Time (GMT)
          </SelectItem>
          <SelectItem size={size} value="cet">
            Central European Time (CET)
          </SelectItem>
          <SelectItem size={size} value="eet">
            Eastern European Time (EET)
          </SelectItem>
          <SelectItem size={size} value="west">
            Western European Summer Time (WEST)
          </SelectItem>
          <SelectItem size={size} value="cat">
            Central Africa Time (CAT)
          </SelectItem>
          <SelectItem size={size} value="eat">
            East Africa Time (EAT)
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem size={size} value="msk">
            Moscow Time (MSK)
          </SelectItem>
          <SelectItem size={size} value="ist">
            India Standard Time (IST)
          </SelectItem>
          <SelectItem size={size} value="cst_china">
            China Standard Time (CST)
          </SelectItem>
          <SelectItem size={size} value="jst">
            Japan Standard Time (JST)
          </SelectItem>
          <SelectItem size={size} value="kst">
            Korea Standard Time (KST)
          </SelectItem>
          <SelectItem size={size} value="ist_indonesia">
            Indonesia Central Standard Time (WITA)
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Australia & Pacific</SelectLabel>
          <SelectItem size={size} value="awst">
            Australian Western Standard Time (AWST)
          </SelectItem>
          <SelectItem size={size} value="acst">
            Australian Central Standard Time (ACST)
          </SelectItem>
          <SelectItem size={size} value="aest">
            Australian Eastern Standard Time (AEST)
          </SelectItem>
          <SelectItem size={size} value="nzst">
            New Zealand Standard Time (NZST)
          </SelectItem>
          <SelectItem size={size} value="fjt">
            Fiji Time (FJT)
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>South America</SelectLabel>
          <SelectItem size={size} value="art">
            Argentina Time (ART)
          </SelectItem>
          <SelectItem size={size} value="bot">
            Bolivia Time (BOT)
          </SelectItem>
          <SelectItem size={size} value="brt">
            Brasilia Time (BRT)
          </SelectItem>
          <SelectItem size={size} value="clt">
            Chile Standard Time (CLT)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
