import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { notificationApi } from '@/api/notification';
import { type pExpenseViewDTO } from '@/api/project/expense';
import { getManagerExpenseView, confirmExpense, rejectExpense } from '@/api/manager/pexpense';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { statusIconMap, getLogMessage } from '@/components/features/Expense/utils/statusUtils';
import { formatKST, formatAmount } from '@/utils';
import { format } from 'date-fns';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download } from '@/assets/images/icons';
import { File, Link as LinkIcon, OctagonAlert, Files } from 'lucide-react';

export default function PexpenseView() {
  const { expId } = useParams();
  const { user_id } = useUser();
  const navigate = useNavigate();
  const { search } = useLocation();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<pExpenseViewDTO | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false); // Dialog State
  const reasonRef = useRef<HTMLTextAreaElement | null>(null); // 반려 사유에 대한 ref

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getManagerExpenseView(expId);

        console.log(res);
        setData(res);
      } catch (err) {
        console.error('❌ 비용 상세 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [expId, refreshKey]);

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

  const { header, items, logs } = data;

  // .총 비용 계산
  const totals = items.reduce(
    (acc, item) => {
      acc.amount += item.ei_amount || 0;
      acc.tax += item.ei_tax || 0;
      acc.total += item.ei_total || 0;
      return acc;
    },
    { amount: 0, tax: 0, total: 0 }
  );

  // 비용 상태별 Badge 맵핑
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

  const status = statusMap[header.status as keyof typeof statusMap];

  const handleConfirm = () => {
    addDialog({
      title: '비용 승인',
      message: `<span class="text-primary-blue-500 font-semibold">${data.header.el_title}</span> 비용을 승인하시겠습니까?`,
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
              noti_message: `청구한 비용을 승인했습니다.`,
              noti_type: 'expense',
              noti_url: `/expense/${data.header.exp_id}`,
            });

            addAlert({
              title: '비용 승인 완료',
              message: `<p><span class="text-primary-blue-500 font-semibold">${res.updated_count}</span>건의 비용이 승인 완료되었습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });
          }

          setRefreshKey((prev) => prev + 1);
        } catch (err) {
          console.error('❌ 승인 실패:', err);

          addAlert({
            title: '비용 승인 실패',
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
          noti_message: `청구한 비용을 반려했습니다.`,
          noti_type: 'expense',
          noti_url: `/expense/${data.header.exp_id}`,
        });

        addAlert({
          title: '비용 반려 완료',
          message: `<p>비용 반려 처리가 완료되었습니다.</p>`,
          icon: <OctagonAlert />,
          duration: 2000,
        });
      }

      setDialogOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('❌ 승인 실패:', err);

      addAlert({
        title: '비용 승인 실패',
        message: `승인 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
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

  return (
    <>
      <div className="flex items-end justify-between border-b border-b-gray-300 pb-2">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-950">
            [{header.el_method}] {header.el_title} {status}
          </h1>
          <ul className="itmes-center flex gap-2 text-base text-gray-500">
            <li className="text-gray-700">{header.exp_id}</li>
            <li className="before:mr-2 before:inline-flex before:h-[3px] before:w-[3px] before:rounded-[50%] before:bg-gray-400 before:align-middle">
              {header.user_nm}
            </li>
            <li className="before:mr-2 before:inline-flex before:h-[3px] before:w-[3px] before:rounded-[50%] before:bg-gray-400 before:align-middle">
              {formatKST(header.wdate)}
            </li>
          </ul>
        </div>
      </div>
      <div className="flex min-h-140 flex-wrap justify-between pt-6 pb-12">
        <div className="w-[74%] tracking-tight">
          <div className="w-full items-end justify-between pb-2">
            <h3 className="text-lg font-bold text-gray-800">비용 정보</h3>
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
              <TableColumnCell>{status}</TableColumnCell>
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
              <TableColumnHeaderCell>비용 아이디</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-[4px] leading-[1.2] hover:bg-gray-200/80 has-[>svg]:px-1.5"
                  onClick={() => copyExpId(header.exp_id)}>
                  {header.exp_id}
                  <Files className="size-3" />
                </Button>
              </TableColumnCell>
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
          <div className="mt-12">
            <h3 className="mb-2 text-lg font-bold text-gray-800">비용 항목</h3>
            <Table variant="primary" align="center" className="table-fixed">
              <TableHeader>
                <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                  <TableHead className="w-[20%]">가맹점명</TableHead>
                  <TableHead className="w-[10%] px-4">매입일자</TableHead>
                  <TableHead className="w-[14%]">금액</TableHead>
                  <TableHead className="w-[10%]">세금</TableHead>
                  <TableHead className="w-[14%]">합계</TableHead>
                  <TableHead className="w-[24%]">증빙자료</TableHead>
                  <TableHead className="w-[8%]">기안서</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  return (
                    <TableRow key={item.seq} className="[&_td]:text-[13px]">
                      <TableCell>{item.ei_title}</TableCell>
                      <TableCell className="px-4">{formatDate(item.ei_pdate)}</TableCell>
                      <TableCell className="text-right">{formatAmount(item.ei_amount)}원</TableCell>
                      <TableCell className="text-right">{item.ei_tax === 0 ? 0 : `${formatAmount(item.ei_tax)}원`}</TableCell>
                      <TableCell className="text-right">{formatAmount(item.ei_total)}원</TableCell>
                      {item.attachments && item.attachments.length > 0 ? (
                        <TableCell>
                          <ul>
                            {item.attachments.map((att, idx) => (
                              <li key={idx} className="overflow-hidden text-sm text-gray-800">
                                <a
                                  href={`${import.meta.env.VITE_API_ORIGIN}/uploads/nexpense/${att.ea_sname}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1">
                                  <File className="size-3.5 shrink-0" />
                                  <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap hover:underline">
                                    {att.ea_fname}
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                      ) : (
                        <TableCell>-</TableCell>
                      )}
                      <TableCell>
                        {item.pro_id ? (
                          <Link to={`/expense/proposal/${item.pro_id}`} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mx-auto size-4" />
                          </Link>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-primary-blue-50">
                  <TableCell className="font-semibold">총 비용</TableCell>
                  <TableCell className="text-left"></TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.amount)}원</TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.tax)}원</TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.total)}원</TableCell>
                  <TableCell className="text-left"></TableCell>
                  <TableCell className="text-left"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="mt-8 flex w-full items-center justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/manager/nexpense${search}`)}>
                목록
              </Button>
            </div>

            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline">
                <Download /> 다운로드
              </Button>
              {data.header.status === 'Claimed' && (
                <>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setDialogOpen(true)}>
                    반려하기
                  </Button>
                  <Button type="button" size="sm" onClick={handleConfirm}>
                    승인하기
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 증빙 사유 다이얼로그 ---------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>비용 반려</DialogTitle>
            <DialogDescription>비용을 반려하기 전에, 필요 시 반려 사유를 입력해 주세요.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Textarea ref={reasonRef} placeholder="반려 사유를 입력해 주세요" className="h-16 min-h-16" />
          </div>
          <DialogFooter className="justify-center">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
