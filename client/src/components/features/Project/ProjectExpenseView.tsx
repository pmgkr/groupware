import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { formatKST, formatAmount, displayUnitPrice } from '@/utils';
import {
  getProjectExpenseView,
  getEstimateItemsInfo,
  type pExpenseViewDTO,
  type EstimateHeaderView,
  type EstimateItemsView,
  type pExpenseItemDTO,
} from '@/api';
import { getExpenseMatchedItems, type EstimateItemsMatch } from '@/api/project';
import { cn } from '@/lib/utils';
import EstimateSelectDialog from './_components/EstimateSelectDialog';
import { type expenseInfo } from '@/types/estimate';

import { Badge } from '@components/ui/badge';
import { Checkbox } from '@components/ui/checkbox';
import { Button } from '@components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download, Edit } from '@/assets/images/icons';
import { File, Link as LinkIcon, RotateCcw } from 'lucide-react';

import { format } from 'date-fns';
import { statusIconMap, getLogMessage } from '../Expense/utils/statusUtils';
import EstimateMatching from './_components/EstimateMatching';

export interface pExpenseItemWithMatch extends pExpenseItemDTO {
  matchedList?: EstimateItemsMatch[];
}

// 특정 컴포넌트에서만 사용할 확장 타입
export interface pExpenseViewWithMatch extends pExpenseViewDTO {
  items: pExpenseItemWithMatch[];
}

export default function projectExpenseView() {
  const { expId, projectId } = useParams();
  const navigate = useNavigate();

  // 비용 데이터 State
  const [data, setData] = useState<pExpenseViewWithMatch | null>(null);
  const [loading, setLoading] = useState(true);

  // 견적서 다이얼로그 State
  const isConfirmedRef = useRef(false); // DialogClose 체크용
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expenseInfo, setExpenseInfo] = useState<expenseInfo | null>(null);
  const [matchedItems, setMatchedItems] = useState<EstimateItemsView[]>([]);
  const [matchedMap, setMatchedMap] = useState<Record<number, any[]>>({}); // 어떤 row가 매칭 완료되었는 지 저장

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  /** ----------------------------
   * 프로젝트 비용 상세 불러오기
   ---------------------------- */
  const fetchExpense = async () => {
    try {
      const res = await getProjectExpenseView(expId);
      console.log('✅ 비용 상세 조회 성공:', res);

      const itemsWithMatch = await Promise.all(
        res.items.map(async (item) => {
          const matchedRes = await getExpenseMatchedItems(item.seq);
          return {
            ...item,
            matchedList: matchedRes.list,
          };
        })
      );

      const extendedRes: pExpenseViewWithMatch = {
        ...res,
        items: itemsWithMatch,
      };

      console.log('✅ 매칭된 비용 상세 조회 성공:', extendedRes);

      setData(extendedRes);
    } catch (err) {
      console.error('❌ 비용 상세 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
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

  const { header, items } = data;

  // 총 비용 계산
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
  const handleEstimateInfo = (seq: number, ei_amount: number) => {
    setMatchedItems([]); // 선택된 견적 항목 배열 초기화
    setExpenseInfo({ seq, ei_amount }); // 현재 비용 항목 정보 전달

    requestAnimationFrame(() => {
      setDialogOpen(true);
    });
  };

  // 견적서 불러오기 다이얼로그 등록 핸들러
  const handleConfirm = (items: EstimateItemsView[]) => {
    if (expenseInfo) {
      setMatchedMap((prev) => ({
        ...prev,
        [expenseInfo.seq]: items,
      }));
    }

    setMatchedItems(items);
    isConfirmedRef.current = true;
  };

  // 견적서 불러오기 다이얼로그 취소 핸들러
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      if (!isConfirmedRef.current && setMatchedItems.length === 0) {
        // Dialog가 닫히는 순간 실행됨
        handleCancleMatching();
      }

      isConfirmedRef.current = false;
    }
  };

  // 견적서 매칭 매칭하기 핸들러
  const handleMatchComplete = (expenseSeq: number, items: any[]) => {
    setMatchedMap((prev) => ({
      ...prev,
      [expenseSeq]: items, // 배열로 저장
    }));
  };

  // 견적서 매칭 초기화 핸들러
  const handleResetMatching = () => {
    setMatchedItems([]);
    setExpenseInfo(null);
  };

  // 견적서 매칭취소 핸들러
  const handleCancleMatching = () => {
    if (!expenseInfo) return;

    const seq = expenseInfo.seq;

    // 1) matchedMap에서 seq 제거
    setMatchedMap((prev) => {
      const updated = { ...prev };
      delete updated[seq];
      return updated;
    });

    // 2) EstimateMatching 영역 초기화
    handleResetMatching();
  };

  // 매칭완료 클릭 시, 견적서 매칭 Data 세팅
  const handleMatchedItems = async (idx: number) => {
    if (!data) return;

    const item = data.items[idx];
    const matchedEstSeq = item.matchedList?.map((m) => m.target_seq) || [];

    console.log(item);

    if (matchedEstSeq.length === 0) {
      setMatchedItems([]);
      setExpenseInfo({ seq: item.seq, ei_amount: item.ei_amount });
      return;
    }

    const response = await getExpenseMatchedItems(item.seq);

    console.log('🟦 getEstimateItemsInfo results:', response);
    // 부장님이 API 수정해주시면, response 데이터로 matchedEstItems 수정 필요

    // setMatchedItems(matchedEstItems);
    setExpenseInfo({ seq: item.seq, ei_amount: item.ei_amount });
  };

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
                  <TableHead className="w-[14%]">금액 (A)</TableHead>
                  <TableHead className="w-[10%]">세금</TableHead>
                  <TableHead className="w-[14%]">합계</TableHead>
                  <TableHead className="w-[20%]">증빙자료</TableHead>
                  <TableHead className="w-[8%]">견적서</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
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
                      <TableCell className="px-1 text-center [&_button]:rounded-xl [&_button]:border [&_button]:text-xs [&_button]:transition-none">
                        {(() => {
                          const alreadyMatched = (item.matchedList?.length ?? 0) > 0;
                          const isMatched = (matchedMap[item.seq]?.length ?? 0) > 0;
                          const isMatching = expenseInfo?.seq === item.seq && matchedItems.length > 0;
                          const isWaiting = expenseInfo && expenseInfo.seq !== item.seq && matchedItems.length > 0;

                          // 1) 이미 DB에서 매칭된 row, 클릭 시 EstimateMatching 데이터 세팅
                          if (alreadyMatched) {
                            return (
                              <Button size="xs" variant="outline" onClick={() => handleMatchedItems(idx)}>
                                매칭완료
                              </Button>
                            );
                          }

                          // 2) 현재 매칭중인 Row, 클릭 시 Dialog 오픈
                          if (isMatching) {
                            return (
                              <Button size="xs" className="border-primary-blue/10" onClick={() => setDialogOpen(true)}>
                                매칭중
                              </Button>
                            );
                          }

                          // 3) 클라이언트에서 방금 매칭된 row, 클릭 시 EstimateMatching 데이터 세팅
                          if (isMatched) {
                            return (
                              <Button size="xs" variant="outline" onClick={() => handleMatchedItems(idx)}>
                                매칭완료
                              </Button>
                            );
                          }

                          // 4) 매칭중일 때 다른 row는 disabled 처리
                          if (isWaiting) {
                            return (
                              <Button size="xs" variant="secondary" disabled>
                                매칭대기
                              </Button>
                            );
                          }

                          // 5) 기본: 매칭하기
                          return (
                            <Button
                              size="xs"
                              className="bg-primary-blue-100 text-primary-blue border-primary-blue-300/10 hover:bg-primary-blue-150 hover:text-primary-blue active:bg-primary-blue-100"
                              onClick={() => handleEstimateInfo(item.seq, item.ei_amount)}>
                              매칭하기
                            </Button>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-primary-blue-50 [&_td]:py-3">
                  <TableCell className="font-semibold" colSpan={3}>
                    총 비용
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.amount)}원</TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.tax)}원</TableCell>
                  <TableCell className="text-right font-semibold">{formatAmount(totals.total)}원</TableCell>
                  <TableCell className="text-left" colSpan={2}></TableCell>
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

            {matchedItems.length > 0 && (
              <Button type="button" size="sm" variant="svgIcon" className="h-auto pr-1! text-gray-500" onClick={handleCancleMatching}>
                견적서 매칭취소 <RotateCcw className="size-3" />
              </Button>
            )}
          </div>
          <EstimateMatching
            matchedItems={matchedItems}
            expenseInfo={expenseInfo}
            onReset={handleResetMatching}
            onRefresh={fetchExpense}
            onMatched={handleMatchComplete}
          />
        </div>
      </div>
      <EstimateSelectDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        projectId={projectId}
        expenseInfo={expenseInfo}
        onConfirm={handleConfirm}
        selectingItems={matchedItems}
      />
    </>
  );
}
