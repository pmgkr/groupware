import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { getEstExpenseItem, type EstExpenseItemResponse } from '@/api';

import { formatAmount } from '@/utils';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@components/ui/dialog';
import { SquareArrowOutUpRight } from 'lucide-react';

interface ExpenseDialogProps {
  open: boolean;
  ei_seq: number | null;
  onClose: () => void;
}

export default function ExpenseItemDialog({ open, ei_seq, onClose }: ExpenseDialogProps) {
  const { projectId } = useParams();
  const [selectedExpList, setSelectedExpList] = useState<EstExpenseItemResponse[]>([]);

  useEffect(() => {
    if (!open || ei_seq === null) return;

    (async () => {
      try {
        const res = await getEstExpenseItem(ei_seq);
        setSelectedExpList(res);
      } catch (err) {
        console.error('❌ 비용 조회 실패:', err);
      }
    })();
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>비용 항목 조회</DialogTitle>
            <DialogDescription>해당 견적서 항목과 매칭된 비용 항목을 조회합니다.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-1 flex-col">
            <div className="">
              <Table variant="primary" align="center" className="table-fixed">
                <TableHeader>
                  <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
                    <TableHead className="w-[10%]">비용 용도</TableHead>
                    <TableHead className="">가맹점명</TableHead>
                    <TableHead className="w-[12%]">금액</TableHead>
                    <TableHead className="w-[10%]">세금</TableHead>
                    <TableHead className="w-[12%]">합계</TableHead>
                    <TableHead className="w-[14%]">매칭한 금액</TableHead>
                    <TableHead className="w-[8%]">바로가기</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>

              <div className="max-h-[50vh] overflow-y-auto">
                <Table variant="primary" align="center" className="table-fixed">
                  <colgroup>
                    <col style={{ width: '10%' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '8%' }} />
                  </colgroup>
                  <TableBody>
                    {selectedExpList.length > 0 ? (
                      selectedExpList.map((item) => (
                        <TableRow key={item.pseq} className="[&_td]:px-2 [&_td]:text-[13px]">
                          <TableCell className="">{item.ei_type}</TableCell>
                          <TableCell className="text-left">{item.ei_title}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.ei_amount)}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.ei_tax)}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.ei_total)}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.alloc_amount)}</TableCell>
                          <TableCell>
                            <Link
                              to={`/project/${projectId}/expense/${item.list_seq}`}
                              target="_blank"
                              className="hover:text-primary text-gray-600">
                              <SquareArrowOutUpRight className="mx-auto size-4" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="py-25 text-center text-gray-500">
                          매칭된 비용 항목을 찾을 수 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter className="justify-center">
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
