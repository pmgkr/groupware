import { useState } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router';
import { cn } from '@/lib/utils';
import { formatAmount, formatDate, normalizeAttachmentUrl } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download, Edit } from '@/assets/images/icons';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { getReportInfo, type ReportDTO } from '@/api/expense/proposal';
import { getProjectExpenseView } from '@/api/project';
import { useProjectExpenseMatching } from './hooks/useProjectExpenseMatching';

import EstimateSelectDialog from './_components/EstimateSelectDialog';
import EstimateMatching from './_components/EstimateMatching';
import EstimateMatched from './_components/EstimateMatched';
import ExpenseViewRow from './_components/ExpenseViewRow';
import ExpenseViewEstRow from './_components/ExpenseViewEstRow';
import ReportMatched from './_components/ReportMatched';

import { RotateCcw, OctagonAlert, Files, File, SquareArrowOutUpRight, Copy } from 'lucide-react';

export default function ProjectExpenseView() {
  const { expId, projectId } = useParams();

  const navigate = useNavigate();
  const { search } = useLocation();
  const isMobile = useIsMobileViewport();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  // 기안서 조회 State
  const [selectedProposal, setSelectedProposal] = useState<ReportDTO | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

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
  } = useProjectExpenseMatching(expId, getProjectExpenseView);

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

  const setReportInfo = async (pro_id: number | undefined | null) => {
    if (pro_id == null) {
      return;
    }

    try {
      setProposalLoading(true);
      const res = await getReportInfo(String(pro_id));
      setSelectedProposal(res.report);
    } catch (e) {
      console.error(e);
    }
  };

  const copyExpId = async (expId: string) => {
    try {
      await navigator.clipboard.writeText(expId);
      addAlert({
        title: '클립보드 복사',
        message: `<p>비용 아이디가 클립보드에 복사되었습니다.</p>`,
        icon: <OctagonAlert />,
        duration: 1500,
      });
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      addAlert({
        title: '클립보드 복사 실패',
        message: `<p>클립보드에 복사할 수 없습니다.</p>`,
        icon: <OctagonAlert />,
        duration: 1500,
      });
    }
  };

  // 마이페이지 > 비용 내역에서 넘어왔는 지 파악
  const hasFlag = new URLSearchParams(search).has('flag');

  return (
    <>
      {isMobile ? (
        <>
          <div className="-mx-4.5 -my-6 bg-white">
            <div className="p-5 tracking-tight">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[13px] text-gray-600" onClick={() => copyExpId(header.exp_id)}>
                  EXP #{header.exp_id} <Files className="size-3" />
                </span>
                {statusBadge}
              </div>
              <div className="my-2">
                <h3 className="mb-1 text-lg leading-[1.3] font-light">{header.el_title}</h3>
                <div className="flex items-center text-xl font-bold">
                  <strong className="text-[1.3em]">{formatAmount(header.el_total)}</strong>원
                </div>
              </div>
              {header.rej_reason && (
                <dl className="flex justify-between py-1">
                  <dt className="text-[13px] text-gray-700">반려사유</dt>
                  <dd className="text-destructive text-right text-[13px] font-medium">
                    {header.rej_reason} {header.rejected_by && <span>- {header.rejected_by}</span>}
                  </dd>
                </dl>
              )}
              <ExpRow title="증빙수단" value={header.el_method} />
              <ExpRow title="작성자" value={header.user_nm} />
              <ExpRow title="작성일" value={formatDate(header.wdate, true)} />
              <div className="mt-3 border-t-1 border-dashed pt-3">
                <ExpRow title="은행명" value={header.bank_name} />
                <ExpRow title="계좌번호" value={header.bank_account} />
                <ExpRow title="예금주" value={header.account_name} />
                <ExpRow title="입금희망일" value={header.el_deposit ? formatDate(header.el_deposit, true) : <span>-</span>} />
                {header.remark && <ExpRow title="비고" value={header.remark} />}
              </div>
            </div>
            <HorzBar />
            <div className="p-5">
              <h3 className="text-lg leading-[1.2] font-bold">비용 항목</h3>
              <div className="py-2">
                {items.map((item) => {
                  return (
                    <div key={item.seq} className="mb-3 border-b-1 border-dashed pb-3 last:border-b-0">
                      <ExpRow title="비용 용도" value={item.ei_type} />
                      <ExpRow title="가맹점명" value={item.ei_title} />
                      <ExpRow title="매입일자" value={formatDate(item.ei_pdate, true)} />
                      <dl className="flex justify-between py-1">
                        <dt className="text-[13px] text-gray-700">금액</dt>
                        <dd className="text-right text-[13px] font-medium">
                          {formatAmount(item.ei_amount) + '원'}
                          <span className="block text-[.8em] font-normal text-gray-500">{`세금 ${formatAmount(item.ei_tax)}원`}</span>
                        </dd>
                      </dl>
                      <dl className="flex justify-between py-1">
                        <dt className="text-[13px] text-gray-700">합계</dt>
                        <dd className="text-right text-base font-semibold">{formatAmount(item.ei_total) + '원'}</dd>
                      </dl>
                      <dl className="flex justify-between py-1">
                        <dt className="text-[13px] text-gray-700">증빙자료</dt>
                        <dd className="text-right text-[13px] font-medium">
                          {item.attachments && item.attachments.length > 0 ? (
                            item.attachments.map((att, idx) => (
                              <li key={idx} className="overflow-hidden text-sm text-gray-800">
                                <a
                                  href={normalizeAttachmentUrl(att.ea_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1">
                                  {/* 파일명 */}
                                  <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap hover:underline">
                                    {att.ea_fname}
                                  </span>
                                </a>
                              </li>
                            ))
                          ) : (
                            <span>-</span>
                          )}
                        </dd>
                      </dl>
                      {header.is_estimate === 'Y' ? (
                        item.matchedList !== undefined && (
                          <dl className="flex justify-between py-1">
                            <dt className="text-[13px] text-gray-700">견적서</dt>
                            <dd className="text-right text-sm font-medium text-gray-700">
                              {item.matchedList.length > 0 ? <span>매칭완료</span> : <span className="text-primary">매칭필요</span>}
                            </dd>
                          </dl>
                        )
                      ) : (
                        <dl className="flex justify-between py-1">
                          <dt className="text-[13px] text-gray-700">기안서</dt>
                          <dd className="text-right text-sm font-medium text-gray-700">
                            {item.pro_id ? (
                              <Link to={`/project/proposal/view/${item.pro_id}`} className="text-primary flex items-center gap-0.5">
                                기안서보기 <SquareArrowOutUpRight className="size-3" />
                              </Link>
                            ) : (
                              <span>-</span>
                            )}
                          </dd>
                        </dl>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" size="full" asChild>
                <Link to={`${hasFlag ? '/mypage/expense' : `/project/${projectId}/expense`}${search}`}>목록</Link>
              </Button>
            </div>
          </div>
        </>
      ) : (
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
                  <TableColumnCell className="leading-[1.4] break-keep whitespace-pre">{header.remark}</TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            )}
            {header.rej_reason && (
              <TableColumn className="border-t-0 [&_div]:text-[13px]">
                <TableColumnHeader className="w-[12%]">
                  <TableColumnHeaderCell>반려 사유</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell className="text-destructive leading-[1.4] break-keep whitespace-pre">
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
      )}

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

function HorzBar() {
  return <div className="h-4 border-t-1 border-gray-300 bg-gray-200"></div>;
}

function ExpRow({ title, value, bold }: { title: string; value: any; bold?: boolean }) {
  return (
    <dl className="flex items-center justify-between gap-2 py-1">
      <dt className="w-[20%] shrink-0 text-[13px] text-gray-700">{title}</dt>
      <dd className={cn('text-right text-[13px] font-medium break-keep', bold && 'font-semibold')}>{value}</dd>
    </dl>
  );
}
