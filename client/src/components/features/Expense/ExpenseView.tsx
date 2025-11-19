import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { formatKST, formatAmount } from '@/utils';
import { getExpenseView } from '@/api/expense';
import type { ExpenseViewDTO } from '@/api/expense';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download, Edit } from '@/assets/images/icons';
import { File, Link as LinkIcon } from 'lucide-react';

import { format } from 'date-fns';
import { statusIconMap, getLogMessage } from './utils/statusUtils';

export default function ExpenseView() {
  const { expId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ExpenseViewDTO | null>(null);
  const [loading, setLoading] = useState(true);

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

  console.log(data);

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
        <div className="flex gap-2">
          {header.status === 'Saved' && (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to={`/expense/edit/${header.exp_id}`}>
                <Edit /> 수정
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="flex min-h-140 flex-wrap justify-between pt-6 pb-12">
        <div className="w-[74%] tracking-tight">
          <div className="flex flex-wrap gap-[3%]">
            <div className="w-[31.33%]">
              <h3 className="mb-2 text-lg font-bold text-gray-800">일반 정보</h3>
              <TableColumn>
                <TableColumnHeader className="text-[13px]">
                  <TableColumnHeaderCell>비용 유형</TableColumnHeaderCell>
                  <TableColumnHeaderCell>증빙 수단</TableColumnHeaderCell>
                  <TableColumnHeaderCell>입금희망일</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody className="text-[13px]">
                  <TableColumnCell>{header.el_type}</TableColumnCell>
                  <TableColumnCell>{header.el_method}</TableColumnCell>
                  <TableColumnCell>{header.el_deposit ? formatDate(header.el_deposit) : <span>-</span>}</TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            </div>
            <div className="w-[31.33%]">
              <h3 className="mb-2 text-lg font-bold text-gray-800">계좌 정보</h3>
              <TableColumn>
                <TableColumnHeader className="text-[13px]">
                  <TableColumnHeaderCell>은행명</TableColumnHeaderCell>
                  <TableColumnHeaderCell>계좌번호</TableColumnHeaderCell>
                  <TableColumnHeaderCell>예금주</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody className="text-[13px]">
                  <TableColumnCell>
                    {header.bank_name} [{header.bank_code}]
                  </TableColumnCell>
                  <TableColumnCell>{header.bank_account}</TableColumnCell>
                  <TableColumnCell>{header.account_name}</TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            </div>

            {header.remark && (
              <div className="flex w-[31.33%] flex-col">
                <h3 className="mb-2 text-lg font-bold text-gray-800">비고</h3>
                <TableColumn className="flex-1">
                  <TableColumnHeader className="h-full text-[13px]">
                    <TableColumnHeaderCell className="h-full">비고</TableColumnHeaderCell>
                  </TableColumnHeader>
                  <TableColumnBody className="h-full text-[13px]">
                    <TableColumnCell className="h-full whitespace-pre">{header.remark}</TableColumnCell>
                  </TableColumnBody>
                </TableColumn>
              </div>
            )}
          </div>
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
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/expense')}>
              목록
            </Button>

            <Button type="button" size="sm">
              <Download /> 다운로드
            </Button>
          </div>
        </div>
        <div className="w-[24%] px-4">
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
        </div>
      </div>
    </>
  );
}
