// /Project/hooks/useProjectExpenseMatching.ts
import { useEffect, useState, useRef } from 'react';
import { getProjectView, type pExpenseViewDTO, type pExpenseItemDTO, type EstimateItemsView, type ProjectViewDTO } from '@/api';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { getExpenseMatchedItems, setExpenseMatchedReset, type EstimateItemsMatch } from '@/api/project';
import type { expenseInfo } from '@/types/estimate';
import { normalizeElType } from '../utils/nomalizeType';

import { CheckCircle } from 'lucide-react';

export interface pExpenseItemWithMatch extends pExpenseItemDTO {
  matchedList?: EstimateItemsMatch[];
}

export interface pExpenseViewWithMatch extends pExpenseViewDTO {
  items: pExpenseItemWithMatch[];
  project: ProjectViewDTO;
}

export interface EstimateMatchedItem {
  seq: number;
  target_seq: number;
  ei_name: string;
  alloc_amount: number;
  ava_amount: number;
  pl_seq: number;
}

// 공통 조회 API 타입
type GetExpenseViewFn = (expId?: string) => Promise<pExpenseViewDTO>;

export const useProjectExpenseMatching = (expId?: string, getExpenseView?: GetExpenseViewFn) => {
  const [data, setData] = useState<pExpenseViewWithMatch | null>(null);
  const [loading, setLoading] = useState(true);

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const isConfirmedRef = useRef(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expenseInfo, setExpenseInfo] = useState<expenseInfo | null>(null);

  const [matchedItems, setMatchedItems] = useState<EstimateItemsView[]>([]);
  const [dbMatchedItems, setDbMatchedItems] = useState<EstimateMatchedItem[]>([]);
  const [selectedExpSeq, setSelectedExpSeq] = useState<number | null>(null);
  const [matchedMap, setMatchedMap] = useState<Record<number, any[]>>({});

  const [selectedEstId, setSelectedEstId] = useState<number | null>(null); // 선택된 견적서 ID 값

  /** --------------------------------------
   *  비용 + 매칭정보 조회
   -------------------------------------- */
  const fetchExpense = async () => {
    if (!expId || !getExpenseView) return;

    try {
      setLoading(true);
      const res = await getExpenseView(expId);

      const normalizedHeader = Array.isArray(res.header) ? res.header[0] : res.header;
      const normalizedElType = normalizeElType(normalizedHeader.el_type);

      const itemsWithMatch = await Promise.all(
        res.items.map(async (item) => {
          const matchedRes = await getExpenseMatchedItems(item.seq);
          return {
            ...item,
            matchedList: matchedRes.list,
          };
        })
      );

      const projectInfo = await getProjectView(normalizedHeader.project_id);

      setData({
        ...res,
        header: {
          ...normalizedHeader,
          el_type: normalizedElType,
        },
        items: itemsWithMatch,
        project: projectInfo.info,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expId) fetchExpense();
  }, [expId, getExpenseView]);

  /** ---------------------------
   * 외부에서 호출 가능한 refresh()
   --------------------------- */
  const refresh = () => fetchExpense();

  /** --------------------------------------
   *  견적서 Dialog 오픈 시 준비
   -------------------------------------- */
  const openEstimateDialog = (seq: number, ei_amount: number) => {
    setMatchedItems([]);
    setDbMatchedItems([]);
    setExpenseInfo({ seq, ei_amount });

    requestAnimationFrame(() => {
      setDialogOpen(true);
    });
  };

  /** --------------------------------------
   *  Dialog confirm → 선택된 견적 row 저장
   -------------------------------------- */
  const confirmEstimateSelect = (items: EstimateItemsView[], estId: number | null) => {
    if (expenseInfo) {
      setMatchedMap((prev) => ({
        ...prev,
        [expenseInfo.seq]: items,
      }));
    }

    if (estId !== null) setSelectedEstId(estId);
    setMatchedItems(items);
    isConfirmedRef.current = true;
  };

  /** --------------------------------------
   *  Dialog close → 취소 시 클리어
   -------------------------------------- */
  const closeEstimateDialog = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      if (!isConfirmedRef.current && matchedItems.length === 0) {
        clearMatching();
      }
      isConfirmedRef.current = false;
    }
  };

  /** --------------------------------------
   *  Dialog 다시 오픈
   -------------------------------------- */
  const openDialog = () => {
    selectedEstId;
    setDialogOpen(true);
  };

  /** --------------------------------------
   *  견적 매칭 완료
   -------------------------------------- */
  const completeMatching = async (expSeq: number, items: any[]) => {
    setMatchedMap((prev) => ({
      ...prev,
      [expSeq]: items,
    }));

    setDbMatchedItems([]);
    setSelectedExpSeq(null);

    await refresh();
  };

  /** --------------------------------------
   *  매칭 초기화
   -------------------------------------- */
  const resetMatching = () => {
    setMatchedItems([]);
    setExpenseInfo(null);
    setSelectedExpSeq(null);
  };

  /** --------------------------------------
   *  매칭 클리어
   -------------------------------------- */
  const clearMatching = () => {
    if (!expenseInfo) return;

    const seq = expenseInfo.seq;

    setMatchedMap((prev) => {
      const next = { ...prev };
      delete next[seq];
      return next;
    });

    resetMatching();
  };

  /** --------------------------------------
   *  이미 매칭된 Row 클릭 시 → 매칭정보 가져오기
   -------------------------------------- */
  const loadMatchedItems = async (item: pExpenseItemWithMatch) => {
    clearMatching();

    if (!item.matchedList || item.matchedList.length === 0) {
      setMatchedItems([]);
      setDbMatchedItems([]);
      setExpenseInfo({ seq: item.seq, ei_amount: item.ei_amount });
      return;
    }

    const res = await getExpenseMatchedItems(item.seq);
    const mapped: EstimateMatchedItem[] = res.list.map((m) => ({
      seq: m.seq,
      target_seq: m.target_seq,
      est_id: m.est_id,
      ei_name: m.ei_name ?? '',
      alloc_amount: m.alloc_amount ?? 0,
      ava_amount: m.ava_amount ?? 0,
      pl_seq: m.pl_seq,
    }));

    setMatchedItems([]);
    setDbMatchedItems(mapped);
    setSelectedExpSeq(item.seq);
    setExpenseInfo({ seq: item.seq, ei_amount: item.ei_amount });
  };

  /** --------------------------------------
   *  매칭 삭제
   -------------------------------------- */
  const deleteMatching = async (expSeq: number) => {
    addDialog({
      title: '견적 매칭 재설정',
      message: `견적서 매칭을 재설정 하시겠습니까? <br />기존 매칭이 삭제되고 다시 매칭을 진행해야 합니다.`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        const res = await setExpenseMatchedReset(expSeq);

        if (res.list.ok) {
          addAlert({
            title: '견적서 매칭 삭제',
            message: '기존 매칭이 삭제되었습니다.<br />견적서 매칭을 다시 진행해 주세요.',
            icon: <CheckCircle />,
            duration: 1500,
          });

          refresh(); // 비용 항목 쪽 리프레쉬
          setSelectedExpSeq(null);
          setExpenseInfo(null);
          setDbMatchedItems([]); // 매칭완료 Response Type 클리어
          clearMatching();
        }
      },
    });
  };

  return {
    data,
    loading,
    refresh, // fetchExpense 외부 제공

    // dialog
    dialogOpen,
    expenseInfo,
    matchedItems,
    dbMatchedItems,
    matchedMap,

    openDialog,
    openEstimateDialog,
    confirmEstimateSelect,
    closeEstimateDialog,

    completeMatching,
    resetMatching,
    clearMatching,
    loadMatchedItems,
    deleteMatching,

    selectedExpSeq,
    selectedEstId,
    setSelectedEstId,
  };
};
