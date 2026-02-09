import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { formatAmount, formatDate, normalizeAttachmentUrl } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';

import { getExpenseView } from '@/api/expense';
import type { ExpenseViewDTO } from '@/api/expense';
import { getReportInfo, type ReportDTO } from '@/api/expense/proposal';
import ReportMatched from '@components/features/Project/_components/ReportMatched';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Edit } from '@/assets/images/icons';
import { File, Link as LinkIcon, OctagonAlert, Files, SquareArrowOutUpRight } from 'lucide-react';

export default function ExpenseView() {
  const { expId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const isMobile = useIsMobileViewport();

  const { addAlert } = useAppAlert();

  const [data, setData] = useState<ExpenseViewDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // 기안서 조회 State
  const [selectedProposal, setSelectedProposal] = useState<ReportDTO | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

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
      <Badge variant="grayish" size={isMobile ? 'md' : 'table'}>
        임시저장
      </Badge>
    ),
    Claimed: (
      <Badge variant="secondary" size={isMobile ? 'md' : 'table'}>
        승인대기
      </Badge>
    ),
    Confirmed: <Badge size={isMobile ? 'md' : 'table'}>승인완료</Badge>,
    Approved: (
      <Badge className="bg-primary-blue/80" size={isMobile ? 'md' : 'table'}>
        지급대기
      </Badge>
    ),
    Completed: (
      <Badge className="bg-primary-blue" size={isMobile ? 'md' : 'table'}>
        지급완료
      </Badge>
    ),
    Rejected: (
      <Badge className="bg-destructive" size={isMobile ? 'md' : 'table'}>
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

  // 마이페이지 > 비용 내역에서 넘어왔는 지 파악
  const hasFlag = new URLSearchParams(search).has('flag');

  return (
    <>
      {isMobile ? (
        <>
          <div className="-mx-5 -my-6 bg-white">
            <div className="p-5 tracking-tight">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[13px] text-gray-600" onClick={() => copyExpId(header.exp_id)}>
                  EXP #{header.exp_id} <Files className="size-3" />
                </span>
                {status}
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
                  console.log('항목', item);
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

                      <dl className="flex justify-between py-1">
                        <dt className="text-[13px] text-gray-700">기안서</dt>
                        <dd className="text-right text-sm font-medium text-gray-700">
                          {item.pro_id ? (
                            <Link to={`/expense/proposal/view/${item.pro_id}`} className="text-primary flex items-center gap-0.5">
                              기안서보기 <SquareArrowOutUpRight className="size-3" />
                            </Link>
                          ) : (
                            <span>-</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" size="full" asChild>
                <Link to={`${hasFlag ? '/mypage/expense' : '/expense'}${search}`}>목록</Link>
              </Button>
            </div>
          </div>
        </>
      ) : (
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
                    <TableHead className="w-[18%]">증빙자료</TableHead>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`${hasFlag ? '/mypage/expense' : '/expense'}${search}`)}>
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
      )}
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
