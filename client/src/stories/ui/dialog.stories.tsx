import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@components/ui/button';
import { Textbox, textboxVariants } from '@components/ui/textbox';
import { Textarea } from '@components/ui/textarea';
import { Label } from '@components/ui/label';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const meta: Meta<typeof Dialog> = {
  title: 'Components/UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '트리거에 대한 추가 정보 및 보조 설명을 제공하는 컴포넌트. DialogContent가 화면 중앙을 기준으로 플로팅됨',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">다이얼로그 열기</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>프로필 편집</DialogTitle>
            <DialogDescription>프로필 정보를 수정하세요. 변경사항은 저장 후 적용됩니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Textbox
                id="name"
                defaultValue="홍길동"
                description="성함을 입력해주세요."
                // errorMessage="이름은 필수 입력 항목입니다."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Textbox
                id="username"
                defaultValue="@honggildong"
                description="아이디를 입력해주세요."
                // errorMessage="아이디는 필수 입력 항목입니다."
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={() => setOpen(false)}>
              변경사항 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">삭제하기</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>이 작업은 되돌릴 수 없습니다. 선택한 항목이 영구적으로 삭제됩니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={() => setOpen(false)}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const Alert: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">알림 보기</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>알림 타이틀</DialogTitle>
            <DialogDescription>
              시스템 점검이 예정되어 있습니다. <br />
              2024년 1월 15일 오전 2시부터 4시까지 서비스가 일시 중단될 예정입니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const Form: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>새 프로젝트 생성</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 프로젝트</DialogTitle>
            <DialogDescription>새로운 프로젝트를 생성하세요. 모든 필드는 필수입니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">프로젝트명</Label>
              <Textbox id="project-name" placeholder="프로젝트 이름을 입력하세요" className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" placeholder="프로젝트 설명을 입력하세요" className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">마감일</Label>
              <Textbox id="deadline" type="date" className="w-full justify-start" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setOpen(false)}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};
