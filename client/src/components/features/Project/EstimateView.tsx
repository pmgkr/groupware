import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { Link, useOutletContext, useNavigate, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { getEstimateView, estimateCancel, type EstimateViewDTO } from '@/api';
import { formatKST, formatAmount, formatDate, displayUnitPrice, normalizeAttachmentUrl } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';

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

export default function EstimateView() {
  const navigate = useNavigate();
  const { user_id } = useUser();
  const { estId, projectId } = useParams();
  const isMobile = useIsMobileViewport();

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

  const handleEstCancel = (estId: string | undefined) => {
    if (!estId) return;

    addDialog({
      title: '견적서를 취소하시겠습니까?',
      message: `취소 시 해당 견적은 '과거 견적' 상태로 변경되며, 매칭된 비용 정보는 초기화됩니다.`,
      confirmText: '수정',
      cancelText: '취소',
      onConfirm: async () => {
        const res = await estimateCancel(estId);
        console.log('견적서 취소', res);

        const resetCount = `${res.reset_count}건의 견적서 비용이 매칭 초기화 되었습니다.`;

        if (res.ok) {
          addAlert({
            title: '견적서 취소',
            message: `견적서가 등록 취소 되었습니다.`,
            icon: <OctagonAlert />,
            duration: 2000,
          });
        }
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
    Y: <Badge size={isMobile ? 'md' : 'default'}>최종견적</Badge>,
    S: (
      <Badge variant="secondary" size={isMobile ? 'md' : 'default'}>
        추가견적
      </Badge>
    ),
    N: (
      <Badge variant="grayish" size={isMobile ? 'md' : 'default'}>
        과거견적
      </Badge>
    ),
  } as const;

  return isMobile ? (
    <div className="-mx-5 -my-6 bg-white">
      <div className="p-5 tracking-tight">
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-[1.2] font-light">{estData.header.est_title}</h3>
            <div className="shrink-0">{statusMap[estData.header.est_valid as keyof typeof statusMap]}</div>
          </div>
          <div className="flex items-center text-xl font-bold">
            <strong className="text-[1.3em]">{formatAmount(estData.header.est_amount)}</strong>원
          </div>
        </div>

        <ExpRow title="가용 예산" value={formatAmount(estData.header.est_budget) + '원'} />
        <ExpRow title="작성자" value={estData.header.user_nm} />
        <ExpRow title="작성일" value={formatDate(estData.header.wdate)} />
      </div>
      <HorzBar />
      <div className="p-5">
        <h3 className="text-lg leading-[1.2] font-bold">견적서 항목</h3>

        <div className="mt-2 mb-6">
          {viewItems.map((row) => (
            <>
              {row.ei_type === 'title' && (
                <div className="border-t-1 border-gray-300 px-1 py-2 text-base font-semibold first:border-0">{row.ei_name}</div>
              )}

              {row.ei_type === 'item' && (
                <div className="border-t-1 border-gray-300 bg-gray-100/70 px-3 py-2">
                  <div className="text-base leading-[1.2] font-medium tracking-tight">{row.ei_name}</div>
                  <div className="flex gap-2 text-sm text-gray-700">
                    <span className="relative pr-2 after:absolute after:top-1/2 after:left-full after:h-3 after:w-px after:-translate-y-1/2 after:bg-gray-400 after:content-['']">
                      단가 {formatAmount(row.unit_price)}
                    </span>
                    <span>수량 {row.qty}</span>
                  </div>
                  <div className="text-right text-[13px] leading-[1.3] font-medium">
                    {formatAmount(row.amount) + '원'}{' '}
                    <span className="block text-[.75em] font-normal text-gray-600">{`가용 금액 ${formatAmount(row.ava_amount)}원`}</span>
                  </div>
                  {row.remark && <p className="mt-2 text-sm text-gray-700">{row.remark}</p>}
                </div>
              )}

              {row.ei_type === 'subtotal' && (
                <div className="bg-primary-blue-100 flex items-center justify-between border-t-1 border-gray-300 px-3 py-2 text-base">
                  <span className="flex-1 text-[13px] leading-[1.2] font-semibold">{row.ei_name ? row.ei_name : 'Sub Total'}</span>
                  <strong className="shrink-0 tracking-tight">{formatAmount(row.amount)}원</strong>
                </div>
              )}

              {row.ei_type === 'agency_fee' && (
                <div className="border-t-1 border-gray-300 bg-gray-100/80 px-3 py-2">
                  <div className="text-base leading-[1.2] tracking-tight">{row.ei_name ? row.ei_name : 'Agency Fee'}</div>
                  <div className="text-sm text-gray-700">단가 {row.unit_price && displayUnitPrice(row.unit_price)}</div>
                  <div className="text-right text-[13px] leading-[1.3] font-medium">
                    {formatAmount(row.amount)}원
                    <span className="block text-[.75em] font-normal text-gray-600">{`가용 금액 ${formatAmount(row.ava_amount)}원`}</span>
                  </div>
                  {row.remark && <p className="mt-2 text-sm text-gray-700">{row.remark}</p>}
                </div>
              )}

              {row.ei_type === 'totalamount' && (
                <div className="flex items-center justify-between border-t-1 border-gray-300 bg-gray-200/80 px-3 py-2 text-base">
                  <span className="flex-1 text-[13px] leading-[1.2] font-semibold">{row.ei_name ? row.ei_name : 'Total Amount'}</span>
                  <strong className="shrink-0 tracking-tight">{formatAmount(row.amount)}원</strong>
                  {row.remark && <p className="mt-2 text-sm text-gray-700">{row.remark}</p>}
                </div>
              )}

              {row.ei_type === 'tax' && (
                <div className="flex items-center justify-between border-t-1 border-gray-300 bg-gray-200/80 px-3 py-2 text-base">
                  <span className="flex-1 text-[13px] leading-[1.2] font-semibold">{row.ei_name ? row.ei_name : 'Tax (10%)'}</span>
                  <strong className="shrink-0 tracking-tight">{formatAmount(row.amount)}원</strong>
                  {row.remark && <p className="mt-2 text-sm text-gray-700">{row.remark}</p>}
                </div>
              )}

              {row.ei_type === 'discount' && (
                <div className="flex items-center justify-between border-t-1 border-gray-300 bg-gray-300/80 px-3 py-2 text-base">
                  <span className="flex-1 text-[13px] leading-[1.2] font-semibold">{row.ei_name ? row.ei_name : 'Discount'}</span>
                  <strong className="shrink-0 tracking-tight">{formatAmount(row.amount)}원</strong>
                  {row.remark && <p className="mt-2 text-sm text-gray-700">{row.remark}</p>}
                </div>
              )}

              {row.ei_type === 'grandtotal' && (
                <div className="bg-primary-blue-150 flex items-center justify-between border-t-1 border-gray-300 p-3 text-base">
                  <span className="flex-1 text-[13px] leading-[1.2] font-semibold">Grand Total</span>
                  <strong className="shrink-0 text-right leading-[1.4] tracking-tight">
                    {formatAmount(estData.header.est_amount)}원{' '}
                    <span className="block text-[.75em] font-normal text-gray-700">{`가용 금액 ${formatAmount(estData.header.est_budget)}원`}</span>
                  </strong>
                </div>
              )}
            </>
          ))}
        </div>
        <Button type="button" variant="outline" size="full" asChild>
          <Link to={`/project/${projectId}/estimate`}>목록</Link>
        </Button>
      </div>
    </div>
  ) : (
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
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => handleEstCancel(estId)}>
                  견적서 취소
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleEstEdit}>
                  견적서 수정
                </Button>
              </>
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
        </div>
      </div>

      <ExpenseItemDialog open={dialogOpen} ei_seq={seletedEstId} onClose={dialogClose} />
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
      <dd className={cn('text-right text-[13px] font-medium', bold && 'font-semibold')}>{value}</dd>
    </dl>
  );
}
