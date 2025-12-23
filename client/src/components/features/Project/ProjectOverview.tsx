// src/components/features/Project/ProjectOverview
import { useEffect, useState } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { getAvatarFallback, formatAmount } from '@/utils';

import { type projectOverview } from '@/api';
import { buildExpenseColorMap, buildPieChartData, type PieItem, type PieChartItem } from './utils/colorMap';

import { HalfDonut } from '@components/charts/HalfDonut';
import { GapPieChart } from '@components/charts/GapPieChart';

import { Button } from '@components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { ProjectMember } from './_components/ProjectMember';

import { Edit } from '@/assets/images/icons';
import { FilePlus } from 'lucide-react';
import { format } from 'date-fns';

type Props = { data: projectOverview };

export default function Overview() {
  const location = useLocation();
  const navigate = useNavigate();

  const listSearch = (location.state as any)?.fromSearch ?? '';
  const fallbackListPath = listSearch ? `/project${listSearch}` : '/project';

  const { data, members, summary, expense_data, expense_type, logs } = useOutletContext<ProjectLayoutContext>();
  const [expenseColorMap, setExpenseColorMap] = useState<Record<string, string>>({});

  const [expenseData, setExpenseData] = useState<PieItem[]>([]);
  const [expenseChartData, setExpenseChartData] = useState<PieChartItem[]>([]);

  // 비용 유형 컬러맵 생성
  useEffect(() => {
    async function loadColors() {
      const map = await buildExpenseColorMap();
      setExpenseColorMap(map);
    }
    loadColors();
  }, []);

  // expense_data + colorMap → PieItem[]
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
          name: '등록된 비용이 없습니다.',
          value: 100,
          realValue: 100,
          color: '#ededed',
        },
      ]);
      return;
    }

    const chartData = buildPieChartData(expenseData);
    setExpenseChartData(chartData);
  }, [expenseData]);

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

  return (
    <>
      <div className="flex min-h-160 flex-wrap justify-between py-2">
        <div className="w-[76%] tracking-tight">
          <div className="flex flex-wrap gap-[3%]">
            <div className="w-full">
              <h3 className="mb-2 text-lg font-bold text-gray-800">프로젝트 정보</h3>
              <TableColumn>
                <TableColumnHeader className="w-[15%]">
                  <TableColumnHeaderCell>프로젝트 #</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 오너</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 견적</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>{data.project_id}</TableColumnCell>
                  <TableColumnCell>{data.owner_nm}</TableColumnCell>
                  <TableColumnCell>{formatAmount(data.est_amount) ?? 0}</TableColumnCell>
                </TableColumnBody>
                <TableColumnHeader className="w-[15%]">
                  <TableColumnHeaderCell>클라이언트</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 기간</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 예상 지출</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>{data.client_nm}</TableColumnCell>
                  <TableColumnCell>{`${formatDate(data.project_sdate)} ~ ${formatDate(data.project_edate)}`}</TableColumnCell>
                  <TableColumnCell>{formatAmount(data.est_budget) ?? 0}</TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            </div>
            <div className="mt-8 grid w-full grid-cols-2 grid-rows-2 gap-4">
              <Card className="border-0 bg-white text-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">프로젝트 GPM</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <div className="relative aspect-square w-[50%]">
                    <HalfDonut value={summary[0]?.GPM ?? 0} />
                    <span className="centered absolute text-center text-lg leading-[1.2] font-bold">
                      GPM <span className="text-primary block text-[1.4em]">{summary[0]?.GPM ?? 0}%</span>
                    </span>
                  </div>
                  <div className="w-[45%]">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="bg-primary-blue h-2.5 w-2.5 rounded-sm" />
                        <span className="flex-1">인보이스 발행금액</span>{' '}
                        <span className="text-right font-medium">{formatAmount(summary[0]?.inv_amount ?? 0)}</span>
                      </li>
                      <li className="bg-pri flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm bg-gray-400" />
                        <span className="flex-1">지출 비용 합계</span>{' '}
                        <span className="text-right font-medium">{formatAmount(summary[0]?.exp_amount ?? 0)}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-primary h-2.5 w-2.5 rounded-sm" />
                        <span className="flex-1">프로젝트 순이익</span>{' '}
                        <span className="text-right font-medium">{formatAmount(summary[0]?.netprofit ?? 0)}</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white text-gray-800">
                <CardHeader>
                  <CardTitle>비용 차트</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <div className="relative aspect-square w-[50%]">
                    <GapPieChart data={expenseChartData} />
                  </div>
                  <div className="w-[45%]">
                    <ul className="space-y-2 text-sm">
                      {expenseChartData.map((item) => (
                        <li key={item.name} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span className="flex-1">{item.name}</span>
                          {item.name !== '등록된 비용이 없습니다.' && (
                            <span className="text-right font-medium">{formatAmount(item.realValue)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white text-gray-800">
                <CardHeader>
                  <CardTitle>인보이스</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <div className="relative w-full">UI 준비중 입니다.</div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white text-gray-800">
                <CardHeader>
                  <CardTitle>비용 유형</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <div className="relative w-full">UI 준비중 입니다.</div>
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
        <div className="flex w-[20%] flex-col gap-4">
          <div className="flex h-[45%] flex-col pb-4">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">프로젝트 멤버</h2>
              <Button type="button" variant="outline" size="sm">
                <Edit />
                수정
              </Button>
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
          <div className="flex h-[45%] flex-col pb-4">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">프로젝트 히스토리</h2>
            </div>
            <div className="overflow-y-auto pr-2">
              <ul className="flex flex-col gap-4">
                <li>
                  <div className="relative before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80 first:before:hidden">
                    <div className="flex items-center gap-4">
                      <span className="flex size-8 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                        <FilePlus className="text-primary-blue size-4.5" />
                      </span>
                      <dl className="text-base leading-[1.3] text-gray-800">
                        <dt>
                          <strong className="font-semibold text-gray-900">홍길동</strong>님이 프로젝트를 생성했습니다.
                        </dt>
                        <dd className="text-[.88em] text-gray-500">2025-11-13 19:00:00</dd>
                      </dl>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
