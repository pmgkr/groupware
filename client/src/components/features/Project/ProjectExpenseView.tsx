import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { formatKST, formatAmount } from '@/utils';
import { getProjectExpenseView, type pExpenseViewDTO } from '@/api';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download, Edit } from '@/assets/images/icons';
import { File, Link as LinkIcon } from 'lucide-react';

import { format } from 'date-fns';
import { statusIconMap, getLogMessage } from '../Expense/utils/statusUtils';
import EstimateMatching from './_components/EstimateMatching';

export default function projectExpenseView() {
  const { expId, projectId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<pExpenseViewDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getProjectExpenseView(expId);
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

  const { header, items } = data;

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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-950">{header.el_title}</h1>
          {/* <ul className="itmes-center flex gap-2 text-base text-gray-500">
            <li>{formatKST(header.wdate)}</li>
          </ul> */}
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
                  <TableColumnHeaderCell>작성자</TableColumnHeaderCell>
                  <TableColumnHeaderCell>증빙 수단</TableColumnHeaderCell>
                  <TableColumnHeaderCell>입금희망일</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody className="text-[13px]">
                  <TableColumnCell>{header.user_nm}</TableColumnCell>
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

            <div className="flex w-[31.33%] flex-col">
              <h3 className="mb-2 text-lg font-bold text-gray-800">비고</h3>
              <TableColumn className="flex-1">
                <TableColumnHeader className="h-full text-[13px]">
                  <TableColumnHeaderCell className="h-[33.33%]">비용 상태</TableColumnHeaderCell>
                  <TableColumnHeaderCell className="h-[66.66%]">비고</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody className="h-full text-[13px]">
                  <TableColumnCell className="h-[33.33%]">{status}</TableColumnCell>
                  <TableColumnCell className="h-[66.66%] whitespace-pre">{header.remark}</TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="mb-2 text-lg font-bold text-gray-800">비용 항목</h3>
            <Table variant="primary" align="center" className="table-fixed">
              <TableHeader>
                <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                  <TableHead className="w-[10%]">비용유형</TableHead>
                  <TableHead className="w-[20%]">가맹점명</TableHead>
                  <TableHead className="w-[10%] px-4">매입일자</TableHead>
                  <TableHead className="w-[14%]">금액</TableHead>
                  <TableHead className="w-[10%]">세금</TableHead>
                  <TableHead className="w-[14%]">합계</TableHead>
                  <TableHead className="w-[20%]">증빙자료</TableHead>
                  <TableHead className="w-[8%]">기안서</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  return (
                    <TableRow key={item.seq} className="[&_td]:text-[13px]">
                      <TableCell>{item.ei_type}</TableCell>
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
                          <Link to={`/project/proposal/${item.pro_id}`} target="_blank" rel="noopener noreferrer">
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
                  <TableCell className="font-semibold">총 비용 (A)</TableCell>
                  <TableCell className="text-left"></TableCell>
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
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/project/${projectId}/expense`)}>
              목록
            </Button>

            <Button type="button" size="sm">
              <Download /> 다운로드
            </Button>
          </div>
        </div>
        <div className="w-[24%]">
          <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 매칭</h2>
          <EstimateMatching />
        </div>
      </div>
    </>
  );
}
