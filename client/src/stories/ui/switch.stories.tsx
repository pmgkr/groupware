import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@/components/ui/switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      description: '스위치의 상태를 설정합니다.',
      control: 'select',
      options: ['default'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

// 기본 스위치 (라벨 없음)
export const Default: Story = {
  args: {
    id: 'default-switch',
    variant: 'default',
  },
  render: (args) => <Switch {...args} />,
};

// 라벨 있는 스위치
export const WithLabel: Story = {
  args: {
    id: 'labeled-switch',
    variant: 'default',
    label: 'Enable notifications',
  },
  render: (args) => <Switch {...args} />,
};

// 비활성화된 스위치
export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Disabled - No Label</h3>
        <Switch id="disabled-no-label" disabled />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Disabled - With Label</h3>
        <Switch id="disabled-with-label" disabled label="Disabled switch" />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Disabled - Checked State</h3>
        <Switch id="disabled-checked" disabled defaultChecked label="Disabled checked" />
      </div>
    </div>
  ),
};

// 모든 상태 조합
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">라벨 없음</h3>

        <div>
          <p className="mb-2 text-sm text-gray-600">기본 상태</p>
          <Switch />
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-600">체크된 상태</p>
          <Switch defaultChecked />
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-600">비활성화</p>
          <Switch disabled />
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-600">비활성화 + 체크</p>
          <Switch disabled defaultChecked />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">라벨 있음</h3>

        <div>
          <p className="mb-2 text-sm text-gray-600">기본 상태</p>
          <Switch label="Basic switch" id="label01" />
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-600">체크된 상태</p>
          <Switch defaultChecked label="Checked switch" id="label02" />
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-600">비활성화</p>
          <Switch disabled label="Disabled switch" />
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-600">비활성화 + 체크</p>
          <Switch disabled defaultChecked label="Disabled checked" />
        </div>
      </div>
    </div>
  ),
};

/* export const Customization: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-lg font-semibold">라벨 커스터마이징</h3>
        <div className="space-y-3">
          <Switch id="custom-label-1" label="굵은 라벨" labelProps={{ className: 'font-bold' }} />
          <Switch id="custom-label-2" variant="success" label="큰 성공 라벨" labelProps={{ className: 'text-lg font-semibold' }} />
          <Switch id="custom-label-3" variant="danger" label="작은 위험 라벨" labelProps={{ className: 'text-sm italic' }} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">기존 방식도 지원</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch id="manual-1" />
            <label htmlFor="manual-1" className="text-base text-gray-500">
              수동 라벨 (색상 변화 없음)
            </label>
          </div>

          <div className="flex items-center space-x-2 has-[button[data-state='checked']]:text-purple-600">
            <Switch id="manual-2" />
            <label htmlFor="manual-2" className="text-base text-gray-500">
              수동 라벨 (보라색 변화)
            </label>
          </div>
        </div>
      </div>
    </div>
  ),
}; */
