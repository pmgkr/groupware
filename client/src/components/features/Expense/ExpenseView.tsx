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
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download, Edit } from '@/assets/images/icons';
import { File, FileUp, FileCheck, FileX, Banknote, BanknoteArrowDown } from 'lucide-react';

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
      <div className="flex min-h-160 flex-wrap justify-between py-6">
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
                  <TableColumnCell>{formatDate(header.el_deposit)}</TableColumnCell>
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
                    <TableColumnCell className="h-full">{header.remark}</TableColumnCell>
                  </TableColumnBody>
                </TableColumn>
              </div>
            )}
          </div>
          <div className="mt-6">
            <h3 className="mb-2 text-lg font-bold text-gray-800">비용 항목</h3>
            <Table variant="primary" align="left" className="table-fixed">
              <TableHeader>
                <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                  <TableHead className="w-[16%]">가맹점명</TableHead>
                  <TableHead className="w-[10%] text-center">매입일자</TableHead>
                  <TableHead className="w-[14%] text-right">금액</TableHead>
                  <TableHead className="w-[14%] text-right">세금</TableHead>
                  <TableHead className="w-[14%] text-right">합계</TableHead>
                  <TableHead className="w-[22%] text-center">증빙자료</TableHead>
                  <TableHead className="w-[10%] text-center">기안서</TableHead>
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
                      <TableCell className="text-left">
                        {item.attachments && item.attachments.length > 0 ? (
                          <ul>
                            {item.attachments.map((att, idx) => (
                              <li key={idx} className="overflow-hidden px-4 text-sm text-gray-800">
                                <a
                                  href={`https://gbend.cafe24.com/uploads/nexpense/${att.ea_sname}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex max-w-full items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap hover:underline">
                                  <File className="size-3.5" />
                                  {att.ea_fname}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">+</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-bold">총 비용</TableCell>
                  <TableCell className="text-center"></TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-center"></TableCell>
                  <TableCell className="text-center"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="w-[24%] rounded-xl px-4">
          <h2 className="mb-2 text-lg font-bold text-gray-800">로그</h2>
          <ul className="flex flex-col gap-8">
            <li className="relative flex items-center gap-4">
              <span className="flex size-8 items-center justify-center rounded-[50%] bg-white ring-1 ring-gray-300">
                <FileUp className="text-primary-blue size-4.5" />
              </span>
              <dl className="text-base leading-[1.3] text-gray-800">
                <dt>
                  <strong>{header.user_nm}</strong>님이 비용을 저장했습니다.
                </dt>
                <dd className="text-[.88em] text-gray-500">{formatKST(header.wdate)}</dd>
              </dl>
            </li>
            <li className="relative flex items-center gap-4 before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80">
              <span className="flex size-8 items-center justify-center rounded-[50%] bg-white ring-1 ring-gray-300">
                <FileCheck className="text-primary-blue size-4.5" />
              </span>
              <dl className="text-base leading-[1.3] text-gray-800">
                <dt>
                  <strong>{header.manager_nm}</strong>님이 비용을 승인했습니다.
                </dt>
                <dd className="text-[.88em] text-gray-500">2025-10-28 15:33:00</dd>
              </dl>
            </li>

            <li className="relative flex items-center gap-4 before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80">
              <span className="flex size-8 items-center justify-center rounded-[50%] bg-white ring-1 ring-gray-300">
                <Banknote className="text-primary-blue size-4.5" />
              </span>
              <dl className="text-base leading-[1.3] text-gray-800">
                <dt>
                  비용 <span className="text-primary-blue-500">지급 대기</span>로 상태가 변경되었습니다.
                </dt>
                <dd className="text-[.88em] text-gray-500">지급 예정일자 : 2025-11-14</dd>
              </dl>
            </li>
            <li className="relative flex items-center gap-4 before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80">
              <span className="flex size-8 items-center justify-center rounded-[50%] bg-white ring-1 ring-gray-300">
                <BanknoteArrowDown className="text-primary-blue size-4.5" />
              </span>
              <dl className="text-base leading-[1.3] text-gray-800">
                <dt>파이낸스에서 비용이 지급되었습니다.</dt>
                <dd className="text-[.88em] text-gray-500">2025-11-14 13:00:00</dd>
              </dl>
            </li>
            <li className="relative flex items-center gap-4 before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80">
              <span className="flex size-8 items-center justify-center rounded-[50%] bg-white ring-1 ring-gray-300">
                <FileX className="text-primary-blue size-4.5" />
              </span>
              <dl className="text-base leading-[1.3] text-gray-800">
                <dt>
                  <strong>김강호</strong>님이 비용이 <span className="text-destructive">반려</span>했습니다.
                </dt>
                <dd className="text-destructive block text-[.88em]">반려사유 : 증빙자료 누락</dd>
              </dl>
            </li>
            <li className="relative flex items-center gap-4 before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80">
              <span className="flex size-8 items-center justify-center rounded-[50%] bg-white ring-1 ring-gray-300">
                <FileX className="text-primary-blue size-4.5" />
              </span>
              <dl className="text-base leading-[1.3] text-gray-800">
                <dt>
                  <strong>김지효</strong>님이 비용이 <span className="text-destructive">반려</span>했습니다.
                </dt>
                <dd className="text-destructive block text-[.88em]">반려사유 : 증빙자료 누락</dd>
              </dl>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
