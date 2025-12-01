import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { formatKST, formatAmount } from '@/utils';
import {
  getProjectExpenseView,
  type pExpenseViewDTO,
  getEstimateInfo,
  type EstimateHeaderView,
  getEstimateItemsInfo,
  type EstimateItemsView,
} from '@/api';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Download, Edit } from '@/assets/images/icons';
import { File, Link as LinkIcon } from 'lucide-react';

import { format } from 'date-fns';
import { statusIconMap, getLogMessage } from '../Expense/utils/statusUtils';
import EstimateMatching from './_components/EstimateMatching';

export interface estViewMatchDTO {
  header: EstimateHeaderView;
  items: EstimateItemsView[];
}

export default function projectExpenseView() {
  const { expId, projectId } = useParams();
  const navigate = useNavigate();

  // 비용 데이터 State
  const [data, setData] = useState<pExpenseViewDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // 견적서 다이얼로그 State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [estLoading, setEstLoading] = useState(false);
  const [estData, setEstData] = useState<estViewMatchDTO | null>(null);

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

  // ----------------------------------------
  // 견적서 불러오기 핸들러
  // ----------------------------------------

  const handleEstimateInfo = async () => {
    setDialogOpen(true);
    setEstLoading(true);

    try {
      const raw = await getEstimateInfo(projectId);
      const header = raw.result?.[0] ?? null;
      const rawItems = await getEstimateItemsInfo(header.est_id);
      const estItems = rawItems.result ?? [];

      setEstData({ header: header, items: estItems });
    } catch (err) {
      console.error('❌ 비용 상세 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  console.log('estData', estData);

  return (
    <>
      <div className="flex min-h-140 flex-wrap justify-between pb-12">
        <div className="w-[74%] tracking-tight">
          <div className="flex w-full items-end justify-between pb-2">
            <h3 className="text-lg font-bold text-gray-800">비용 정보</h3>
            {header.status === 'Saved' && (
              <Button
                type="button"
                variant="transparent"
                title="비용 수정"
                size="sm"
                asChild
                className="h-auto gap-1 text-gray-600 hover:text-gray-700 has-[>svg]:px-1">
                <Link to={`/project/${projectId}/expense/edit/${header.seq}`}>
                  <Edit className="size-4.5" />
                </Link>
              </Button>
            )}
          </div>
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
              <TableColumnHeaderCell>작성자</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.user_nm}</TableColumnCell>
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
              <TableColumnCell className="py-0">{status}</TableColumnCell>
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
              <TableColumnHeaderCell>비용 타입</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.is_estimate === 'Y' ? '견적서 비용' : '견적서 외 비용'}</TableColumnCell>
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
              <TableColumnHeaderCell>예금주</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{header.account_name}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[12%]">
              <TableColumnHeaderCell>입금 희망일</TableColumnHeaderCell>
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
                <TableColumnCell className="whitespace-pre">{header.remark}</TableColumnCell>
              </TableColumnBody>
            </TableColumn>
          )}

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
                                  href={`${import.meta.env.VITE_API_ORIGIN}/uploads/pexpense/${att.ea_sname}`}
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
            <div className="mt-8 flex w-full items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/project/${projectId}/expense`)}>
                목록
              </Button>

              <Button type="button" size="sm">
                <Download /> 다운로드
              </Button>
            </div>
          </div>
        </div>

        <div className="w-[24%]">
          <div className="flex justify-between">
            <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 매칭</h2>
            <Button type="button" size="sm" className="px-2.5" onClick={handleEstimateInfo}>
              견적서 불러오기
            </Button>
          </div>
          <EstimateMatching />
        </div>
      </div>

      {/* ---------------- 견적서 불러오기 다이얼로그 ---------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>견적서 불러오기</DialogTitle>
            <DialogDescription>비용을 매칭할 견적서 항목을 선택해 주세요.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col">
            {estData &&
              (() => {
                const getBudgetPercent = ((estData.header.est_budget / estData.header.est_amount) * 100).toFixed(2);
                return (
                  <>
                    <TableColumn className="[&_div]:text-[13px]">
                      <TableColumnHeader className="w-[18%]">
                        <TableColumnHeaderCell>견적서 제목</TableColumnHeaderCell>
                      </TableColumnHeader>
                      <TableColumnBody>
                        <TableColumnCell className="leading-[1.3]">{estData.header.est_title}</TableColumnCell>
                      </TableColumnBody>
                      <TableColumnHeader className="w-[18%]">
                        <TableColumnHeaderCell>가용 예산 / 견적서 총액</TableColumnHeaderCell>
                      </TableColumnHeader>
                      <TableColumnBody>
                        <TableColumnCell>
                          {formatAmount(estData.header.est_budget)} / {formatAmount(estData.header.est_amount)}{' '}
                          <span className="ml-1 font-bold">({getBudgetPercent}%)</span>
                        </TableColumnCell>
                      </TableColumnBody>
                    </TableColumn>

                    <Table variant="primary" align="center" className="mt-4 table-fixed">
                      <TableHeader>
                        <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                          <TableHead className="text-left">항목명</TableHead>
                          <TableHead className="w-[10%]">단가</TableHead>
                          <TableHead className="w-[8%]">수량</TableHead>
                          <TableHead className="w-[10%]">금액</TableHead>
                          <TableHead className="w-[10%]">가용 금액</TableHead>
                          <TableHead className="w-[24%]">비고</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {estData.items.map((item) => (
                          <TableRow key={item.seq} className="[&_td]:text-[13px]">
                            <TableCell className="text-left">{item.item_name}</TableCell>
                            <TableCell className="text-right">{formatAmount(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{item.qty}</TableCell>
                            <TableCell className="text-right">{formatAmount(item.amount)}</TableCell>
                            <TableCell className="text-right">{formatAmount(item.ava_amount)}</TableCell>
                            <TableCell>{item.remark}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                );
              })()}
          </div>
          <DialogFooter className="justify-center">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button type="button">등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
