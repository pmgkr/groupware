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
import { getExpenseMatchedItems, type EstimateItemsMatch, setExpenseMatchedReset } from '@/api/project';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import EstimateSelectDialog from './_components/EstimateSelectDialog';
import EstimateMatching from './_components/EstimateMatching';
import EstimateMatched from './_components/EstimateMatched';
import ExpenseViewRow from './_components/ExpenseViewRow';
import ExpenseViewEstRow from './_components/ExpenseViewEstRow';
import { type expenseInfo } from '@/types/estimate';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Download, Edit } from '@/assets/images/icons';
import { File, Link as LinkIcon, RotateCcw, CheckCircle } from 'lucide-react';

import { format } from 'date-fns';

export interface pExpenseItemWithMatch extends pExpenseItemDTO {
  matchedList?: EstimateItemsMatch[];
}

// 특정 컴포넌트에서만 사용할 확장 타입
export interface pExpenseViewWithMatch extends pExpenseViewDTO {
  items: pExpenseItemWithMatch[];
}

// 견적서 매칭확인 Response Type
export interface EstimateMatchedItem {
  seq: number;
  target_seq: number;
  ei_name: string;
  alloc_amount: number;
  ava_amount: number;
  pl_seq: number;
}

export default function projectExpenseView() {
  const { expId, projectId } = useParams();
  const navigate = useNavigate();

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  // 비용 데이터 State
  const [data, setData] = useState<pExpenseViewWithMatch | null>(null);
  const [loading, setLoading] = useState(true);

  // 견적서 다이얼로그 State
  const isConfirmedRef = useRef(false); // DialogClose 체크용
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expenseInfo, setExpenseInfo] = useState<expenseInfo | null>(null);
  const [matchedItems, setMatchedItems] = useState<EstimateItemsView[]>([]);
  const [selectedExpSeq, setSelectedExpSeq] = useState<number | null>(null); // 현재 선택된 비용 항목 번호
  const [dbMatchedItems, setDbMatchedItems] = useState<EstimateMatchedItem[]>([]); // 매칭확인 후 Response Type 세팅
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
    setDbMatchedItems([]); // 매칭완료 견적 배열 초기화
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
        handleMatchingClear();
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

    setDbMatchedItems([]);
    setSelectedExpSeq(null);
  };

  // 견적서 매칭 초기화 핸들러
  const handleResetMatching = () => {
    setMatchedItems([]);
    setExpenseInfo(null);
    setSelectedExpSeq(null);
  };

  // 견적서 매칭 클리어 핸들러
  const handleMatchingClear = () => {
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

    handleMatchingClear(); // 매칭중인 항목이 있었다면, 클리어

    const item = data.items[idx];
    const matchedEstSeq = item.matchedList?.map((m) => m.target_seq) || [];

    console.log(item, matchedEstSeq);

    if (matchedEstSeq.length === 0) {
      setMatchedItems([]);
      setDbMatchedItems([]);
      setExpenseInfo({ seq: item.seq, ei_amount: item.ei_amount });
      return;
    }

    const response = await getExpenseMatchedItems(item.seq);
    const matchedList = response.list ?? [];

    const mapped: EstimateMatchedItem[] = matchedList.map((m) => ({
      seq: m.seq,
      target_seq: m.target_seq,
      ei_name: m.ei_name ?? '', // 🔥 여기 때문에 TS 에러 났었음
      alloc_amount: m.alloc_amount ?? 0,
      ava_amount: m.ava_amount ?? 0,
      pl_seq: m.pl_seq,
    }));

    console.log('🟦 getEstimateItemsInfo results:', mapped);

    setMatchedItems([]);
    setDbMatchedItems(mapped);
    setSelectedExpSeq(item.seq); // 선택된 비용항목 번호 저장
    setExpenseInfo({ seq: item.seq, ei_amount: item.ei_amount });
  };

  // 매칭 재설정 버튼 클릭 시
  const handleDeleteMatching = async () => {
    if (selectedExpSeq === null) return;

    try {
      addDialog({
        title: '견적 매칭 재설정',
        message: `견적서 매칭을 재설정 하시겠습니까? <br />기존 매칭이 삭제되고 다시 매칭을 진행해야 합니다.`,
        confirmText: '확인',
        cancelText: '취소',
        onConfirm: async () => {
          const res = await setExpenseMatchedReset(selectedExpSeq);

          if (res.list.ok) {
            addAlert({
              title: '견적서 매칭 삭제',
              message: '기존 매칭이 삭제되었습니다.<br />견적서 매칭을 다시 진행해 주세요.',
              icon: <CheckCircle />,
              duration: 1500,
            });

            fetchExpense(); // 비용 항목 쪽 다시 렌더링
            setSelectedExpSeq(null);
            setExpenseInfo(null);
            setDbMatchedItems([]); // 매칭완료 Response Type 클리어
            handleMatchingClear();
          }
        },
      });
    } catch (err) {
      console.error('❌ 비용 상세 조회 실패:', err);
    }
  };

  return (
    <>
      <div className="flex min-h-140 flex-wrap justify-between pb-12">
        <div className={`${data.header.is_estimate === 'Y' ? 'w-[74%]' : 'w-full'} tracking-tight`}>
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
                  {data.header.is_estimate === 'Y' ? (
                    <TableHead className="w-[14%]">금액 (A)</TableHead>
                  ) : (
                    <TableHead className="w-[14%]">금액</TableHead>
                  )}
                  <TableHead className="w-[10%]">세금</TableHead>
                  <TableHead className="w-[14%]">합계</TableHead>
                  <TableHead className="w-[20%]">증빙자료</TableHead>
                  {data.header.is_estimate === 'Y' ? (
                    <TableHead className="w-[8%]">견적서</TableHead>
                  ) : (
                    <TableHead className="w-[8%]">기안서</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.header.is_estimate === 'Y'
                  ? items.map((item, idx) => {
                      const alreadyMatched = (item.matchedList?.length ?? 0) > 0;
                      const isMatched = (matchedMap[item.seq]?.length ?? 0) > 0;
                      const isMatching = expenseInfo?.seq === item.seq && matchedItems.length > 0;
                      const isWaiting = Boolean(expenseInfo && expenseInfo.seq !== item.seq && matchedItems.length > 0);

                      return (
                        <ExpenseViewEstRow
                          key={item.seq}
                          item={item}
                          idx={idx}
                          onMatched={() => handleMatchedItems(idx)}
                          onMatching={() => setDialogOpen(true)}
                          onSetMatching={() => handleEstimateInfo(item.seq, item.ei_amount)}
                          alreadyMatched={alreadyMatched}
                          isMatched={isMatched}
                          isMatching={isMatching}
                          isWaiting={isWaiting}
                        />
                      );
                    })
                  : items.map((item, idx) => {
                      return <ExpenseViewRow key={item.seq} item={item} />;
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

        {data.header.is_estimate === 'Y' && (
          // 견적서 비용일 때만 견적서 매칭 UI 제공
          <div className="w-[24%]">
            <div className="flex justify-between">
              <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 매칭</h2>

              {dbMatchedItems.length > 0 ? (
                <Button type="button" size="sm" variant="svgIcon" className="h-auto pr-1! text-gray-500" onClick={handleDeleteMatching}>
                  견적 매칭 재설정 <RotateCcw className="size-3" />
                </Button>
              ) : (
                matchedItems.length > 0 && (
                  <Button type="button" size="sm" variant="svgIcon" className="h-auto pr-1! text-gray-500" onClick={handleMatchingClear}>
                    견적서 매칭취소 <RotateCcw className="size-3" />
                  </Button>
                )
              )}
            </div>
            {dbMatchedItems.length > 0 ? (
              <EstimateMatched items={dbMatchedItems} />
            ) : (
              <EstimateMatching
                matchedItems={matchedItems}
                expenseInfo={expenseInfo}
                onReset={handleResetMatching}
                onRefresh={fetchExpense}
                onMatched={handleMatchComplete}
              />
            )}
          </div>
        )}
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
