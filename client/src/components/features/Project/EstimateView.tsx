import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { Link, useOutletContext, useNavigate, useParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { getEstimateView, type EstimateViewDTO } from '@/api';
import { formatKST, formatAmount, displayUnitPrice, normalizeAttachmentUrl } from '@/utils';

import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import ExpenseItemDialog from './_components/ExpenseItemDialog';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';

import { format } from 'date-fns';
import { OctagonAlert, Paperclip, MessageSquareMore, Link as LinkIcon } from 'lucide-react';
import { Download } from '@/assets/images/icons';

export default function EstimateView() {
  const navigate = useNavigate();
  const { user_id } = useUser();
  const { estId, projectId } = useParams();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const [loading, setLoading] = useState(true);
  const { data, members } = useOutletContext<ProjectLayoutContext>();
  const [estData, setEstData] = useState<EstimateViewDTO | null>(null);
  const [seletedEstId, setSelectedEstId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false); // 매칭된 비용 항목 Dialog State

  const leftRef = useRef<HTMLDivElement>(null); // 견적서 정보 useRef
  const rightRef = useRef<HTMLDivElement>(null); // 견적서 증빙 useRef

  useLayoutEffect(() => {
    const sync = () => {
      if (!leftRef.current || !rightRef.current) return;
      rightRef.current.style.height = `${leftRef.current.offsetHeight}px`;
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [estData]);

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getEstimateView(estId);
        setEstData(res);
      } catch (err) {
        console.error('❌ 견적 상세 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [estId]);

  const hasGrandTotal = useMemo(() => {
    return estData?.items.some((row) => row.ei_type === 'grandtotal') ?? true;
  }, [estData]);

  // 견적서에 'grandtotal' 항목이 없는 경우 자체 생성
  const viewItems = useMemo(() => {
    if (!estData) return [];
    if (hasGrandTotal) return estData.items;

    return [
      ...estData.items,
      {
        seq: -1,
        ei_type: 'grandtotal',
        ei_name: 'Grand Total',
        amount: 0,
        unit_price: 0,
        qty: 0,
        ava_amount: 0,
        match_count: 0,
        remark: '',
      },
    ];
  }, [estData, hasGrandTotal]);

  const isProjectMember = useMemo(() => members.some((m) => m.user_id === user_id), [members, user_id]);

  if (!estData)
    return (
      <div className="p-6 text-center text-gray-500">
        견적서를 찾을 수 없습니다.
        <div className="mt-4">
          <Button onClick={() => navigate(-1)} variant="secondary">
            뒤로가기
          </Button>
        </div>
      </div>
    );

  console.log('데이터 ', data);
  console.log('견적서 데이터 ', estData);

  const handleEstEdit = () => {
    addDialog({
      title: '견적서를 수정하시겠습니까?',
      message: '수정 시, 증빙 자료 업로드 또는 증빙 사유 입력이 필수입니다.',
      confirmText: '수정',
      cancelText: '취소',
      onConfirm: async () => {
        navigate(`/project/${projectId}/estimate/${estId}/edit`);
      },
    });
  };

  // 가용금액 옆 링크 버튼 클릭 시, 매칭된 비용 항목 리스트 가져오기
  const getExpenseItemDialog = async (ei_seq: number) => {
    if (!ei_seq || ei_seq === null) {
      addAlert({
        title: '비용 조회 실패',
        message: '해당 항목에 매칭된 비용 항목을 찾을 수 없습니다.',
        icon: <OctagonAlert />,
        duration: 1500,
      });
      return;
    }

    setSelectedEstId(ei_seq);
    setDialogOpen(true);
  };

  const dialogClose = () => {
    setSelectedEstId(null);
    setDialogOpen(false);
  };

  // 가용금액 퍼센트
  const getBudgetPercent = ((estData.header.est_budget / estData.header.est_amount) * 100).toFixed(2);

  const statusMap = {
    Y: <Badge>최종견적</Badge>,
    S: <Badge variant="secondary">추가견적</Badge>,
    N: <Badge variant="grayish">과거견적</Badge>,
  } as const;

  return (
    <>
      <div className="flex items-stretch justify-between">
        <div ref={leftRef} className="h-fit w-[74%] tracking-tight">
          <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 정보</h2>
          <TableColumn className="[&_div]:text-[13px]">
            <TableColumnHeader className="w-[18%]">
              <TableColumnHeaderCell>견적서 제목</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody className="w-[32%]">
              <TableColumnCell className="leading-[1.3] break-all">{estData.header.est_title}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[18%]">
              <TableColumnHeaderCell>오너 · 작성자</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody className="w-[32%]">
              <TableColumnCell>
                {data.owner_nm} · {estData.header.user_nm}
              </TableColumnCell>
            </TableColumnBody>
          </TableColumn>

          <TableColumn className="border-t-0 [&_div]:text-[13px]">
            <TableColumnHeader className="w-[18%]">
              <TableColumnHeaderCell>견적서 상태</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{statusMap[estData.header.est_valid as keyof typeof statusMap]}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[18%]">
              <TableColumnHeaderCell>견적서 작성일</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{formatKST(estData.header.wdate)}</TableColumnCell>
            </TableColumnBody>
          </TableColumn>

          <TableColumn className="border-t-0 [&_div]:text-[13px]">
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
        </div>

        <div ref={rightRef} className="flex w-[24%] flex-col overflow-hidden">
          <h2 className="mb-2 shrink-0 text-lg font-bold text-gray-800">견적서 증빙</h2>
          <div className="flex h-full flex-1 flex-col overflow-y-auto">
            <ul className="space-y-4 px-1 pb-3">
              {estData.evidences.map((e) =>
                e.ee_sname ? (
                  <li key={e.seq} className="text-base leading-[1.3] text-gray-800">
                    <div className="flex items-center gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                        <Paperclip className="text-primary-blue size-4.5" />
                      </span>
                      <div className="flex flex-1 flex-col items-stretch overflow-hidden">
                        <a
                          href={normalizeAttachmentUrl(e.ee_sname)}
                          target="_blank"
                          className="block overflow-hidden text-ellipsis whitespace-nowrap hover:underline">
                          {e.ee_fname}
                        </a>
                        <span className="block text-[.88em] text-gray-500">
                          {e.user_nm} · {formatKST(e.uploaded_at)}
                        </span>
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={e.seq} className="text-base leading-[1.3] text-gray-800">
                    <div className="flex items-center gap-4">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                        <MessageSquareMore className="text-primary-blue size-4.5" />
                      </span>
                      <div className="flex flex-1 flex-col items-stretch overflow-hidden">
                        <p>{e.remark}</p>
                        <span className="block text-[.88em] text-gray-500">
                          {e.user_nm} · {formatKST(e.uploaded_at)}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">견적서 항목</h2>
          <div className="flex gap-2">
            {(estData.header.est_valid === 'Y' || estData.header.est_valid === 'S') && isProjectMember && (
              <Button type="button" variant="outline" size="sm" onClick={handleEstEdit}>
                견적서 수정
              </Button>
            )}

            {/* <Button type="button" size="sm">
              견적서 히스토리
            </Button> */}
          </div>
        </div>

        <Table variant="primary" align="center" className="table-fixed">
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
            {viewItems.map((row) => (
              <TableRow key={row.seq} className={`whitespace-nowrap [&_td]:text-[13px] ${row.ei_type === 'item' && 'hover:bg-muted/15'}`}>
                {/* ------------------------ */}
                {/* 일반 Title Row */}
                {/* ------------------------ */}
                {row.ei_type === 'title' && (
                  <>
                    <TableCell className="text-left font-bold" colSpan={6}>
                      {row.ei_name}
                    </TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* 일반 Item Row */}
                {/* ------------------------ */}
                {row.ei_type === 'item' && (
                  <>
                    <TableCell className="text-left whitespace-break-spaces">{row.ei_name}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.unit_price)}</TableCell>
                    <TableCell className="text-right">{row.qty}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatAmount(row.ava_amount)}{' '}
                        <Button
                          type="button"
                          variant="svgIcon"
                          size="xs"
                          className="gap-0.5 text-xs font-normal text-gray-600 hover:text-gray-700"
                          title="매칭된 비용 갯수"
                          onClick={() => getExpenseItemDialog(row.seq)}
                          disabled={row.match_count === 0}>
                          <LinkIcon className="size-3" />
                          {row.match_count}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-left leading-[1.1] break-keep whitespace-break-spaces">{row.remark}</TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* Sub Total Row */}
                {/* ------------------------ */}
                {row.ei_type === 'subtotal' && (
                  <>
                    <TableCell colSpan={3} className="bg-gray-100 font-semibold">
                      {row.ei_name ? row.ei_name : 'Sub Total'}
                    </TableCell>
                    <TableCell className="bg-gray-100 text-right font-semibold">{formatAmount(row.amount)}</TableCell>
                    <TableCell colSpan={2} className="bg-gray-100"></TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* Agency Fee Row */}
                {/* ------------------------ */}
                {row.ei_type === 'agency_fee' && (
                  <>
                    <TableCell className="text-left font-medium">{row.ei_name ? row.ei_name : 'Agency Fee'}</TableCell>
                    <TableCell className="text-right">{row.unit_price && displayUnitPrice(row.unit_price)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-semibold">{formatAmount(row.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatAmount(row.ava_amount)}{' '}
                        <Button
                          type="button"
                          variant="svgIcon"
                          size="xs"
                          className="gap-0.5 text-xs font-normal text-gray-600 hover:text-gray-700"
                          title="매칭된 비용 갯수"
                          onClick={() => getExpenseItemDialog(row.seq)}
                          disabled={row.match_count === 0}>
                          <LinkIcon className="size-3" />
                          {row.match_count}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">{row.remark}</TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* Sub Total Row */}
                {/* ------------------------ */}
                {row.ei_type === 'totalamount' && (
                  <>
                    <TableCell colSpan={3} className="bg-gray-100 font-semibold">
                      {row.ei_name ? row.ei_name : 'Total Amount'}
                    </TableCell>
                    <TableCell className="bg-gray-100 text-right font-semibold">{formatAmount(row.amount)}</TableCell>
                    <TableCell className="bg-gray-100"></TableCell>
                    <TableCell className="bg-gray-100 text-left">{row.remark}</TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* Tax Row */}
                {/* ------------------------ */}
                {row.ei_type === 'tax' && (
                  <>
                    <TableCell colSpan={3} className="bg-gray-300 font-semibold">
                      {row.ei_name ? row.ei_name : 'Tax (10%)'}
                    </TableCell>
                    <TableCell className="bg-gray-300 text-right font-semibold">{formatAmount(row.amount)}</TableCell>
                    <TableCell className="bg-gray-300"></TableCell>
                    <TableCell className="bg-gray-300 text-left">{row.remark}</TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* Discount Row */}
                {/* ------------------------ */}
                {row.ei_type === 'discount' && (
                  <>
                    <TableCell colSpan={3} className="bg-gray-300 font-semibold">
                      {row.ei_name ? row.ei_name : 'Discount'}
                    </TableCell>
                    <TableCell className="bg-gray-300 text-right font-semibold">{formatAmount(row.amount)}</TableCell>
                    <TableCell className="bg-gray-300"></TableCell>
                    <TableCell className="bg-gray-300 text-left">{row.remark}</TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* Grand Total Row */}
                {/* ------------------------ */}
                {row.ei_type === 'grandtotal' && (
                  <>
                    <TableCell colSpan={3} className="bg-primary-blue-150 font-bold text-gray-900">
                      Grand Total
                    </TableCell>
                    <TableCell className="bg-primary-blue-150 text-right font-bold text-gray-900">
                      {formatAmount(estData.header.est_amount)}
                    </TableCell>
                    <TableCell className="bg-primary-blue-150 text-right font-bold">{formatAmount(estData.header.est_budget)}</TableCell>
                    <TableCell className="bg-primary-blue-150"></TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-10 flex justify-between">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={`/project/${projectId}/estimate`}>목록</Link>
          </Button>
          <Button type="button" size="sm">
            <Download /> 다운로드
          </Button>
        </div>
      </div>

      <ExpenseItemDialog open={dialogOpen} ei_seq={seletedEstId} onClose={dialogClose} />
    </>
  );
}
