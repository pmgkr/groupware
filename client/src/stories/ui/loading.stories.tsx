import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { LoadingProvider, useLoading, Loading } from '@/components/common/ui/Loading/Loading';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof LoadingProvider> = {
  title: 'Components/ui/Loading',
  component: LoadingProvider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '저장이나 처리 중일 때 표시되는 로딩 컴포넌트입니다. 전체 화면 오버레이로 표시됩니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingProvider>;

// 타이틀+텍스트 둘 다 있을 때
export const WithTitleAndMessage: Story = {
  render: () => {
    const Content = () => {
      const { showLoading, hideLoading } = useLoading();
      
      const test = async () => {
        showLoading({
          title: '등록하신 <em>첨부파일</em>을 <em>서버로 배송 중</em> 입니다.',
          message: '새로고침을 누르면 처음부터 다시 시작됩니다.'
        });
        
        try {
          // Promise를 받은 경우 자동으로 사라짐짐
          await new Promise(resolve => setTimeout(resolve, 2000));
        } finally {
          hideLoading(); // Promise를 사용하지 않을 시 수동으로 로딩 숨김
        }
      };
      
      return (
        <div className="flex flex-col items-center justify-center w-[100vw] h-[100vh] gap-4">
          <Button onClick={test}>
            타이틀+텍스트 로딩 표시
          </Button>
        </div>
      );
    };
    
    return (
      <LoadingProvider>
        <Content />
      </LoadingProvider>
    );
  },
};

// 타이틀만 있을 때
export const WithTitleOnly: Story = {
  render: () => {
    const Content = () => {
      const { showLoading, hideLoading } = useLoading();
      
      const test = async () => {
        showLoading({
          title: '등록하신 <em>첨부파일</em>을 <em>서버로 배송 중</em> 입니다.'
        });
        
        try {
          // Promise를 받은 경우 자동으로 사라짐짐
          await new Promise(resolve => setTimeout(resolve, 2000));
        } finally {
          hideLoading(); // Promise를 사용하지 않을 시 수동으로 로딩 숨김
        }
      };
      
      return (
        <div className="flex flex-col items-center justify-center w-[100vw] h-[100vh] gap-4">
          <Button onClick={test}>
            타이틀만 로딩 표시
          </Button>
        </div>
      );
    };
    
    return (
      <LoadingProvider>
        <Content />
      </LoadingProvider>
    );
  },
};

// 아이콘만 있을 때
export const IconOnly: Story = {
  render: () => {
    const Content = () => {
      const { showLoading, hideLoading } = useLoading();
      
      const test = async () => {
        showLoading();
        
        try {
          // Promise를 받은 경우 자동으로 사라짐짐
          await new Promise(resolve => setTimeout(resolve, 2000));
        } finally {
          hideLoading(); // Promise를 사용하지 않을 시 수동으로 로딩 숨김
        }
      };
      
      return (
        <div className="flex flex-col items-center justify-center w-[100vw] h-[100vh] gap-4">
          <Button onClick={test}>
            아이콘만 로딩 표시
          </Button>
        </div>
      );
    };
    
    return (
      <LoadingProvider>
        <Content />
      </LoadingProvider>
    );
  },
};

// ===== 컴포넌트 직접 사용 예제 =====

// 컴포넌트 직접 사용: 타이틀+텍스트
export const DirectUseWithTitleAndMessage: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Component로 사용시',
      },
      source: {
        code: '<Loading\n  title="등록하신 <em>첨부파일</em>을 <br><em>서버로 배송 중</em> 입니다."\n  message="새로고침을 누르면 처음부터 다시"\n/>',
        language: 'jsx',
      },
    },
  },
  render: () => (
    <div style={{ position: 'relative', minHeight: '500px', width: '100%' }}>
      <Loading
        title="등록하신 <em>첨부파일</em>을 <br><em>서버로 배송 중</em> 입니다."
        message="새로고침을 누르면 처음부터 다시"
      />
    </div>
  ),
};

// 컴포넌트 직접 사용: 타이틀만
export const DirectUseWithTitleOnly: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Component로 사용시',
      },
      source: {
        code: '<Loading\n  title="등록하신 <em>첨부파일</em>을 <br><em>서버로 배송 중</em> 입니다."\n/>',
        language: 'jsx',
      },
    },
  },
  render: () => (
    <div style={{ position: 'relative', minHeight: '500px', width: '100%' }}>
      <Loading
        title="등록하신 <em>첨부파일</em>을 <br><em>서버로 배송 중</em> 입니다."
      />
    </div>
  ),
};

// 컴포넌트 직접 사용: 아이콘만
export const DirectUseIconOnly: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Component로 사용시',
      },
      source: {
        code: '<Loading />',
        language: 'jsx',
      },
    },
  },
  render: () => (
    <div style={{ position: 'relative', minHeight: '500px', width: '100%' }}>
      <Loading />
    </div>
  ),
};


