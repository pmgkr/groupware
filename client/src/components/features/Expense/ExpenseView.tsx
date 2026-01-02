import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { formatKST, formatAmount, normalizeAttachmentUrl } from '@/utils';
import { getExpenseView } from '@/api/expense';
import type { ExpenseViewDTO } from '@/api/expense';
import { getReportInfo, type ReportDTO } from '@/api/expense/proposal';
import ReportMatched from '@components/features/Project/_components/ReportMatched';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download, Edit } from '@/assets/images/icons';
import { File, Link as LinkIcon, OctagonAlert, Files } from 'lucide-react';

import { format } from 'date-fns';

export default function ExpenseView() {
  const { expId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [data, setData] = useState<ExpenseViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 기안서 조회 State
  const [selectedProposal, setSelectedProposal] = useState<ReportDTO | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getExpenseView(expId);
        setData(res);
      } catch (err) {
        console.error('❌ 비용 상세 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [expId]);

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

      console.log('리포트', res);

      if (res.report) {
        setSelectedProposal(res.report);
      } else {
        addAlert({
          title: '기안서 조회 실패',
          message: '기안서를 찾을 수 없습니다.',
          icon: <OctagonAlert />,
          duration: 1500,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="flex min-h-140 flex-wrap justify-between pb-12">
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
                      <Link to={`/expense/edit/${header.exp_id}`}>
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
                  {header.rej_reason}{' '}
                  {header.rejected_by && `- ${header.rejected_by} (${formatDate(header.edate ? header.edate : header.cdate)} 반려됨)`}
                </TableColumnCell>
              </TableColumnBody>
            </TableColumn>
          )}

          <div className="mt-6">
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
                                  href={normalizeAttachmentUrl(att.ea_url)}
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
                      <TableCell className="px-1 text-center [&_button]:rounded-xl [&_button]:border [&_button]:text-xs [&_button]:transition-none">
                        {item.pro_id ? (
                          <Button size="xs" variant="outline" onClick={() => setReportInfo(item.pro_id)}>
                            기안서보기
                          </Button>
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
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/expense${search}`)}>
                목록
              </Button>
            </div>
          </div>
        </div>
        <div className="w-[24%]">
          <div className="flex justify-between">
            <h2 className="mb-2 text-lg font-bold text-gray-800">기안서 정보</h2>
          </div>

          <ReportMatched report={selectedProposal} />
        </div>
      </div>
      {/* <div className="w-[24%] px-4">
          <h2 className="mb-2 text-lg font-bold text-gray-800">로그</h2>
          <div className="flex flex-col gap-8">
            {logs.map((log) => (
              <div
                key={`${log.idx}-${log.exp_status}`}
                className="relative before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80 first:before:hidden">
                <div className="flex items-center gap-4">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                    {statusIconMap[log.exp_status as keyof typeof statusIconMap]}
                  </span>
                  <dl className="text-base leading-[1.3] text-gray-800">
                    <dt>{getLogMessage(log)}</dt>
                    {log.exp_status === 'Rejected' ? (
                      <dd className="text-destructive text-[.88em]">반려 사유: {header.rej_reason}</dd>
                    ) : (
                      <dd className="text-[.88em] text-gray-500">
                        {formatKST(
                          log.exp_status === 'Approved'
                            ? (header.ddate ?? log.log_date)
                            : log.exp_status === 'Completed'
                              ? (header.edate ?? log.log_date)
                              : log.log_date
                        ) || '-'}
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            ))}
          </div>
        </div> */}
    </>
  );
}
