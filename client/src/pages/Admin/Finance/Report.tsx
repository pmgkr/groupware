import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';
import { formatDate, formatAmount, getGrowingYears, SortIcon } from '@/utils';
import { downloadReportExcel } from '@/components/features/Project/utils/reportDown';

import { getClientList, getTeamList } from '@/api';
import { getProjectList, getAdminReportExcel, updateExpcost } from '@/api/admin/project';
import type { ProjectListResponse, ProjectListItem } from '@/api/admin/project';

import { ReportFilterPC } from '@/components/features/Project/_responsive/ReportFilterPC';
import { ReportFilterMobile } from '@/components/features/Project/_responsive/ReportFilterMo';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@components/ui/button';
import { AppPagination } from '@/components/ui/AppPagination';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { Edit } from '@/assets/images/icons';
import { X, RefreshCw, OctagonAlert, Lock, LockOpen, LockKeyhole } from 'lucide-react';

type SortState = {
  key: string;
  order: 'asc' | 'desc';
} | null;

export default function Report() {
  const { user_id } = useUser();
  const { search } = useLocation();
  const isMobile = useIsMobileViewport();
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
  const [editingId, setEditingId] = useState<string | null>(null); // 예상 지출 금액 수정 ID
  const [editingValue, setEditingValue] = useState<number>(0); // 수정된 예상 지출 금액 Value 저장용
  const [editingDisplay, setEditingDisplay] = useState<string>(''); // 수정된 예상 지출 금액 보여주는 값
  const [sort, setSort] = useState<SortState>(null);
  const [isLocked, setIsLocked] = useState<'Y' | 'N' | ''>(''); // 프로젝트 잠금 상태

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
    { label: '종료됨', value: 'Closed' },
    { label: '정산완료', value: 'Completed' },
    { label: '취소됨', value: 'Cancelled' },
  ];

  const { addAlert } = useAppAlert();
  const { addDialog } = useAppDialog();

  const statusMap = {
    'in-progress': (
      <Badge variant="secondary" size="table">
        진행중
      </Badge>
    ),
    Closed: (
      <Badge className="bg-primary-blue" size="table">
        종료됨
      </Badge>
    ),
    Completed: (
      <Badge variant="grayish" size="table">
        정산완료
      </Badge>
    ),
    Cancelled: (
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

      if (selectedStatus.length > 0) {
        params.project_status = selectedStatus.join(',');
      }

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

      // 프로젝트 잠금 상태 필터
      if (isLocked === 'Y' || isLocked === 'N') {
        params.is_locked = isLocked;
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
  }, [selectedYear, selectedStatus, selectedClient, selectedTeam, selectedStatus, searchQuery, sort, isLocked, page, pageSize]);

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

  const handleLockChange = () => {
    // isLocked 값 '' -> 'Y' -> 'N' -> ''
    isLocked === '' ? setIsLocked('Y') : isLocked === 'Y' ? setIsLocked('N') : setIsLocked('');
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
    setIsLocked('');
    setSort(null);

    // MultiSelect 내부 상태 초기화
    clientRef.current?.clear();
    teamRef.current?.clear();
    statusRef.current?.clear();
  };

  const handleExcelDownload = async () => {
    const params: Record<string, any> = {
      year: selectedYear,
      page: page,
      size: pageSize,
    };

    if (selectedStatus.length > 0) {
      params.project_status = selectedStatus.join(',');
    }

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

    // 프로젝트 잠금 상태 필터
    if (isLocked === 'Y' || isLocked === 'N') {
      params.is_locked = isLocked;
    }

    setSearchParams(params);
    const res = await getAdminReportExcel(params);

    console.log('엑셀 저장용 리스트', res);

    downloadReportExcel(res, params);
  };

  // 프로젝트 별 예상 지출 금액 수정
  const handleUpdateExp = async (projectId: string) => {
    await updateExpcost(projectId, editingValue);

    addAlert({
      title: '예상 지출 금액 수정',
      message: `<p>프로젝트# <span class="text-primary-blue-500">${projectId}</span>의 예상 지출 금액이 수정되었습니다.</p>`,
      icon: <OctagonAlert />,
      duration: 2000,
    });

    loadList();
  };

  const filterProps = {
    /* pagination */
    pageSize,
    onPageSizeChange: (size: number) => {
      setPageSize(size);
      setPage(1);
    },

    /* year */
    yearOptions,
    selectedYear,
    onYearChange: (v: string) => handleFilterChange(setSelectedYear, v),

    /* client / team / status */
    selectedClient,
    selectedTeam,
    selectedStatus,
    isLocked,

    clientOptions,
    teamOptions,
    statusOptions,

    clientRef,
    teamRef,
    statusRef,

    onClientChange: (v: string[]) => handleFilterChange(setSelectedClient, v),
    onTeamChange: (v: string[]) => handleFilterChange(setSelectedTeam, v),
    onStatusChange: (v: string[]) => handleFilterChange(setSelectedStatus, v),

    /* search */
    searchInput,
    onSearchInputChange: setSearchInput,
    onSearchSubmit: () => {
      setSearchQuery(searchInput);
      setPage(1);
    },
    onReset: resetAllFilters,

    /* lock */
    onLockToggle: handleLockChange,
  };

  return (
    <>
      {isMobile ? <ReportFilterMobile {...filterProps} /> : <ReportFilterPC {...filterProps} />}

      {/* ---------------- 테이블 ---------------- */}
      <Table variant="primary" align="center" className="table-fixed max-md:w-320">
        <TableHeader>
          <TableRow className="[&_th]:px-2 [&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-24 px-0!">프로젝트#</TableHead>
            <TableHead className="">프로젝트 이름</TableHead>
            <TableHead className="w-[12%]">클라이언트</TableHead>
            <TableHead className="w-[6.5%] max-md:w-[8%]">프로젝트 오너</TableHead>
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
            <TableHead className="w-[9%]">
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
                    <TableCell className="text-left">
                      {item.project_title}
                      {item.is_locked === 'Y' && <LockKeyhole className="ml-1 inline-block size-3 text-gray-600" />}
                    </TableCell>
                    <TableCell>{item.client_nm}</TableCell>
                    <TableCell>{item.owner_nm}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.est_amount)}</TableCell>
                    <TableCell className="text-right">
                      {editingId === item.project_id ? (
                        <div className="flex items-center justify-end">
                          <Input
                            size="sm"
                            value={editingDisplay}
                            className="w-full px-2 text-right"
                            placeholder="예상 지출 금액"
                            autoFocus
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, '');
                              if (!/^\d*$/.test(raw)) return; // 숫자만 허용

                              const num = Number(raw);

                              setEditingValue(num);
                              setEditingDisplay(raw === '' ? '' : formatAmount(num));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateExp(item.project_id);
                                setEditingId(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            onBlur={() => {
                              if (editingDisplay !== '') {
                                setEditingDisplay(formatAmount(editingValue));
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="svgIcon"
                            size="sm"
                            className="px-1! text-gray-600 hover:text-gray-700"
                            onClick={() => {
                              setEditingId(null);
                            }}>
                            <X className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {formatAmount(item.est_budget)}
                          <Button
                            type="button"
                            variant="svgIcon"
                            size="sm"
                            className="px-1! align-middle text-gray-600 hover:text-gray-700"
                            onClick={() => {
                              setEditingId(item.project_id);
                              setEditingValue(item.est_budget);
                              setEditingDisplay(formatAmount(item.est_budget));
                            }}>
                            <Edit className="size-3" />
                          </Button>
                        </>
                      )}
                    </TableCell>

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

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExcelDownload}>
          Excel 다운로드
        </Button>
      </div>

      <div className="mt-5">
        {reportList.length !== 0 && (
          <AppPagination totalPages={Math.ceil(total / pageSize)} initialPage={page} visibleCount={5} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}
