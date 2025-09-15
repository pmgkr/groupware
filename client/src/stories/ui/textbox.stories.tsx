// textbox.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textbox } from '@components/ui/textbox';

const meta: Meta<typeof Textbox> = {
  title: 'Components/UI/Input',
  component: Textbox,
  tags: ['autodocs'], // 자동 문서화를 위해 추가
  args: {
    placeholder: 'Textbox',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'focus', 'disabled', 'error'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'full', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textbox>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default',
    placeholder: 'Placeholder',
    description: '내용을 입력해주세요.',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    size: 'default',
    placeholder: 'Placeholder',
    defaultValue: 'Typed text',
    description: '',
  },
};

export const Focus: Story = {
  args: {
    variant: 'focus',
    size: 'default',
    placeholder: 'Placeholder',
    description: '',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'disabled',
    size: 'default',
    placeholder: 'Placeholder',
    description: '',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    size: 'default',
    placeholder: 'Placeholder',
    defaultValue: 'Error Message',
    readOnly: true,
    errorMessage: '내용을 올바르게 입력해주세요.',
  },
};

export const DateInput: Story = {
  args: {
    type: 'date',
    placeholder: '날짜를 선택하세요',
    description: '날짜를 선택해주세요.',
    className: 'w-full justify-start',
  },
};

export const EmailInput: Story = {
  args: {
    type: 'email',
    placeholder: '이메일을 입력하세요',
    description: '유효한 이메일 주소를 입력해주세요.',
    className: 'w-full',
  },
};

export const NumberInput: Story = {
  args: {
    type: 'number',
    placeholder: '숫자를 입력하세요',
    description: '숫자만 입력 가능합니다.',
    className: 'w-full',
  },
};

export const PasswordInput: Story = {
  args: {
    type: 'password',
    placeholder: '비밀번호를 입력하세요',
    description: '8자 이상 입력해주세요.',
    className: 'w-full',
  },
};

export const TelInput: Story = {
  args: {
    type: 'tel',
    placeholder: '전화번호를 입력하세요',
    description: '예: 010-1234-5678',
    className: 'w-full',
  },
};

export const TimeInput: Story = {
  args: {
    type: 'time',
    placeholder: '시간을 선택하세요',
    description: '시간을 선택해주세요.',
    className: 'w-full justify-start',
  },
};

export const ColorInput: Story = {
  args: {
    type: 'color',
    className: 'w-20 h-10',
  },
};

export const UrlInput: Story = {
  args: {
    type: 'url',
    placeholder: 'https://example.com',
    description: '유효한 URL을 입력해주세요.',
    className: 'w-full',
  },
};

export const SearchInput: Story = {
  args: {
    type: 'search',
    placeholder: '검색어를 입력하세요',
    description: '검색할 내용을 입력해주세요.',
    className: 'w-full',
  },
};

export const MonthInput: Story = {
  args: {
    type: 'month',
    placeholder: '월을 선택하세요',
    description: '월을 선택해주세요.',
    className: 'w-full justify-start',
  },
};

export const WeekInput: Story = {
  args: {
    type: 'week',
    placeholder: '주를 선택하세요',
    description: '주를 선택해주세요.',
    className: 'w-full justify-start',
  },
};

export const DateTimeLocalInput: Story = {
  args: {
    type: 'datetime-local',
    placeholder: '날짜와 시간을 선택하세요',
    description: '날짜와 시간을 선택해주세요.',
    className: 'w-full justify-start',
  },
};

export const RangeInput: Story = {
  args: {
    type: 'range',
    min: 0,
    max: 100,
    defaultValue: 50,
    className: 'w-full',
  },
};

export const FileInput: Story = {
  args: {
    type: 'file',
    accept: 'image/*',
    className: 'w-full',
  },
};

export const Examples: Story = {
  render: () => (
    <>
      <div className="flex flex-wrap gap-4">
        <Textbox size="sm" placeholder="Small Textbox" />
        <Textbox size="default" placeholder="Default Textbox" />
        <Textbox size="lg" placeholder="Large Textbox" />
      </div>
      <div className="mt-4 mb-4 flex flex-wrap gap-4">
        <Textbox variant="filled" size="sm" placeholder="Small Textbox" />
        <Textbox variant="filled" size="default" placeholder="Default Textbox" />
        <Textbox variant="filled" size="lg" placeholder="Large Textbox" />
      </div>
      <div className="flex flex-col flex-wrap gap-4">
        <Textbox size="full" placeholder="Full Textbox" />
        <Textbox type="date" placeholder="날짜 선택" className="w-full justify-start" />
      </div>
    </>
  ),
};
