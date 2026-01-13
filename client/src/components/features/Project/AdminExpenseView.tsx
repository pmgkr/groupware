import { useRef, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router';
import { formatAmount, sanitizeFilename } from '@/utils';
import { useUser } from '@/hooks/useUser';
import { format } from 'date-fns';
import { notificationApi } from '@/api/notification';
import { getReportInfo, type ReportDTO } from '@/api/expense/proposal';
import { getAdminExpenseView, confirmExpense, rejectExpense, getPDFDownload } from '@/api/admin/pexpense';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Edit } from '@/assets/images/icons';

import { useProjectExpenseMatching } from './hooks/useProjectExpenseMatching';

import EstimateMatching from './_components/EstimateMatching';
import EstimateMatched from './_components/EstimateMatched';
import ExpenseViewRow from './_components/ExpenseViewRow';
import ExpenseViewEstRow from './_components/ExpenseViewEstRow';
import ReportMatched from './_components/ReportMatched';
import { triggerDownload } from '@components/features/Project/utils/download';

import { File, Link as LinkIcon, OctagonAlert, Files, SquareArrowOutUpRight } from 'lucide-react';

export default function ProjectExpenseView() {
  const { expId, projectId } = useParams();
  const navigate = useNavigate();
  const { user_id } = useUser();
  const { search } = useLocation();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [reasonDialogOpen, setReasonDialogOpen] = useState(false); // Dialog State
  const reasonRef = useRef<HTMLTextAreaElement | null>(null); // 반려 사유에 대한 ref
  const [refreshKey, setRefreshKey] = useState(0);

  // 기안서 조회 State
  const [selectedProposal, setSelectedProposal] = useState<ReportDTO | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  /** -----------------------------------------
   *  핵심 매칭 로직 공유 훅
   ----------------------------------------- */
  const {
    data,
    loading,
    refresh,

    expenseInfo,
    matchedItems,
    dbMatchedItems,
    matchedMap,

    openDialog,
    openEstimateDialog,

    completeMatching,
    resetMatching,
    clearMatching,

    loadMatchedItems,
    deleteMatching,

    selectedExpSeq,
    setSelectedEstId,
  } = useProjectExpenseMatching(expId, getAdminExpenseView);

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

  const { header, items, project } = data;

  /** -----------------------------------------
   *  상태 Badge
   ----------------------------------------- */
  const statusMap = {
    Saved: (
      <Badge variant="grayish" size="table">
        임시저장
      </Badge>
    ),
    Claimed: (
      <Badge variant="secondary" size="table">
        승인대기
      </Badge>
    ),
    Confirmed: <Badge size="table">승인완료</Badge>,
    Approved: (
      <Badge className="bg-primary-blue/80" size="table">
        지급대기
      </Badge>
    ),
    Completed: (
      <Badge className="bg-primary-blue" size="table">
        지급완료
      </Badge>
    ),
    Rejected: (
      <Badge className="bg-destructive" size="table">
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

  const handleConfirm = () => {
    addDialog({
      title: '비용 지급 승인',
      message: `<span class="text-primary-blue-500 font-semibold">${data.header.el_title}</span> 비용을 지급 하시겠습니까?`,
      confirmText: '승인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const payload = { seqs: [data.header.seq] };
          const res = await confirmExpense(payload);

          if (res.ok) {
            await notificationApi.registerNotification({
              user_id: data.header.user_id,
              user_name: data.header.user_nm,
              noti_target: user_id!,
              noti_title: `${data.header.exp_id} · ${data.header.el_title}`,
              noti_message: `청구한 비용이 지급 완료됐습니다.`,
              noti_type: 'expense',
              noti_url: `/project/${data.header.project_id}/expense/${data.header.seq}`,
            });

            addAlert({
              title: '비용 지급 승인 완료',
              message: `<p><span class="text-primary-blue-500 font-semibold">${res.updated_count}</span>건의 비용이 지급 완료되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }

          refresh();
        } catch (err) {
          console.error('❌ 승인 실패:', err);

          addAlert({
            title: '비용 지급 승인 실패',
            message: `승인 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        }
      },
    });
  };

  const handleReject = async () => {
    try {
      const rawReason = reasonRef.current?.value.trim();

      const payload = { seq: data.header.seq, ...(rawReason ? { reason: rawReason } : {}) };
      const res = await rejectExpense(payload);

      if (res.status === 'Rejected') {
        await notificationApi.registerNotification({
          user_id: data.header.user_id,
          user_name: data.header.user_nm,
          noti_target: user_id!,
          noti_title: `${data.header.exp_id} · ${data.header.el_title}`,
          noti_message: `청구한 비용이 반려됐습니다.`,
          noti_type: 'expense',
          noti_url: `/project/${data.header.project_id}/expense/${data.header.seq}`,
        });

        addAlert({
          title: '비용 반려 완료',
          message: `<p>비용 반려 처리가 완료되었습니다.</p>`,
          icon: <OctagonAlert />,
          duration: 2000,
        });
      }

      setReasonDialogOpen(false);
      refresh();
    } catch (err) {
      console.error('❌ 승인 실패:', err);

      addAlert({
        title: '비용 지급 승인 실패',
        message: `승인 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
      refresh();
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

  const handlePDFDownload = async (seq: number, expId: string, userName: string) => {
    try {
      const res = await getPDFDownload(seq);

      const rawFilename = `${expId}_${userName}.pdf`;
      const filename = sanitizeFilename(rawFilename);

      const blob = await res.blob();
      triggerDownload(blob, filename);
    } catch (e) {
      console.error('❌ PDF 다운로드 실패:', e);
    }
  };

  return (
    <>
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
              <TableColumnCell>{header.el_title}</TableColumnCell>
            </TableColumnBody>
          </TableColumn>

          <TableColumn className="border-t-0 [&_div]:text-[13px]">
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>프로젝트명</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>
                <Link to={`/project/${header.project_id}`} target="_blank" className="inline hover:underline">
                  [{project.project_id}] {project.project_title} <SquareArrowOutUpRight className="inline size-3" />
                </Link>
              </TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>클라이언트</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody className="w-[21.33%] flex-none">
              <TableColumnCell>{project.client_nm}</TableColumnCell>
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
              <TableColumnHeaderCell>작성일</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{formatDate(header.wdate)}</TableColumnCell>
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
              <TableColumnHeaderCell>입금희망일</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.el_deposit ? formatDate(header.el_deposit) : <span>-</span>}</TableColumnCell>
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
                  {header.rej_reason} {header.rejected_by && `- ${header.rejected_by}`}
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

                <TableRow className="bg-primary-blue-50 hover:bg-primary-blue-50 [&_td]:py-3">
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

          <div className="mt-8 flex w-full items-center justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/admin/finance${search}`}>목록</Link>
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handlePDFDownload(header.seq, header.exp_id, header.user_nm)}>
                <Download /> 다운로드
              </Button>
              {header.status !== 'Saved' && header.status !== 'Rejected' && (
                <Button type="button" size="sm" variant="destructive" onClick={() => setReasonDialogOpen(true)}>
                  반려하기
                </Button>
              )}
              {header.status !== 'Saved' && header.status !== 'Completed' && header.status !== 'Rejected' && (
                <Button type="button" size="sm" onClick={handleConfirm}>
                  승인하기
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ---------------------- Right: 매칭 영역 ---------------------- */}
        <div className="w-[24%]">
          {data.header.is_estimate === 'Y' ? (
            <>
              <div className="flex justify-between">
                <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 매칭</h2>
              </div>

              {dbMatchedItems.length > 0 ? (
                <EstimateMatched items={dbMatchedItems} project_id={header.project_id} />
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

      {/* ---------------- 증빙 사유 다이얼로그 ---------------- */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>비용 반려</DialogTitle>
            <DialogDescription>비용을 반려하기 전에, 필요 시 반려 사유를 입력해 주세요.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Textarea ref={reasonRef} placeholder="반려 사유를 입력해 주세요" className="h-16 min-h-16" />
          </div>
          <DialogFooter className="justify-center">
            <Button type="button" variant="outline" onClick={() => setReasonDialogOpen(false)}>
              취소
            </Button>
            <Button type="button" variant="destructive" onClick={handleReject}>
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
