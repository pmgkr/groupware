import { useNavigate, useParams, Link } from 'react-router';
import { formatAmount } from '@/utils';
import { cn } from '@/lib/utils';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download, Edit } from '@/assets/images/icons';
import { RotateCcw } from 'lucide-react';

import { useProjectExpenseMatching } from './hooks/useProjectExpenseMatching';

import EstimateSelectDialog from './_components/EstimateSelectDialog';
import EstimateMatching from './_components/EstimateMatching';
import EstimateMatched from './_components/EstimateMatched';
import ExpenseViewRow from './_components/ExpenseViewRow';
import ExpenseViewEstRow from './_components/ExpenseViewEstRow';

export default function ProjectExpenseView() {
  const { expId, projectId } = useParams();
  const navigate = useNavigate();

  /** -----------------------------------------
   *  핵심 매칭 로직 공유 훅
   ----------------------------------------- */
  const {
    data,
    loading,
    refresh,

    dialogOpen,
    expenseInfo,
    matchedItems,
    dbMatchedItems,
    matchedMap,

    openDialog,
    openEstimateDialog,
    confirmEstimateSelect,
    closeEstimateDialog,

    completeMatching,
    resetMatching,
    clearMatching,

    loadMatchedItems,
    deleteMatching,

    selectedExpSeq,
    selectedEstId,
    setSelectedEstId,
  } = useProjectExpenseMatching(expId);

  // 로딩 상태
  if (loading) return <div className="flex h-[50vh] items-center justify-center text-gray-500">데이터를 불러오는 중입니다...</div>;

  if (!data)
    return (
      <div className="p-6 text-center text-gray-500">
        데이터를 찾을 수 없습니다.
        <div className="mt-4">
          <Button onClick={() => navigate(-1)} variant="secondary">
            뒤로가기
          </Button>
        </div>
      </div>
    );

  const { header, items } = data;

  /** -----------------------------------------
   *  상태 Badge
   ----------------------------------------- */
  const statusMap = {
    Saved: (
      <Badge variant="grayish" size="md">
        임시저장
      </Badge>
    ),
    Claimed: (
      <Badge variant="secondary" size="md">
        승인대기
      </Badge>
    ),
    Confirmed: <Badge size="md">승인완료</Badge>,
    Approved: (
      <Badge className="bg-primary-blue/80" size="md">
        지급대기
      </Badge>
    ),
    Completed: (
      <Badge className="bg-primary-blue" size="md">
        지급완료
      </Badge>
    ),
    Rejected: (
      <Badge className="bg-destructive" size="md">
        반려됨
      </Badge>
    ),
  };
  const statusBadge = statusMap[header.status as keyof typeof statusMap];

  /** -----------------------------------------
   *  합계
   ----------------------------------------- */
  const totals = items.reduce(
    (acc, item) => {
      acc.amount += item.ei_amount || 0;
      acc.tax += item.ei_tax || 0;
      acc.total += item.ei_total || 0;
      return acc;
    },
    { amount: 0, tax: 0, total: 0 }
  );

  return (
    <>
      <div className="flex min-h-140 flex-wrap justify-between pb-12">
        {/* ---------------------- Left: 비용 정보 ---------------------- */}
        <div className={`${data.header.is_estimate === 'Y' ? 'w-[74%]' : 'w-full'} tracking-tight`}>
          <div className="flex w-full items-end justify-between pb-2">
            <h3 className="text-lg font-bold text-gray-800">비용 정보</h3>

            {header.status === 'Saved' && (
              <Button
                asChild
                type="button"
                size="sm"
                variant="transparent"
                className="h-auto gap-1 text-gray-600 hover:text-gray-700 has-[>svg]:px-1">
                <Link to={`/project/${projectId}/expense/edit/${header.seq}`}>
                  <Edit className="size-4.5" />
                </Link>
              </Button>
            )}
          </div>

          {/* 기본 정보 테이블 */}
          <TableColumn className="[&_div]:text-[13px]">
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>비용 제목</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.el_title}</TableColumnCell>
            </TableColumnBody>
          </TableColumn>

          <TableColumn className="border-t-0 [&_div]:text-[13px]">
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>작성자</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.user_nm}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>은행명</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>
                {header.bank_name} [{header.bank_code}]
              </TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>비용 상태</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{statusBadge}</TableColumnCell>
            </TableColumnBody>
          </TableColumn>
          {header.remark && (
            <TableColumn className="border-t-0 [&_div]:text-[13px]">
              <TableColumnHeader className="w-[12%]">
                <TableColumnHeaderCell>비고</TableColumnHeaderCell>
              </TableColumnHeader>
              <TableColumnBody>
                <TableColumnCell className="leading-[1.3]">{header.remark}</TableColumnCell>
              </TableColumnBody>
            </TableColumn>
          )}

          {/* ---------------------- 비용 항목 테이블 ---------------------- */}
          <div className="mt-6">
            <h3 className="mb-2 text-lg font-bold text-gray-800">비용 항목</h3>
            <Table variant="primary" align="center" className="table-fixed">
              <TableHeader>
                <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                  <TableHead className="w-[10%]">비용유형</TableHead>
                  <TableHead className="w-[20%]">가맹점명</TableHead>
                  <TableHead className="w-[10%] px-4">매입일자</TableHead>
                  <TableHead className="w-[14%]">금액 (A)</TableHead>
                  <TableHead className="w-[10%]">세금</TableHead>
                  <TableHead className="w-[14%]">합계</TableHead>
                  <TableHead className="w-[20%]">증빙자료</TableHead>
                  <TableHead className="w-[8%]">{data.header.is_estimate === 'Y' ? '견적서' : '기안서'}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.header.is_estimate === 'Y'
                  ? items.map((item, idx) => {
                      const alreadyMatched = (item.matchedList?.length ?? 0) > 0;
                      const isMatched = (matchedMap[item.seq]?.length ?? 0) > 0;
                      const isMatching = expenseInfo?.seq === item.seq && matchedItems.length > 0;
                      const isWaiting = Boolean(expenseInfo && expenseInfo.seq !== item.seq && matchedItems.length > 0);

                      return (
                        <ExpenseViewEstRow
                          key={item.seq}
                          item={item}
                          idx={idx}
                          onMatched={() => loadMatchedItems(item)}
                          onMatching={() => {
                            if (matchedMap[item.seq]?.length) {
                              // 첫 번째 매칭된 항목의 est_id 사용
                              const firstItem = matchedMap[item.seq][0];
                              if (firstItem?.est_id) {
                                setSelectedEstId(firstItem.est_id);
                              }
                            }

                            openDialog();
                          }}
                          onSetMatching={() => openEstimateDialog(item.seq, item.ei_amount)}
                          alreadyMatched={alreadyMatched}
                          isMatched={isMatched}
                          isMatching={isMatching}
                          isWaiting={isWaiting}
                        />
                      );
                    })
                  : items.map((item) => <ExpenseViewRow key={item.seq} item={item} />)}

                <TableRow className="bg-primary-blue-50 [&_td]:py-3">
                  <TableCell className="font-semibold" colSpan={3}>
                    총 비용
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.amount)}원</TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.tax)}원</TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.total)}원</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/project/${projectId}/expense`}>목록</Link>
            </Button>
          </div>
        </div>

        {/* ---------------------- Right: 매칭 영역 ---------------------- */}
        {data.header.is_estimate === 'Y' && (
          <div className="w-[24%]">
            <div className="flex justify-between">
              <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 매칭</h2>

              {dbMatchedItems.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="svgIcon"
                  className="h-auto pr-1! text-gray-500"
                  onClick={() => deleteMatching(selectedExpSeq!)}>
                  견적 매칭 재설정
                  <RotateCcw className="size-3" />
                </Button>
              ) : matchedItems.length > 0 ? (
                <Button type="button" size="sm" variant="svgIcon" className="h-auto pr-1! text-gray-500" onClick={clearMatching}>
                  견적서 매칭취소
                  <RotateCcw className="size-3" />
                </Button>
              ) : null}
            </div>

            {dbMatchedItems.length > 0 ? (
              <EstimateMatched items={dbMatchedItems} />
            ) : (
              <EstimateMatching
                matchedItems={matchedItems}
                expenseInfo={expenseInfo}
                onReset={resetMatching}
                onRefresh={() => refresh()}
                onMatched={completeMatching}
              />
            )}
          </div>
        )}
      </div>

      {/* ---------------------- Dialog ---------------------- */}
      <EstimateSelectDialog
        open={dialogOpen}
        onOpenChange={closeEstimateDialog}
        projectId={projectId}
        expenseInfo={expenseInfo}
        onConfirm={(items) => confirmEstimateSelect(items, selectedEstId)}
        selectingItems={matchedItems}
        selectedEstId={selectedEstId}
        setSelectedEstId={setSelectedEstId}
      />
    </>
  );
}
