import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import { Loading } from '@/components/common/ui/Loading/Loading';
import { LoadingIcon } from '@/components/common/ui/Loading/LoadingIcon';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof Loading> = {
  title: 'Components/ui/Loading',
  component: Loading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '저장이나 처리 중일 때 표시되는 로딩 컴포넌트입니다. 전체 화면 오버레이로 표시됩니다.',
      },
    },
  },
  argTypes: {
    message: {
      control: 'text',
      description: '로딩 메시지 텍스트',
    },
    title: {
      control: 'text',
      description: '로딩 제목 텍스트',
    },
    className: {
      control: 'text',
      description: '추가 CSS 클래스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Loading>;

// 타이틀+텍스트 둘 다 있을 때
export const WithTitleAndMessage: Story = {
  render: () => (
    <div className="relative min-h-screen">
      <Loading
        title="등록하신 <em>첨부파일</em>을 <br><em>서버로 배송 중</em> 입니다."
        message="새로고침을 누르면 처음부터 다시"
      />
    </div>
  ),
};

// 타이틀만 있을 때
export const WithTitleOnly: Story = {
  render: () => (
    <div className="relative min-h-screen">
      <Loading
        title="등록하신 <em>첨부파일</em>을 <br><em>서버로 배송 중</em> 입니다."
      />
    </div>
  ),
};

// 아이콘만 있을 때
export const IconOnly: Story = {
  render: () => (
    <div className="relative min-h-screen">
      <Loading />
    </div>
  ),
};

// 버튼 클릭으로 각 케이스 전환하는 예제
export const Interactive: Story = {
  render: () => {
    const [loadingType, setLoadingType] = useState<'title-message' | 'title-only' | 'icon-only' | null>(null);

    useEffect(() => {
      if (loadingType) {
        const timer = setTimeout(() => {
          setLoadingType(null);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }, [loadingType]);

    return (
      <div className="relative min-h-screen">
        {loadingType === 'title-message' && (
          <Loading
            title="등록하신 <em>첨부파일</em>을 <br><em>서버로 배송 중</em> 입니다."
            message="새로고침을 누르면 처음부터 다시"
          />
        )}
        {loadingType === 'title-only' && (
          <Loading
            title="등록하신 <em>첨부파일</em>을 <br><em>서버로 배송 중</em> 입니다."
          />
        )}
        {loadingType === 'icon-only' && (
          <Loading />
        )}
        
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
          <h2 className="text-2xl font-bold">로딩 컴포넌트 테스트</h2>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => setLoadingType('title-message')}
              disabled={loadingType === 'title-message'}
            >
              타이틀+텍스트
            </Button>
            <Button 
              onClick={() => setLoadingType('title-only')}
              disabled={loadingType === 'title-only'}
            >
              타이틀만
            </Button>
            <Button 
              onClick={() => setLoadingType('icon-only')}
              disabled={loadingType === 'icon-only'}
            >
              아이콘만
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

