import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/board';
import { Button } from '@components/ui/button';
import { Delete, Edit } from '@/assets/images/icons';

const meta: Meta<typeof Table> = {
  title: 'Components/UI/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: '가로형 테이블 UI',
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
