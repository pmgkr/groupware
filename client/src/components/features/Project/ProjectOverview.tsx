// src/components/features/Project/ProjectOverview
import { useEffect, useState, useMemo } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { formatAmount } from '@/utils';
import { useUser } from '@/hooks/useUser';

import { getInvoiceList, type InvoiceListItem } from '@/api';
import { getProjectLogs, type ProjectLogs } from '@/api/project';
import { buildExpenseColorMap, buildPieChartData, groupExpenseForChart, buildInvoicePieChartData } from './utils/chartMap';
import type { PieItem, PieChartItem } from './utils/chartMap';

import { HalfDonut } from '@components/charts/HalfDonut';
import { GapPieChart } from '@components/charts/GapPieChart';

import { Button } from '@components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';

import { ProjectHistory } from './_components/ProjectHistory';
import { ProjectMember } from './_components/ProjectMember';
import { ProjectUpdate } from './_components/ProjectUpdate';
import { ProjectMemberUpdate } from './_components/ProjectMemberUpdate';

import { Edit } from '@/assets/images/icons';
import { format } from 'date-fns';

export default function Overview() {
  const { user_id } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const listSearch = (location.state as any)?.fromSearch ?? '';
  const fallbackListPath = listSearch ? `/project${listSearch}` : '/project';

  const { data, members, summary, expense_data, expense_type, logs, refetch } = useOutletContext<ProjectLayoutContext>();
  const [expenseColorMap, setExpenseColorMap] = useState<Record<string, string>>({}); // 비용유형 컬러맵
  const [expenseData, setExpenseData] = useState<PieItem[]>([]); // 비용 용도별 데이터 State
  const [expenseChartData, setExpenseChartData] = useState<PieChartItem[]>([]); // 비용 용도 차트 데이터 State

  const [invoiceList, setInvoiceList] = useState<InvoiceListItem[]>([]); // 인보이스 리스트 데이터 State
  const [invoiceChartData, setInvoiceChartData] = useState<PieChartItem[]>([]); // 인보이스 차트 데이터 State

  const [expenseTypeChartData, setExpenseTypeChartData] = useState<PieChartItem[]>([]); // 비용 유형 차트 데이터 State
  const [memberDialogOpen, setMemberDialogOpen] = useState(false); // 프로젝트 멤버 변경 Dialog State
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false); // 프로젝트 업데이트 Dialog State

  // 페이지 렌더 시 비용 유형 컬러맵 생성 & 인보이스 데이터 조회
  useEffect(() => {
    async function loadColors() {
      const map = await buildExpenseColorMap();
      setExpenseColorMap(map);
    }
    loadColors();

    // 인보이스 client_nm 기준으로 파이차트 데이터 생성
    async function getInvoideList() {
      const params: Record<string, any> = {
        size: 50,
        invoice_status: 'Confirmed',
      };

      const res = await getInvoiceList(data.project_id, params);
      setInvoiceList(res.list);
    }

    getInvoideList();
  }, [refetch, data.project_id]);

  // 비용 용도별 데이터 받아와서 파이차트 데이터로 정제
  useEffect(() => {
    if (!expense_data?.length) return;
    if (!Object.keys(expenseColorMap).length) return;

    const mapped: PieItem[] = expense_data
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        name: item.type,
        value: item.total,
        color: expenseColorMap[item.type] ?? '#E5E7EB',
      }));

    setExpenseData(mapped);
  }, [expense_data, expenseColorMap]);

  // 최소 1% 보정된 차트 데이터 생성
  useEffect(() => {
    if (!expense_data || expense_data.length === 0) {
      setExpenseChartData([
        {
          name: '등록된 비용 없음',
          value: 100,
          realValue: 0,
          color: '#E5E7EB',
        },
      ]);
      return;
    }

    const chartData = buildPieChartData(expenseData);
    const grouped = groupExpenseForChart(chartData, 6);

    setExpenseChartData(grouped);
  }, [expenseData]);

  // 인보이스 리스트 > 파이차트 데이터 생성
  useEffect(() => {
    if (!invoiceList.length) {
      setInvoiceChartData([
        {
          name: '등록된 인보이스 없음',
          value: 100,
          realValue: 0,
          color: '#E5E7EB',
        },
      ]);
      return;
    }

    const chartData = buildInvoicePieChartData(invoiceList);

    // 비용 차트와 동일한 정책 적용
    const grouped = groupExpenseForChart(chartData, 6);

    setInvoiceChartData(grouped);
  }, [invoiceList]);

  // 비용 유형 useEffect 정리 (견적서/기안서/야근교통,식대비로 분류)
  useEffect(() => {
    if (!expense_type || !expense_data || !Object.keys(expenseColorMap).length) return;

    const NIGHT_TYPES = ['야근교통비', '야근식대'];

    const nightExpenseTotal = expense_data
      .filter((item) => NIGHT_TYPES.includes(item.type))
      .reduce((sum, item) => sum + Number(item.total || 0), 0);

    const estTotal = Number(expense_type.est_total || 0);
    const nonTotal = Number(expense_type.non_total || 0);
    const proposalTotal = Math.max(nonTotal - nightExpenseTotal, 0);

    // 1. 전체 합계 체크
    const totalSum = estTotal + proposalTotal + nightExpenseTotal;

    // 2. 전부 0이면 placeholder 차트
    if (totalSum === 0) {
      setExpenseTypeChartData([
        {
          name: '등록된 비용 없음',
          value: 100,
          realValue: 0,
          color: '#E5E7EB',
        },
      ]);
      return;
    }

    const items: PieItem[] = [
      {
        name: '견적서',
        value: estTotal,
        color: '#A5B4FC',
      },
      {
        name: '기안서',
        value: proposalTotal,
        color: '#ccc',
      },
      {
        name: '야근교통·식대비',
        value: nightExpenseTotal,
        color: '#F4CBE1',
      },
    ].filter((i) => i.value > 0);

    setExpenseTypeChartData(buildPieChartData(items));
  }, [expense_type, expense_data, expenseColorMap]);

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  const sortedMembers = members
    ? [...members].sort((a, b) => {
        if (a.user_type === 'owner' && b.user_type !== 'owner') return -1;
        if (b.user_type === 'owner' && a.user_type !== 'owner') return 1;
        return 0;
      })
    : [];

  const isProjectMember = useMemo(() => members.some((m) => m.user_id === user_id), [members, user_id]);

  return (
    <>
      <div className="flex min-h-240 flex-wrap justify-between py-2">
        <div className="w-[76%] tracking-tight">
          <div className="flex flex-wrap gap-[3%]">
            <div className="w-full">
              <div className="flex items-center justify-between">
                <h3 className="mb-2 text-lg font-bold text-gray-800">프로젝트 정보</h3>
                {data.project_status === 'in-progress' && isProjectMember && (
                  <Button
                    type="button"
                    variant="svgIcon"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700"
                    onClick={() => setUpdateDialogOpen(true)}>
                    <Edit className="size-4" />
                  </Button>
                )}
              </div>
              <TableColumn>
                <TableColumnHeader className="w-[15%] max-[1441px]:w-[18%]">
                  <TableColumnHeaderCell>프로젝트 #</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 오너</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 견적</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>{data.project_id}</TableColumnCell>
                  <TableColumnCell>{data.owner_nm}</TableColumnCell>
                  <TableColumnCell>{formatAmount(data.est_amount) ?? 0} 원</TableColumnCell>
                </TableColumnBody>
                <TableColumnHeader className="w-[15%] max-[1441px]:w-[18%]">
                  <TableColumnHeaderCell>클라이언트</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 기간</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 예상 지출</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>{data.client_nm}</TableColumnCell>
                  <TableColumnCell>{`${formatDate(data.project_sdate)} ~ ${formatDate(data.project_edate)}`}</TableColumnCell>
                  <TableColumnCell>{formatAmount(data.est_budget) ?? 0} 원</TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            </div>
            <div className="mt-8 grid w-full grid-cols-2 grid-rows-2 gap-4">
              <Card className="rounded-none border-0 bg-white text-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl leading-[1.3] font-bold">프로젝트 GPM</CardTitle>
                  <CardDescription>인보이스 발행금액 대비 지출 비용을 제외한 순이익 비율을 제공합니다.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4 pb-4">
                  <div className="relative aspect-square w-[50%]">
                    <HalfDonut value={summary[0]?.GPM ?? 0} netProfit={summary[0]?.netprofit ?? 0} />
                    <span className="centered absolute text-center text-lg leading-[1.2] font-bold">
                      GPM <span className="text-primary block text-[1.4em]">{summary[0]?.GPM ?? 0}%</span>
                    </span>
                  </div>
                  <div className="w-[45%]">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="bg-primary-blue h-2.5 w-2.5 rounded-sm" />
                        <span className="flex-1">인보이스 발행금액</span>{' '}
                        <span className="text-right font-medium">{formatAmount(summary[0]?.inv_amount ?? 0)}원</span>
                      </li>
                      <li className="bg-pri flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm bg-gray-400" />
                        <span className="flex-1">지출 비용 합계</span>{' '}
                        <span className="text-right font-medium">{formatAmount(summary[0]?.exp_amount ?? 0)}원</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-primary h-2.5 w-2.5 rounded-sm" />
                        <span className="flex-1">프로젝트 순이익</span>{' '}
                        <span className="text-right font-medium">{formatAmount(summary[0]?.netprofit ?? 0)}원</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary-blue-50 rounded-none bg-white text-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl leading-[1.3] font-bold">비용 차트</CardTitle>
                  <CardDescription>비용 용도별 지출 금액을 기준으로 상위 6개 항목을 제공합니다.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4 pb-4">
                  <div className="relative aspect-square w-[50%]">
                    <GapPieChart data={expenseChartData} />
                  </div>
                  <div className="w-[45%]">
                    <ul className="space-y-2 text-sm">
                      {expenseChartData.map((item) => (
                        <li key={item.name} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span className="flex-1">{item.name}</span>
                          {item.name !== '등록된 비용 없음' && (
                            <span className="text-right font-medium">{formatAmount(item.realValue)}원</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary-blue-50 rounded-none bg-white text-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl leading-[1.3] font-bold">인보이스</CardTitle>
                  <CardDescription>인보이스가 발행된 업체별 비율을 제공합니다.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4 pb-4">
                  <div className="relative aspect-square w-[50%]">
                    <GapPieChart data={invoiceChartData} />
                  </div>
                  <div className="w-[45%]">
                    <ul className="space-y-2 text-sm">
                      {invoiceChartData.map((item) => (
                        <li key={item.name} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
                          {item.name !== '등록된 인보이스 없음' && (
                            <span className="shrink-0 text-right font-medium">{formatAmount(item.realValue)}원</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary-blue-50 rounded-none bg-white text-gray-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl leading-[1.3] font-bold">비용 유형</CardTitle>
                  <CardDescription>등록된 비용을 견적서, 기안서, 야근 식대·교통비 기준으로 분류해 제공합니다.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4 pb-4">
                  <div className="relative aspect-square w-[50%]">
                    <GapPieChart data={expenseTypeChartData} />
                  </div>
                  <div className="w-[45%]">
                    <ul className="space-y-2 text-sm">
                      {expenseTypeChartData.map((item) => (
                        <li key={item.name} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</span>
                          {item.name !== '등록된 비용 없음' && (
                            <span className="shrink-0 text-right font-medium">{formatAmount(item.realValue)}원</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mt-8 flex w-full items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(fallbackListPath)}>
              목록
            </Button>
          </div>
        </div>
        <div className="flex w-[20%] flex-col gap-8">
          <div className="flex h-auto max-h-120 flex-col pb-4">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">프로젝트 멤버</h2>

              {data.project_status === 'in-progress' && isProjectMember && (
                <Button
                  type="button"
                  variant="svgIcon"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700"
                  onClick={() => setMemberDialogOpen(true)}>
                  <Edit className="size-4" />
                </Button>
              )}
            </div>
            <div className="overflow-y-auto pr-2">
              <ul className="flex flex-col gap-4">
                {sortedMembers.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-2.5">
                    <ProjectMember member={m} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex h-auto max-h-120 flex-col pb-4">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">프로젝트 히스토리</h2>
            </div>
            <div className="overflow-y-auto pr-2">
              <ProjectHistory logs={logs} />
            </div>
          </div>
        </div>
      </div>

      <ProjectUpdate
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        projectId={data.project_id}
        projectMembers={sortedMembers}
        onSuccess={refetch}
      />

      <ProjectMemberUpdate
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        projectId={data.project_id}
        projectTitle={data.project_title}
        members={sortedMembers}
        onSuccess={refetch}
      />
    </>
  );
}
