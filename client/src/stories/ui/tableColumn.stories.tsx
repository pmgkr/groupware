import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import React from 'react';
const meta: Meta<typeof TableColumn> = {
  title: 'Components/UI/tableColumn',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TableColumn>;

export const Default: Story = {
  render: (args) => (
    <TableColumn className="max-w-md">
      <TableColumnHeader>
        <TableColumnHeaderCell>문서번호</TableColumnHeaderCell>
        <TableColumnHeaderCell>구분</TableColumnHeaderCell>
        <TableColumnHeaderCell>팀</TableColumnHeaderCell>
        <TableColumnHeaderCell>작성자</TableColumnHeaderCell>
        <TableColumnHeaderCell>작성일자</TableColumnHeaderCell>
      </TableColumnHeader>
      <TableColumnBody>
        <TableColumnCell>2025-00-001</TableColumnCell>
        <TableColumnCell>교육비</TableColumnCell>
        <TableColumnCell>CCP</TableColumnCell>
        <TableColumnCell>윤도운</TableColumnCell>
        <TableColumnCell>2025-05-26</TableColumnCell>
      </TableColumnBody>
    </TableColumn>
  ),
};

export const Form_ver: Story = {
  render: (args) => (
    <TableColumn className="max-w-md">
      <TableColumnHeader>
        <TableColumnHeaderCell>문서번호</TableColumnHeaderCell>
        <TableColumnHeaderCell>구분</TableColumnHeaderCell>
        <TableColumnHeaderCell>팀</TableColumnHeaderCell>
        <TableColumnHeaderCell>작성자</TableColumnHeaderCell>
        <TableColumnHeaderCell>작성일자</TableColumnHeaderCell>
      </TableColumnHeader>
      <TableColumnBody>
        <TableColumnCell>
          <input type="text" />
        </TableColumnCell>
        <TableColumnCell>
          <input type="text" />
        </TableColumnCell>
        <TableColumnCell>
          <input type="text" />
        </TableColumnCell>
        <TableColumnCell>
          <input type="text" />
        </TableColumnCell>
        <TableColumnCell>
          <input type="text" />
        </TableColumnCell>
      </TableColumnBody>
    </TableColumn>
  ),
};
