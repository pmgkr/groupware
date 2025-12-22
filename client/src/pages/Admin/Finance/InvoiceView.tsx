import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router';
import { formatAmount, formatDate } from '@/utils';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { notificationApi } from '@/api/notification';
import { uploadFilesToServer, type InvoiceDetailDTO } from '@/api';
import { getInvoiceDetail, confirmInvoice, rejectInvoice, setInvoiceFile, delInvoiceFile } from '@/api/admin/invoice';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, Edit } from '@/assets/images/icons';

import { File, Link as LinkIcon, OctagonAlert, Files, SquareArrowOutUpRight } from 'lucide-react';

export default function InvoiceView() {
  const { seq } = useParams();
  const navigate = useNavigate();
  const { user_id } = useUser();
  const { search } = useLocation();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [data, setData] = useState<InvoiceDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false); // Dialog State
  const reasonRef = useRef<HTMLTextAreaElement | null>(null); // 반려 사유에 대한 ref

  const loadView = async () => {
    try {
      const invoice_seq = Number(seq);
      const res = await getInvoiceDetail(invoice_seq);

      setData(res);
    } catch (err) {
      console.error('❌ 인보이스 상세 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadView();
  }, [seq]);

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

  // 조회한 인보이스 데이터
  const { header, items, attachment } = data;

  console.log(data);

  const subtotal = items.reduce((s, i) => s + i.ii_amount * i.ii_qty, 0);
  const taxAmount = header.invoice_tax;
  const total = header.invoice_total;

  // 상태 라벨/색상 매핑
  const statusMap = {
    Claimed: <Badge variant="secondary">승인대기</Badge>,
    Confirmed: <Badge>승인완료</Badge>,
    Rejected: <Badge className="bg-destructive">반려됨</Badge>,
  } as const;

  const statusBadge = statusMap[header.invoice_status as keyof typeof statusMap];

  const handleConfirm = async () => {
    try {
      addDialog({
        title: '인보이스 승인',
        message: `<span class="text-primary-blue-500 font-semibold">${header.invoice_title}</span> 인보이스를 승인하시겠습니까?`,
        confirmText: '승인',
        cancelText: '취소',
        onConfirm: async () => {
          const payload = { seqs: [header.seq] };
          const res = await confirmInvoice(payload);

          if (res.ok) {
            await notificationApi.registerNotification({
              user_id: header.user_id,
              user_name: header.user_nm,
              noti_target: user_id!,
              noti_title: `${header.invoice_title}`,
              noti_message: `요청한 인보이스를 승인했습니다.`,
              noti_type: 'invoice',
              noti_url: `/project/${header.project_id}/invoice`,
            });

            addAlert({
              title: '인보이스 승인 완료',
              message: `<p><span class="text-primary-blue-500 font-semibold">${header.invoice_title}</span> 인보이스를 승인 완료했습니다.</p>`,
              icon: <OctagonAlert />,
              duration: 2000,
            });

            await loadView();
          }
        },
      });
    } catch (err) {
      console.error('❌ 승인 실패:', err);

      addAlert({
        title: '인보이스 승인 실패',
        message: `승인 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
    } finally {
      await loadView();
    }
  };

  const handleReject = async () => {
    try {
      const rawReason = reasonRef.current?.value.trim();

      const payload = { seq: data.header.seq, ...(rawReason ? { rej_reason: rawReason } : {}) };
      const res = await rejectInvoice(payload);

      if (res.status === 'Rejected') {
        await notificationApi.registerNotification({
          user_id: header.user_id,
          user_name: header.user_nm,
          noti_target: user_id!,
          noti_title: `${header.invoice_title}`,
          noti_message: `요청한 인보이스를 반려했습니다.`,
          noti_type: 'invoice',
          noti_url: `/project/${header.project_id}/invoice`,
        });

        addAlert({
          title: '인보이스 반려 완료',
          message: `<p>인보이스 반려 처리가 완료되었습니다.</p>`,
          icon: <OctagonAlert />,
          duration: 2000,
        });
      }

      setDialogOpen(false);
    } catch (err) {
      console.error('❌ 반려 실패:', err);

      addAlert({
        title: '인보이스 반려 실패',
        message: `반려 중 오류가 발생했습니다. \n잠시 후 다시 시도해주세요.`,
        icon: <OctagonAlert />,
        duration: 2000,
      });
    } finally {
      await loadView();
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
      <div className="flex min-h-140 flex-wrap justify-between pb-12">
        <div className="w-[74%] tracking-tight">
          <div className="flex w-full items-end justify-between pb-2">
            <h3 className="text-lg font-bold text-gray-800">인보이스 정보</h3>

            <div className="flex items-center text-sm text-gray-500">
              Invoice #.
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-1 h-6 leading-[1.2] text-gray-700 hover:bg-white has-[>svg]:px-1.5"
                onClick={() => copyExpId(header.invoice_id)}>
                {header.invoice_id}
                <Files className="size-3" />
              </Button>
            </div>
          </div>

          {/* 기본 정보 테이블 */}
          <TableColumn className="[&_div]:text-[13px]">
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>인보이스 제목</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.invoice_title}</TableColumnCell>
            </TableColumnBody>
          </TableColumn>
          <TableColumn className="border-t-0 [&_div]:text-[13px]">
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>프로젝트명</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>
                <Link to={`/project/${header.project_id}`} target="_blank" className="flex items-center gap-1 hover:underline">
                  {header.project_title} <SquareArrowOutUpRight className="size-3" />
                </Link>
              </TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>프로젝트 #</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody className="w-[21.33%] flex-none">
              <TableColumnCell>{header.project_id}</TableColumnCell>
            </TableColumnBody>
          </TableColumn>

          <TableColumn className="border-t-0 [&_div]:text-[13px]">
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>PO 번호</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.po_no ? header.po_no : '-'}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>담당자 이름</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.contact_nm}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>인보이스 수신</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.client_nm}</TableColumnCell>
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
              <TableColumnHeaderCell>담당자 이메일</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.contact_email}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>인보이스 상태</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{statusBadge}</TableColumnCell>
            </TableColumnBody>
          </TableColumn>

          <TableColumn className="border-t-0 [&_div]:text-[13px]">
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>작성일</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{formatDate(header.wdate)}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>담당자 연락처</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.contact_tel ? header.contact_tel : '-'}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>발행 요청 일자</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{formatDate(header.idate)}</TableColumnCell>
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
                <TableColumnCell className="text-destructive leading-[1.3]">{header.rej_reason}</TableColumnCell>
              </TableColumnBody>
            </TableColumn>
          )}

          <div className="mt-6">
            <h3 className="mb-2 text-lg font-bold text-gray-800">인보이스 항목</h3>
            <Table variant="primary" align="center" className="table-fixed">
              <TableHeader>
                <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                  <TableHead>인보이스 항목명</TableHead>
                  <TableHead className="w-[16%]">단가</TableHead>
                  <TableHead className="w-[10%]">수량</TableHead>
                  <TableHead className="w-[16%]">합계</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  return (
                    <TableRow key={item.ii_seq} className="[&_td]:text-[13px]">
                      <TableCell className="text-left">{item.ii_title}</TableCell>
                      <TableCell className="text-right">{formatAmount(item.ii_amount)}</TableCell>
                      <TableCell className="">{item.ii_qty}</TableCell>
                      <TableCell className="text-right">{formatAmount(item.ii_amount * item.ii_qty)}</TableCell>
                    </TableRow>
                  );
                })}
                {/* ---- TOTAL ---- */}
                <Summary label="Sub Total" value={`${formatAmount(subtotal)} 원`} />
                <Summary label={`TAX`} value={`${formatAmount(taxAmount)} 원`} bg="white" />
                <Summary label="Grand Total" value={`${formatAmount(total)} 원`} bg="blue" />
              </TableBody>
            </Table>
          </div>
          <div className="mt-8 flex w-full items-center justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/admin/finance/invoice${search}`)}>
                목록
              </Button>
            </div>

            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline">
                <Download /> 다운로드
              </Button>
              {header.invoice_status === 'Claimed' && (
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

        <div className="w-[24%]">
          <div className="flex justify-between">
            <h3 className="mb-2 text-lg font-bold text-gray-800">증빙자료 정보</h3>
          </div>
          <Table variant="primary" className="w-full table-fixed">
            <TableHeader>
              <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
                <TableHead>첨부파일명</TableHead>
                <TableHead className="w-[28%]">업로더</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attachment.length ? (
                attachment.map((att) => {
                  return (
                    <TableRow className="text-gray-700 [&_td]:px-2 [&_td]:text-sm">
                      <TableCell className="text-left">
                        <Link to={att.ia_url} target="_blank" className="flex items-center gap-1 hover:underline">
                          {att.ia_fname} <SquareArrowOutUpRight className="size-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">{att.uploader}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-35 text-center text-[13px] text-gray-700">
                    첨부된 증빙자료가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ---------------- 인보이스 반려 다이얼로그 ---------------- */}
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

function Summary({ label, value, bg }: { label: string; value: string; bg?: string }) {
  return (
    <TableRow
      className={cn(
        '[&_td]:text-[13px] [&_td]:font-semibold',
        bg === 'blue' ? 'bg-primary-blue-100' : bg === 'white' ? 'bg-wthie' : 'bg-gray-100'
      )}>
      <TableCell className="text-center">{label}</TableCell>
      <TableCell colSpan={2}></TableCell>
      <TableCell className="text-right">{value}</TableCell>
    </TableRow>
  );
}
