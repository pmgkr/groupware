import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';

import EstimateMatching from '../_components/EstimateMatching';
import EstimateMatched from '../_components/EstimateMatched';
import ExpenseViewRow from '../_components/ExpenseViewRow';
import ExpenseViewEstRow from '../_components/ExpenseViewEstRow';
import ReportMatched from '../_components/ReportMatched';

import { type ExpenseViewProps } from '../types/ExpenseViewProps';

export function ProjectExpenseViewPC(props: ExpenseViewProps) {
  const {
    data,
    statusBadge,
    totals,
    matchedItems,
    matchedMap,
    expenseInfo,
    openDialog,
    openEstimateDialog,
    loadMatchedItems,
    selectedEstId,
    setSelectedEstId,
  } = props;

  const { header, items } = data;

  return (
    <div className="flex min-h-140 flex-wrap justify-between pb-12">
      {/* ---------------------- Left: 비용 정보 ---------------------- */}
      <div className="w-[74%] tracking-tight">
        <div className="flex w-full items-end justify-between pb-2">
          <h3 className="text-lg font-bold text-gray-800">비용 정보</h3>

          <div className="flex items-center text-sm text-gray-500">
            EXP #.
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-1 h-6 leading-[1.2] text-gray-700 hover:bg-white has-[>svg]:px-1.5"
              onClick={() => copyExpId(header.exp_id)}>
              {header.exp_id}
              <Files className="size-3" />
            </Button>
          </div>
        </div>

        {/* 기본 정보 테이블 */}
        <TableColumn className="[&_div]:text-[13px]">
          <TableColumnHeader className="w-[12%]">
            <TableColumnHeaderCell>비용 제목</TableColumnHeaderCell>
          </TableColumnHeader>
          <TableColumnBody>
            <TableColumnCell>
              <div className="flex w-full items-center justify-between">
                <div className="flex-1 leading-[1.3]">{header.el_title}</div>

                {header.status === 'Saved' && (
                  <Button
                    asChild
                    type="button"
                    size="sm"
                    variant="transparent"
                    className="h-auto shrink-0 gap-1 text-gray-600 hover:text-gray-700 has-[>svg]:px-1">
                    <Link to={`/project/${projectId}/expense/edit/${header.seq}`}>
                      <Edit className="size-4.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </TableColumnCell>
          </TableColumnBody>
        </TableColumn>

        <TableColumn className="border-t-0 [&_div]:text-[13px]">
          <TableColumnHeader className="w-[12%]">
            <TableColumnHeaderCell>비용 유형</TableColumnHeaderCell>
          </TableColumnHeader>
          <TableColumnBody>
            <TableColumnCell>{header.el_type}</TableColumnCell>
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
        <TableColumn className="border-t-0 [&_div]:text-[13px]">
          <TableColumnHeader className="w-[12%]">
            <TableColumnHeaderCell>증빙 수단</TableColumnHeaderCell>
          </TableColumnHeader>
          <TableColumnBody>
            <TableColumnCell>{header.el_method}</TableColumnCell>
          </TableColumnBody>

          <TableColumnHeader className="w-[12%]">
            <TableColumnHeaderCell>계좌번호</TableColumnHeaderCell>
          </TableColumnHeader>
          <TableColumnBody>
            <TableColumnCell>{header.bank_account}</TableColumnCell>
          </TableColumnBody>
          <TableColumnHeader className="w-[12%]">
            <TableColumnHeaderCell>입금희망일</TableColumnHeaderCell>
          </TableColumnHeader>
          <TableColumnBody>
            <TableColumnCell>{header.el_deposit ? formatDate(header.el_deposit) : <span>-</span>}</TableColumnCell>
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
            <TableColumnHeaderCell>예금주</TableColumnHeaderCell>
          </TableColumnHeader>
          <TableColumnBody>
            <TableColumnCell>{header.account_name}</TableColumnCell>
          </TableColumnBody>
          <TableColumnHeader className="w-[12%]">
            <TableColumnHeaderCell>작성일</TableColumnHeaderCell>
          </TableColumnHeader>
          <TableColumnBody>
            <TableColumnCell>{formatDate(header.wdate)}</TableColumnCell>
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
        {header.rej_reason && (
          <TableColumn className="border-t-0 [&_div]:text-[13px]">
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>반려 사유</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell className="text-destructive leading-[1.3]">
                {header.rej_reason} {header.rejected_by && <span>- {header.rejected_by}</span>}
              </TableColumnCell>
            </TableColumnBody>
          </TableColumn>
        )}

        {/* ---------------------- 비용 항목 테이블 ---------------------- */}
        <div className="mt-6">
          <h3 className="mb-2 text-lg font-bold text-gray-800">비용 항목</h3>
          <Table variant="primary" align="center" className="table-fixed">
            <TableHeader>
              <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                <TableHead className="w-[10%]">비용 용도</TableHead>
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
                : items.map((item) => <ExpenseViewRow key={item.seq} item={item} onProposal={() => setReportInfo(item.pro_id)} />)}

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
            <Link to={`${hasFlag ? '/mypage/expense' : `/project/${projectId}/expense`}${search}`}>목록</Link>
          </Button>
        </div>
      </div>

      {/* ---------------------- Right: 매칭 영역 ---------------------- */}
      <div className="w-[24%]">
        {data.header.is_estimate === 'Y' ? (
          <>
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
              <EstimateMatched items={dbMatchedItems} project_id={projectId} />
            ) : (
              <EstimateMatching
                matchedItems={matchedItems}
                expenseInfo={expenseInfo}
                onReset={resetMatching}
                onRefresh={() => refresh()}
                onMatched={completeMatching}
              />
            )}
          </>
        ) : (
          // 기안서 정보
          <>
            <div className="flex justify-between">
              <h2 className="mb-2 text-lg font-bold text-gray-800">기안서 정보</h2>
            </div>
            <ReportMatched report={selectedProposal} />
          </>
        )}
      </div>
    </div>
  );
}
