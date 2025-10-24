import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Link } from 'react-router';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Delete, Edit } from '@/assets/images/icons';

const meta: Meta<typeof Table> = {
  title: 'Components/UI/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
  },
  parameters: {
    docs: {
      description: {
        component: '가로형 테이블 UI. variant: default, primary / align: left, center, right 옵션 제공',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Table>
          <TableCaption>은행계좌 목록</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[16%]">별명</TableHead>
              <TableHead className="w-[16%]">은행명</TableHead>
              <TableHead className="w-[16%]">계좌</TableHead>
              <TableHead className="w-[18%]">계좌 번호</TableHead>
              <TableHead className="w-[22%]">등록일시</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>국민은행 계좌</TableCell>
              <TableCell>국민은행</TableCell>
              <TableCell>홍길동</TableCell>
              <TableCell>500-1234-5678</TableCell>
              <TableCell>2025-07-04 14:44:00</TableCell>
              <TableCell>
                <Button variant="svgIcon" size="icon">
                  <Edit className="size-4" />
                </Button>
                <Button variant="svgIcon" size="icon">
                  <Delete className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>우리은행 계좌</TableCell>
              <TableCell>우리은행</TableCell>
              <TableCell>홍길동</TableCell>
              <TableCell>500-1234-5678</TableCell>
              <TableCell>2025-07-04 14:44:00</TableCell>
              <TableCell>
                <Button variant="svgIcon" size="icon">
                  <Edit className="size-4" />
                </Button>
                <Button variant="svgIcon" size="icon">
                  <Delete className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>국민은행 계좌</TableCell>
              <TableCell>국민은행</TableCell>
              <TableCell>홍길동</TableCell>
              <TableCell>500-1234-5678</TableCell>
              <TableCell>2025-07-04 14:44:00</TableCell>
              <TableCell>
                <Button variant="svgIcon" size="icon">
                  <Edit className="size-4" />
                </Button>
                <Button variant="svgIcon" size="icon">
                  <Delete className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>
    ),
  },
};

export const Primary: Story = {
  args: {
    children: (
      <Table variant="primary">
        <TableCaption>은행계좌 목록</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[16%]">별명</TableHead>
            <TableHead className="w-[16%]">은행명</TableHead>
            <TableHead className="w-[16%]">계좌</TableHead>
            <TableHead className="w-[18%]">계좌 번호</TableHead>
            <TableHead className="w-[22%]">등록일시</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>국민은행 계좌</TableCell>
            <TableCell>국민은행</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>500-1234-5678</TableCell>
            <TableCell>2025-07-04 14:44:00</TableCell>
            <TableCell>
              <Button variant="svgIcon" size="icon">
                <Edit className="size-4" />
              </Button>
              <Button variant="svgIcon" size="icon">
                <Delete className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>우리은행 계좌</TableCell>
            <TableCell>우리은행</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>500-1234-5678</TableCell>
            <TableCell>2025-07-04 14:44:00</TableCell>
            <TableCell>
              <Button variant="svgIcon" size="icon">
                <Edit className="size-4" />
              </Button>
              <Button variant="svgIcon" size="icon">
                <Delete className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>국민은행 계좌</TableCell>
            <TableCell>국민은행</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>500-1234-5678</TableCell>
            <TableCell>2025-07-04 14:44:00</TableCell>
            <TableCell>
              <Button variant="svgIcon" size="icon">
                <Edit className="size-4" />
              </Button>
              <Button variant="svgIcon" size="icon">
                <Delete className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
};

export const AlignLeft: Story = {
  args: {
    children: (
      <Table variant="primary" align="left">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[9%]">EXP#</TableHead>
            <TableHead className="w-[8%]">비용 용도</TableHead>
            <TableHead>비용 제목</TableHead>
            <TableHead className="w-[8%]">증빙 수단</TableHead>
            <TableHead className="w-[8%]">증빙 상태</TableHead>
            <TableHead className="w-[10%]">합계 금액</TableHead>
            <TableHead className="w-[12%]">상태</TableHead>
            <TableHead className="w-[12%]">작성자</TableHead>
            <TableHead className="w-[16%]">작성 일시</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <Link to="/expense/1" className="rounded-[4px] border-1 p-1 text-sm">
                PN25-27564
              </Link>
            </TableCell>
            <TableCell>교통비</TableCell>
            <TableCell>출장 교통비</TableCell>
            <TableCell>영수증</TableCell>
            <TableCell>
              <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">
                제출
              </Badge>
            </TableCell>
            <TableCell>45,000원</TableCell>
            <TableCell>
              <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">
                승인대기
              </Badge>
            </TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>2025-07-04 14:44:00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
};
