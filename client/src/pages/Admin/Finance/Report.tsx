import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { formatDate, formatAmount, getGrowingYears, SortIcon } from '@/utils';

import { getClientList, getTeamList } from '@/api';
import { getProjectList } from '@/api/admin/project';
import type { ProjectListResponse, ProjectListItem } from '@/api/admin/project';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { AppPagination } from '@/components/ui/AppPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { OctagonAlert, X, RefreshCw, ChevronsUpDown } from 'lucide-react';

type SortState = {
  key: string;
  order: 'asc' | 'desc';
} | null;

export default function Report() {
  const { user_id } = useUser();
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams(); // 파라미터 값 저장

  const [reportData, setReportData] = useState<ProjectListResponse | null>(null);
  const [reportList, setReportList] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // Filter States
  // ============================
  const currentYear = String(new Date().getFullYear()); // 올해 구하기
  const yearOptions = getGrowingYears(); // yearOptions
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || currentYear);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(() => searchParams.get('project_status')?.split(',') ?? ['in-progress']);
  const [selectedClient, setSelectedClient] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(''); // 사용자가 입력중인 Input 저장값
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색 Input 저장값
  const [sort, setSort] = useState<SortState>(null);

  const [page, setPage] = useState<number>(() => Number(searchParams.get('page') || 1));
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(15); // 한 페이지에 보여줄 개수

  const clientRef = useRef<MultiSelectRef>(null);
  const [clientOptions, setClientOptions] = useState<MultiSelectOption[]>([]);
  const teamRef = useRef<MultiSelectRef>(null);
  const [teamOptions, setTeamOptions] = useState<MultiSelectOption[]>([]);
  const statusRef = useRef<MultiSelectRef>(null);
  const statusOptions: MultiSelectOption[] = [
    { label: '진행중', value: 'in-progress' },
    { label: '종료됨', value: 'closed' },
    { label: '정산완료', value: 'completed' },
    { label: '취소됨', value: 'cancelled' },
  ];

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const statusMap = {
    'in-progress': (
      <Badge variant="secondary" size="table">
        진행중
      </Badge>
    ),
    closed: (
      <Badge className="bg-primary-blue" size="table">
        종료됨
      </Badge>
    ),
    completed: (
      <Badge variant="grayish" size="table">
        정산완료
      </Badge>
    ),
    cancelled: (
      <Badge className="bg-destructive" size="table">
        취소됨
      </Badge>
    ),
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [clients, teams] = await Promise.all([getClientList(), getTeamList()]);
        setClientOptions(clients.map((c) => ({ label: c.cl_name, value: String(c.cl_seq) })));
        setTeamOptions(teams.map((t) => ({ label: t.team_name, value: String(t.team_id) })));
      } catch (err) {
        console.error('❌ 필터 옵션 불러오기 실패:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // 프로젝트 리포트 리스트 조회
  const loadList = async () => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        year: selectedYear,
        page: page,
        size: pageSize,
      };

      params.project_status = selectedStatus.length ? selectedStatus.join(',') : 'in-progress';
      if (selectedClient.length > 0) {
        params.client_id = selectedClient.join(',');
      }

      if (selectedTeam.length > 0) {
        params.team_id = selectedTeam.join(',');
      }

      if (searchQuery) params.q = searchQuery;

      if (sort) {
        params.order = `${sort.key}:${sort.order}`;
      }

      setSearchParams(params);
      const res = await getProjectList(params);

      console.log('리포트 조회 성공', res);

      setReportData(res);
      setReportList(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('❌ 리포트 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [selectedYear, selectedStatus, selectedClient, selectedTeam, selectedStatus, searchQuery, sort, page, pageSize]);

  // 필터 변경 시 page 초기화
  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setPage(1);
  };

  // Order Sorting 핸들러
  const getSortOrder = (key: string) => {
    if (!sort) return undefined;
    return sort.key === key ? sort.order : undefined;
  };

  const hanldeToggleSort = (key: string) => {
    setSort((prev) => {
      // 기존 정렬 없음 → desc로 추가
      if (!prev) {
        return { key, order: 'desc' };
      }

      // 다른 컬럼 클릭 → 기존 제거 후 desc
      if (prev.key !== key) {
        return { key, order: 'desc' };
      }

      // 같은 컬럼 + desc → asc
      if (prev.order === 'desc') {
        return { key, order: 'asc' };
      }

      // 같은 컬럼 + asc → 제거
      return null;
    });

    setPage(1);
  };

  // 탭 변경 시 필터 초기화
  const resetAllFilters = () => {
    setSelectedYear(currentYear);
    setSelectedClient([]);
    setSelectedTeam([]);
    setSelectedStatus([]);
    setSearchInput('');
    setSearchQuery('');

    // MultiSelect 내부 상태 초기화
    clientRef.current?.clear();
    teamRef.current?.clear();
    statusRef.current?.clear();
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Row 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15" size="sm">
                15 Rows
              </SelectItem>
              <SelectItem value="30" size="sm">
                30 Rows
              </SelectItem>
              <SelectItem value="50" size="sm">
                50 Rows
              </SelectItem>
              <SelectItem value="100" size="sm">
                100 Rows
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={(v) => handleFilterChange(setSelectedYear, v)}>
            <SelectTrigger size="sm" className="px-2">
              <SelectValue placeholder="년도 선택" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem size="sm" key={y} value={y}>
                  {y}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <MultiSelect
            size="sm"
            ref={clientRef}
            className="max-w-[80px] min-w-auto!"
            maxCount={0}
            autoSize={true}
            placeholder="클라이언트 선택"
            options={clientOptions}
            onValueChange={(v) => handleFilterChange(setSelectedClient, v)}
            simpleSelect={true}
            hideSelectAll={true}
          />

          <MultiSelect
            size="sm"
            ref={teamRef}
            className="max-w-[80px] min-w-auto!"
            maxCount={0}
            autoSize={true}
            placeholder="팀 선택"
            options={teamOptions}
            onValueChange={(v) => handleFilterChange(setSelectedTeam, v)}
            simpleSelect={true}
            hideSelectAll={true}
          />

          <MultiSelect
            size="sm"
            ref={statusRef}
            className="max-w-[80px] min-w-auto!"
            maxCount={0}
            autoSize={true}
            placeholder="상태 선택"
            options={statusOptions}
            onValueChange={(v) => handleFilterChange(setSelectedStatus, v)}
            simpleSelect={true}
            hideSelectAll={true}
          />

          <Button
            type="button"
            variant="svgIcon"
            size="icon"
            className="hover:text-primary-blue-500 size-6 text-gray-600"
            onClick={resetAllFilters}>
            <RefreshCw />
          </Button>
        </div>

        <div className="flex gap-x-2">
          <div className="relative">
            <Input
              className="max-w-42 pr-6"
              size="sm"
              placeholder="검색어를 입력해 주세요."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchQuery(searchInput);
                }
              }}
            />
            {searchInput && (
              <Button
                type="button"
                variant="svgIcon"
                className="absolute top-0 right-0 h-full w-6 px-0 text-gray-500"
                onClick={resetAllFilters}>
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- 테이블 ---------------- */}
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-24 px-0!">프로젝트#</TableHead>
            <TableHead className="">프로젝트 이름</TableHead>
            <TableHead className="w-[12%]">클라이언트</TableHead>
            <TableHead className="w-[6.5%]">프로젝트 오너</TableHead>
            <TableHead className="w-[8%]">
              <Button
                type="button"
                variant="svgIcon"
                className="h-full w-full gap-1 text-[13px] has-[>svg]:p-0"
                onClick={() => hanldeToggleSort('est_amount')}>
                견적서 금액
                <SortIcon order={getSortOrder('est_amount')} />
              </Button>
            </TableHead>
            <TableHead className="w-[8%]">
              <Button
                type="button"
                variant="svgIcon"
                className="h-full w-full gap-1 text-[13px] has-[>svg]:p-0"
                onClick={() => hanldeToggleSort('est_budget')}>
                예상 지출 금액
                <SortIcon order={getSortOrder('est_budget')} />
              </Button>
            </TableHead>
            <TableHead className="w-[8%]">
              <Button
                type="button"
                variant="svgIcon"
                className="h-full w-full gap-1 text-[13px] has-[>svg]:p-0"
                onClick={() => hanldeToggleSort('inv_amount')}>
                계산서 금액
                <SortIcon order={getSortOrder('inv_amount')} />
              </Button>
            </TableHead>
            <TableHead className="w-[8%]">
              <Button
                type="button"
                variant="svgIcon"
                className="h-full w-full gap-1 text-[13px] has-[>svg]:p-0"
                onClick={() => hanldeToggleSort('exp_amount')}>
                실제 지출
                <SortIcon order={getSortOrder('exp_amount')} />
              </Button>
            </TableHead>
            <TableHead className="w-[8%]">
              <Button
                type="button"
                variant="svgIcon"
                className="h-full w-full gap-1 text-[13px] has-[>svg]:p-0"
                onClick={() => hanldeToggleSort('netprofit')}>
                Net
                <SortIcon order={getSortOrder('netprofit')} />
              </Button>
            </TableHead>
            <TableHead className="w-[6%]">
              <Button
                type="button"
                variant="svgIcon"
                className="h-full w-full gap-1 text-[13px] has-[>svg]:p-0"
                onClick={() => hanldeToggleSort('GPM')}>
                GPM
                <SortIcon order={getSortOrder('GPM')} />
              </Button>
            </TableHead>
            <TableHead className="w-[6%]">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="py-50 text-center text-gray-500">
                등록된 프로젝트 리포트가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {reportList.map((item, idx) => {
                return (
                  <TableRow className="[&_td]:px-2 [&_td]:text-[13px] [&_td]:leading-[1.3]" key={idx}>
                    <TableCell className="whitespace-nowrap">
                      <Link to={`/project/${item.project_id}`} className="rounded-[4px] border-1 bg-white p-1 text-sm">
                        {item.project_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-left">{item.project_title}</TableCell>
                    <TableCell>{item.client_nm}</TableCell>
                    <TableCell>{item.owner_nm}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.est_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.est_budget)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.inv_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.exp_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.netprofit)}</TableCell>
                    <TableCell>{item.GPM !== 0 ? `${item.GPM}%` : '-'}</TableCell>
                    <TableCell>{statusMap[item.project_status as keyof typeof statusMap]}</TableCell>
                  </TableRow>
                );
              })}
              {reportData !== null && (
                <>
                  <TableRow className="[&_td]:bg-gray-100 [&_td]:px-2 [&_td]:text-[13px] [&_td]:font-semibold">
                    <TableCell colSpan={4}>Sub Total</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_est_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_est_budget)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_inv_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_exp_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_netprofit)}</TableCell>
                    <TableCell>{reportData.subtotal.avg_gpm !== 0 ? `${reportData.subtotal.avg_gpm}%` : '-'}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow className="[&_td]:bg-primary-blue-100 [&_td]:px-2 [&_td]:text-[13px] [&_td]:font-semibold">
                    <TableCell colSpan={4}>Grand Total</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_est_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_est_budget)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_inv_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_exp_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_netprofit)}</TableCell>
                    <TableCell>{reportData.grandtotal.avg_gpm !== 0 ? `${reportData.grandtotal.avg_gpm}%` : '-'}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </>
              )}
            </>
          )}
        </TableBody>
      </Table>

      <div className="mt-5">
        {reportList.length !== 0 && (
          <AppPagination totalPages={Math.ceil(total / pageSize)} initialPage={page} visibleCount={5} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}
