import { useState, useEffect } from 'react';
import { formatKST, formatAmount, displayUnitPrice } from '@/utils';
import { type EstimateItemsView, expenseEstimateMatch } from '@/api';
import { type expenseInfo } from '@/types/estimate';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Link2, Info, OctagonAlert, CheckCircle } from 'lucide-react';

export default function EstimateMatching({
  matchedItems,
  expenseInfo,
  onReset,
  onRefresh,
  onMatched,
}: {
  matchedItems: EstimateItemsView[];
  expenseInfo: expenseInfo | null;
  onReset: () => void;
  onRefresh: () => Promise<void>;
  onMatched: (expenseSeq: number, items: any[]) => void;
}) {
  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [matchValues, setMatchValues] = useState<number[]>([]);

  // matchedItems 변경될 때 input 값 초기화
  useEffect(() => {
    setMatchValues(matchedItems.map(() => 0));
  }, [matchedItems]);

  // 입력 핸들러
  const handleChange = (idx: number, rawValue: string) => {
    const numeric = Number(rawValue.replace(/[^0-9]/g, ''));
    setMatchValues((prev) => {
      const next = [...prev];
      next[idx] = numeric;
      return next;
    });
  };

  // expenseInfo 없을 때는 계산하지 않도록 보호
  const totalMatch = matchValues.reduce((sum, v) => sum + v, 0); // 입력한 매칭 금액 합계
  const resultAmount = expenseInfo ? expenseInfo.ei_amount - totalMatch : 0;

  const handleCost = (idx: number, ava_amount: number) => {
    if (!expenseInfo) return;

    // if (ava_amount <= 0) {
    //   addAlert({
    //     title: '매칭 실패',
    //     message: '가용 금액이 0원 이하인 항목은 매칭할 수 없습니다.',
    //     icon: <OctagonAlert />,
    //     duration: 1500,
    //   });
    // }

    const available = Math.abs(ava_amount);
    const maxMatch = Math.min(resultAmount, available);

    setMatchValues((prev) => {
      const next = [...prev];
      next[idx] = maxMatch;
      return next;
    });
  };

  /** ----------------------------
   * 매칭하기 버튼 핸들러
   ---------------------------- */
  const handleMatchSubmit = async () => {
    if (!expenseInfo) {
      addAlert({
        title: '매칭 실패',
        message: '비용 항목을 찾을 수 없습니다. 다시 시도해 주세요.',
        icon: <OctagonAlert />,
        duration: 1500,
      });

      return;
    }

    // 1. 총액 검증
    const totalMatch = matchValues.reduce((sum, v) => sum + v, 0);
    if (totalMatch !== expenseInfo.ei_amount) {
      return addAlert({
        title: '매칭 실패',
        message: '총 매칭 금액이 비용 금액과 일치해야 합니다.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
    }

    // 2. 0원 입력 검사
    if (matchValues.some((v) => v <= 0)) {
      return addAlert({
        title: '매칭 실패',
        message: '모든 항목에 1원 이상 입력해야 합니다.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
    }

    // 3. 매칭 데이터 조립
    const payload = {
      items: matchedItems.map((item, idx) => ({
        seq: expenseInfo.seq,
        target_seq: item.seq,
        alloc_amount: matchValues[idx],
      })),
    };

    // 4. 서버 요청
    try {
      const result = await expenseEstimateMatch(payload);

      if (result.ok) {
        addAlert({
          title: '매칭 완료',
          message: '견적서 매칭이 완료되었습니다.',
          icon: <CheckCircle />,
          duration: 1500,
        });

        // UI 초기화 + 상위 refresh
        onMatched(expenseInfo.seq, payload.items);
        onReset();
      }
    } catch (err) {
      console.error(err);
      addAlert({
        title: '매칭 실패',
        message: '매칭 처리 중 오류가 발생했습니다.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
    }
  };

  return (
    <>
      <Table variant="primary" align="center" className="w-full table-fixed">
        {/* ---------------- HEADER ---------------- */}
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="text-left">항목명</TableHead>
            <TableHead className="w-[22%] whitespace-nowrap">가용 금액</TableHead>
            <TableHead className="w-6 whitespace-nowrap"></TableHead>
            <TableHead className="w-[26%] whitespace-nowrap">매칭 금액 (B)</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* ---------------- 매칭 선택 전 ---------------- */}
          {!matchedItems.length && (
            <TableRow>
              <TableCell colSpan={4} className="h-35 text-center text-[13px] text-gray-700">
                비용 항목에서 견적서 매칭을 선택해 주세요.
              </TableCell>
            </TableRow>
          )}

          {/* ---------------- 매칭 가능한 경우 ---------------- */}
          {expenseInfo &&
            matchedItems.length > 0 &&
            matchedItems.map((item, idx) => (
              <TableRow key={item.seq} className="[&_td]:px-2 [&_td]:text-[12px] [&_td]:leading-[1.3]">
                <TableCell className="text-left">{item.ei_name}</TableCell>
                <TableCell className="text-right">{formatAmount(item.ava_amount)}</TableCell>
                <TableCell className="px-0!">
                  <Button
                    type="button"
                    variant="svgIcon"
                    className="size-4 p-0!"
                    onClick={() => handleCost(idx, item.ava_amount ?? 0)}
                    tabIndex={-1}>
                    <Link2 className="mx-auto size-3 text-gray-500" />
                  </Button>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    size="sm"
                    inputMode="numeric"
                    className="h-7 rounded-sm pr-2 pl-1 text-right"
                    value={formatAmount(matchValues[idx] || 0)}
                    onChange={(e) => handleChange(idx, e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}

          {/* ---------------- Footer 합계 ---------------- */}
          {expenseInfo && matchedItems.length > 0 && (
            <TableRow className="[&_td]:text-[13px]">
              <TableCell colSpan={3} className="bg-primary-blue-100 px-2 text-left font-bold text-gray-900">
                <TooltipProvider>
                  <Tooltip>
                    <span className="flex items-center gap-1">
                      잔여 금액
                      <TooltipTrigger asChild>
                        <Info className="size-3 text-gray-500" />
                      </TooltipTrigger>
                    </span>
                    <TooltipContent>비용의 금액(A)과 매칭 금액의 합계(B)가 일치해야 합니다.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="bg-primary-blue-100 px-2 pr-3 text-right font-bold text-gray-900">
                {formatAmount(resultAmount)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="align-items mt-2 flex justify-between">
        {expenseInfo && matchedItems.length > 0 && (
          <div className="ml-auto flex gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => setMatchValues(matchedItems.map(() => 0))}>
              금액 초기화
            </Button>
            <Button type="button" size="sm" onClick={handleMatchSubmit} disabled={resultAmount !== 0}>
              매칭하기
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
