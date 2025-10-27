import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { formatKST, formatAmount } from '@/utils';
import { getExpenseView, type ExpenseViewDTO } from '@/api';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@components/ui/alert-dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Edit } from '@/assets/images/icons';

import { format } from 'date-fns';

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

  const { header, items } = data;

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
      <div className="min-h-160">
        <div className="flex items-end justify-between border-b border-b-gray-300 pb-2">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-950">
              [{header.el_method}] {header.el_title} {status}
            </h1>
            <ul className="itmes-center flex gap-2 text-base text-gray-500">
              <li className="text-gray-600">{header.exp_id}</li>
              <li className="before:mr-2 before:inline-flex before:h-[3px] before:w-[3px] before:rounded-[50%] before:bg-gray-400 before:align-middle">
                {header.user_nm}
              </li>
              <li className="before:mr-2 before:inline-flex before:h-[3px] before:w-[3px] before:rounded-[50%] before:bg-gray-400 before:align-middle">
                {formatKST(header.wdate)}
              </li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm">
              <Edit /> 수정
            </Button>
            <Button type="button" variant="outline" size="sm">
              <Download /> 다운로드
            </Button>
          </div>
        </div>
        <div className="my-8 grid grid-cols-3 gap-6 tracking-tight">
          <div>
            <h3 className="text-lg font-bold text-gray-800">일반 정보</h3>
            <dl className="flex text-base text-gray-700 [&_dt]:w-[33%] [&_dt]:shrink-0">
              <dt>비용 유형</dt>
              <dd>{header.el_type}</dd>
            </dl>
            <dl className="flex text-base text-gray-700 [&_dt]:w-[33%] [&_dt]:shrink-0">
              <dt>작성자</dt>
              <dd>{header.user_nm}</dd>
            </dl>
            <dl className="flex text-base text-gray-700 [&_dt]:w-[33%] [&_dt]:shrink-0">
              <dt>승인자</dt>
              <dd>{header.manager_nm}</dd>
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">계좌 정보</h3>
            <dl className="flex text-base text-gray-700 [&_dt]:w-[33%]">
              <dt>은행명</dt>
              <dd>
                {header.bank_name} [{header.bank_code}]
              </dd>
            </dl>
            <dl className="flex text-base text-gray-700 [&_dt]:w-[33%]">
              <dt>계좌번호</dt>
              <dd>{header.bank_account}</dd>
            </dl>
            <dl className="flex text-base text-gray-700 [&_dt]:w-[33%]">
              <dt>예금주</dt>
              <dd>{header.account_name}</dd>
            </dl>
            <dl className="flex text-base text-gray-700 [&_dt]:w-[33%]">
              <dt>입금희망일</dt>
              <dd>{formatDate(header.el_deposit)}</dd>
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">로그</h3>
            <dl>
              <dt></dt>
            </dl>
          </div>
        </div>
        <div>
          <Table variant="primary" align="left" className="teble-fixed">
            <TableHeader>
              <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                <TableHead className="w-[18%]">가맹점명</TableHead>
                <TableHead className="w-[10%] text-center">매입일자</TableHead>
                <TableHead className="w-[14%] text-right">금액</TableHead>
                <TableHead className="w-[14%] text-right">세금</TableHead>
                <TableHead className="w-[14%] text-right">합계</TableHead>
                <TableHead className="text-center">증빙자료</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                return (
                  <TableRow key={item.seq} className="[&_td]:text-[13px]">
                    <TableCell>{item.ei_title}</TableCell>
                    <TableCell className="text-center">{formatDate(item.ei_pdate)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.ei_amount)}원</TableCell>
                    <TableCell className="text-right">{item.ei_tax === 0 ? 0 : `${formatAmount(item.ei_tax)}원`}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.ei_total)}원</TableCell>
                    <TableCell className="text-center"></TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell className="font-bold">총 비용</TableCell>
                <TableCell className="text-center">-</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-center">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
