// stories/UserMultiSelect.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { UserMultiSelect, type UserOption } from '@/components/filter/multiSelect';

const meta: Meta<typeof UserMultiSelect> = {
  title: 'Components/Filter/UserMultiSelect',
  component: UserMultiSelect,
  tags: ['autodocs'], // 자동 문서화를 위해 추가
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof UserMultiSelect>;

const dummyUsers: UserOption[] = [
  { id: '1', name: '김예지', email: 'yeji@example.com' },
  { id: '2', name: '이철수', email: 'chulsoo@example.com' },
  { id: '3', name: '김예지', email: 'another@example.com' },
  { id: '4', name: '박영희', email: 'younghee@example.com' },
  { id: '5', name: '홍길동', email: 'hong@example.com' },
];

export const Default: Story = {
  render: () => {
    const [selectedUsers, setSelectedUsers] = React.useState<UserOption[]>([]);

    return (
      <>
        <div className="w-[200px]">
          <UserMultiSelect users={dummyUsers} selected={selectedUsers} onChange={setSelectedUsers} />

          {/*<div>
            <h4 className="mb-1 text-sm font-semibold">Selected Users</h4>
            <ul className="space-y-1 text-sm">
              {selectedUsers.map((user) => (
                <li key={user.id}>
                  {user.name} ({user.email})
                </li>
              ))}
            </ul>
          </div>
          */}
        </div>
      </>
    );
  },
};
