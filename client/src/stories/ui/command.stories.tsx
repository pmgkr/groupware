import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from 'lucide-react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@components/ui/command'

const meta: Meta<typeof Command> = {
  title: 'Components/UI/Command',
  component: Command,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Command 열기
        </button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="명령어를 입력하세요..." />
          <CommandList>
            <CommandEmpty>결과를 찾을 수 없습니다.</CommandEmpty>
            <CommandGroup heading="제안">
              <CommandItem>
                <Calendar className="mr-2 h-4 w-4" />
                <span>달력</span>
              </CommandItem>
              <CommandItem>
                <Smile className="mr-2 h-4 w-4" />
                <span>검색</span>
              </CommandItem>
              <CommandItem>
                <Calculator className="mr-2 h-4 w-4" />
                <span>계산기</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="설정">
              <CommandItem>
                <User className="mr-2 h-4 w-4" />
                <span>프로필</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>결제</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>설정</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    )
  },
}

export const Inline: Story = {
  render: () => (
    <div className="w-80">
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="검색어를 입력하세요..." />
        <CommandList>
          <CommandEmpty>결과를 찾을 수 없습니다.</CommandEmpty>
          <CommandGroup heading="프로젝트">
            <CommandItem>
              <Calendar className="mr-2 h-4 w-4" />
              <span>그룹웨어 프로젝트</span>
            </CommandItem>
            <CommandItem>
              <Calculator className="mr-2 h-4 w-4" />
              <span>계산기 앱</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="팀">
            <CommandItem>
              <User className="mr-2 h-4 w-4" />
              <span>개발팀</span>
            </CommandItem>
            <CommandItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>디자인팀</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
}

export const WithShortcuts: Story = {
  render: () => (
    <div className="w-80">
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="명령어를 입력하세요..." />
        <CommandList>
          <CommandEmpty>결과를 찾을 수 없습니다.</CommandEmpty>
          <CommandGroup heading="빠른 액션">
            <CommandItem>
              <span>새 프로젝트</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <span>파일 열기</span>
              <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <span>저장</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <span>복사</span>
              <CommandShortcut>⌘C</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <span>붙여넣기</span>
              <CommandShortcut>⌘V</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <div className="w-80">
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="검색어를 입력하세요..." />
        <CommandList>
          <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        </CommandList>
      </Command>
    </div>
  ),
}
