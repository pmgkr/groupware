import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useIsMobileViewport } from '@/hooks/useViewport';
import { formatDate, formatAmount, getGrowingYears, SortIcon } from '@/utils';
import { downloadReportExcel } from '@/components/features/Project/utils/reportDown';
import { SapStatusDot } from '@/components/features/Project/utils/projectUtil';

import { getClientList, getTeamList } from '@/api';
import { getProjectList, getAdminReportExcel, updateExpcost, updateSapStatus, updateSapNo } from '@/api/admin/project';
import type { ProjectListResponse, ProjectListItem } from '@/api/admin/project';

import { ReportFilterPC } from '@/components/features/Project/_responsive/ReportFilterPC';
import { ReportFilterMobile } from '@/components/features/Project/_responsive/ReportFilterMo';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@components/ui/button';
import { AppPagination } from '@/components/ui/AppPagination';
import { RadioGroup, RadioButton } from '@components/ui/radioButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipIcon } from '@/components/ui/tooltip';
import { MultiSelect, type MultiSelectOption, type MultiSelectRef } from '@components/multiselect/multi-select';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

import { Edit } from '@/assets/images/icons';
import { X, OctagonAlert, LockKeyhole, Check } from 'lucide-react';

type SortState = {
  key: string;
  order: 'asc' | 'desc';
} | null;

type ProjectSapStatus = 'ready' | 'registered' | 'completed' | 'applied' | 'check';
const sapStatusOptions = [
  { id: 'ready', label: 'SAP 미등록', value: 'ready' },
  { id: 'registered', label: 'SAP 등록', value: 'registered' },
  { id: 'check', label: 'SAP 수정 필요', value: 'check' },
  { id: 'applied', label: 'SAP 반영 완료', value: 'applied' },
  { id: 'completed', label: 'SAP 종료', value: 'completed' },
];

const STATUS_META = {
  ready: {
    dialogTitle: 'SAP 미등록',
    dialogMessage: '프로젝트를 SAP 미등록 상태로 변경 하시겠습니까?',
    confirmText: '변경',
    alertTitle: '프로젝트 SAP 상태 변경',
    alertMessage: '프로젝트가 SAP 미등록 상태로 변경 되었습니다.',
    notiMessage: (actor: string) => `${actor}님이 프로젝트를 SAP 미등록 상태로 변경했습니다.`,
  },
  registered: {
    dialogTitle: 'SAP 등록',
    dialogMessage: '프로젝트를 SAP 등록 상태로 변경 하시겠습니까?',
    confirmText: '변경',
    alertTitle: '프로젝트 SAP 상태 변경',
    alertMessage: '프로젝트가 SAP 등록 상태로 변경 되었습니다.',
    notiMessage: (actor: string) => `${actor}님이 프로젝트를 SAP 등록 상태로 변경했습니다.`,
  },
  check: {
    dialogTitle: 'SAP 수정 필요',
    dialogMessage: '프로젝트를 SAP 수정 필요 상태로 변경 하시겠습니까?',
    confirmText: '변경',
    alertTitle: '프로젝트 SAP 상태 변경',
    alertMessage: '프로젝트가 SAP 수정 필요 상태로 변경 되었습니다.',
    notiMessage: (actor: string) => `${actor}님이 프로젝트를 SAP 수정 필요 상태로 변경했습니다.`,
  },
  applied: {
    dialogTitle: 'SAP 반영 완료',
    dialogMessage: '프로젝트를 SAP 반영 완료 상태로 변경 하시겠습니까?',
    confirmText: '변경',
    alertTitle: '프로젝트 SAP 상태 변경',
    alertMessage: '프로젝트가 SAP 반영 완료 상태로 변경 되었습니다.',
    notiMessage: (actor: string) => `${actor}님이 프로젝트를 SAP 반영 완료 상태로 변경했습니다.`,
  },
  completed: {
    dialogTitle: 'SAP 종료',
    dialogMessage: '프로젝트를 SAP 종료 상태로 변경 하시겠습니까?',
    confirmText: '변경',
    alertTitle: '프로젝트 SAP 상태 변경',
    alertMessage: '프로젝트가 SAP 종료 상태로 변경 되었습니다.',
    notiMessage: (actor: string) => `${actor}님이 프로젝트를 SAP 종료 상태로 변경했습니다.`,
  },
} as const;

export default function Report() {
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
  const [selectedSAP, setSelectedSAP] = useState<string[]>(() => searchParams.get('sap_status')?.split(',') ?? []);
  const [searchInput, setSearchInput] = useState(''); // 사용자가 입력중인 Input 저장값
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색 Input 저장값
  const [editingId, setEditingId] = useState<string | null>(null); // 예상 지출 금액 수정 ID
  const [editingValue, setEditingValue] = useState<number>(0); // 수정된 예상 지출 금액 Value 저장용
  const [editingDisplay, setEditingDisplay] = useState<string>(''); // 수정된 예상 지출 금액 보여주는 값
  const [sort, setSort] = useState<SortState>(null);
  const [isLocked, setIsLocked] = useState<'Y' | 'N' | ''>(''); // 프로젝트 잠금 상태

  const [selectedProject, setSelectedProject] = useState<ProjectListItem | null>(null); // 프로젝트 상태 변경용 선택한 프로젝트 ID
  const [projectDialog, setProjectDialog] = useState(false); // 프로젝트 상태 변경 Dialog State
  const pendingReloadRef = useRef(false);
  const [selectedSapStatus, setSelectedSapStatus] = useState<ProjectSapStatus | null>(null);
  const [sapNoInput, setSapNoInput] = useState('');
  const [isEditingSapNo, setIsEditingSapNo] = useState(false);

  const [page, setPage] = useState<number>(() => Number(searchParams.get('page') || 1));
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(15); // 한 페이지에 보여줄 개수

  const clientRef = useRef<MultiSelectRef>(null);
  const [clientOptions, setClientOptions] = useState<MultiSelectOption[]>([]);
  const teamRef = useRef<MultiSelectRef>(null);
  const [teamOptions, setTeamOptions] = useState<MultiSelectOption[]>([]);
  const statusRef = useRef<MultiSelectRef>(null);
  const sapRef = useRef<MultiSelectRef>(null);
  const sapOptions: MultiSelectOption[] = sapStatusOptions.map((o) => ({ label: o.label, value: o.value }));
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

      if (selectedSAP.length > 0) {
        params.sap_status = selectedSAP.join(',');
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
  }, [selectedYear, selectedStatus, selectedClient, selectedTeam, selectedSAP, searchQuery, sort, isLocked, page, pageSize]);

  useEffect(() => {
    if (!projectDialog && pendingReloadRef.current) {
      const timer = setTimeout(() => {
        pendingReloadRef.current = false;
        loadList();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [projectDialog]);

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
    setSelectedSAP([]);
    setSearchInput('');
    setSearchQuery('');
    setIsLocked('');
    setSort(null);

    // MultiSelect 내부 상태 초기화
    clientRef.current?.clear();
    teamRef.current?.clear();
    statusRef.current?.clear();
    sapRef.current?.clear();
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

    if (selectedSAP.length > 0) {
      params.sap_status = selectedSAP.join(',');
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

  // 프로젝트 상태 변경 다이얼로그 핸들러
  const handleSapStatusChange = async (status: 'ready' | 'registered' | 'completed' | 'check' | 'applied') => {
    if (!selectedProject) return;

    try {
      const payload: { project_id: string; status: string; sap_no?: string } = {
        project_id: selectedProject.project_id,
        status,
      };
      if (!selectedProject.sap_no && sapNoInput.trim()) {
        payload.sap_no = sapNoInput.trim();
      }
      const res = await updateSapStatus(payload);
      console.log('프로젝트 상태 변경 성공:', res);

      if (res.result === 'success') {
        const meta = STATUS_META[status];

        addAlert({
          title: meta.alertTitle,
          message: meta.alertMessage,
          icon: <OctagonAlert />,
          duration: 1500,
        });

        pendingReloadRef.current = true;
        setProjectDialog(false);
      }
    } catch (err) {
      console.error('❌ 프로젝트 상태 변경 실패:', err);
      addAlert({
        title: '프로젝트 상태 변경 실패',
        message: '프로젝트 상태 변경 중 오류가 발생했습니다. 다시 시도해주세요.',
        icon: <OctagonAlert />,
        duration: 2000,
      });
      return;
    }
  };

  // 프로젝트 SAP No 업데이트 핸들러
  const handleUpdateSapNo = async (projectId: string, sap_no: string) => {
    const payload = { project_id: projectId, sap_no };

    await updateSapNo(payload);

    setSelectedProject((prev) => (prev ? { ...prev, sap_no } : prev));

    addAlert({
      title: '프로젝트 SAP 넘버가 수정되었습니다.',
      message: `<p>프로젝트# <span class="text-primary-blue-500">${projectId}</span>의 SAP 넘버가 수정되었습니다.</p>`,
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
    selectedSAP,
    isLocked,

    clientOptions,
    teamOptions,
    statusOptions,
    sapOptions,

    clientRef,
    teamRef,
    statusRef,
    sapRef,

    onClientChange: (v: string[]) => handleFilterChange(setSelectedClient, v),
    onTeamChange: (v: string[]) => handleFilterChange(setSelectedTeam, v),
    onStatusChange: (v: string[]) => handleFilterChange(setSelectedStatus, v),
    onSAPChange: (v: string[]) => handleFilterChange(setSelectedSAP, v),

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
            <TableHead>프로젝트 이름</TableHead>
            <TableHead className="w-[10%]">클라이언트</TableHead>
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
                      <div className="flex gap-1">
                        <p className="flex-1 truncate">{item.project_title}</p>
                        {item.is_locked === 'Y' && <LockKeyhole className="size-3 shrink-0 text-gray-600" />}
                      </div>
                      {item.sap_no && <div className="mt-.5 text-xs text-gray-600">SAP NO. {item.sap_no}</div>}
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
                    <TableCell>
                      <div
                        className="relative inline-flex cursor-pointer"
                        title="프로젝트 SAP 등록 상태 변경"
                        onClick={() => {
                          setSelectedProject(item);
                          setSelectedSapStatus(item.sap_status as ProjectSapStatus);
                          setSapNoInput('');
                          setIsEditingSapNo(false);
                          setProjectDialog(true);
                        }}>
                        {statusMap[item.project_status as keyof typeof statusMap]}
                        <SapStatusDot sap_status={item.sap_status} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Sub Total & Grand Total Row */}
              {reportData !== null && (
                <>
                  <TableRow className="[&_td]:bg-gray-100 [&_td]:px-2 [&_td]:text-[13px] [&_td]:font-semibold">
                    <TableCell colSpan={4}>Sub Total</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_est_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_est_budget)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_inv_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_exp_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.subtotal.sum_netprofit)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {reportData.subtotal.avg_gpm !== 0 && reportData.subtotal.avg_gpm !== null
                          ? `${((reportData.subtotal.sum_netprofit / reportData.subtotal.sum_inv_amount) * 100).toFixed(2)}%`
                          : '-'}
                        <Tooltip>
                          <TooltipTrigger type="button">
                            <TooltipIcon />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>(Net / 계산서 금액) &times; 100</p>
                            <p className="mt-1 text-red-400">
                              ({formatAmount(Math.round(reportData.subtotal.sum_netprofit / 1000000))} /{' '}
                              {formatAmount(Math.round(reportData.subtotal.sum_inv_amount / 1000000))}) &times; 100
                              <span className="text-xs text-gray-400"> (단위: 백만)</span>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow className="[&_td]:bg-primary-blue-100 [&_td]:px-2 [&_td]:text-[13px] [&_td]:font-semibold">
                    <TableCell colSpan={4}>Grand Total</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_est_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_est_budget)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_inv_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_exp_amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(reportData.grandtotal.sum_netprofit)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {reportData.grandtotal.avg_gpm !== 0 && reportData.grandtotal.avg_gpm !== null
                          ? `${((reportData.grandtotal.sum_netprofit / reportData.grandtotal.sum_inv_amount) * 100).toFixed(2)}%`
                          : '-'}
                        <Tooltip>
                          <TooltipTrigger type="button">
                            <TooltipIcon />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>(Net / 계산서 금액) &times; 100</p>
                            <p className="mt-1 text-red-400">
                              ({formatAmount(Math.round(reportData.grandtotal.sum_netprofit / 1000000))} /{' '}
                              {formatAmount(Math.round(reportData.grandtotal.sum_inv_amount / 1000000))}) &times; 100
                              <br />
                              <span className="text-xs text-gray-400"> (단위: 백만)</span>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
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

      <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>프로젝트 SAP 설정</DialogTitle>
            <DialogDescription className="leading-[1.3] break-keep">프로젝트 SAP 설정 상태를 확인할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div>
            <div className="mb-3">
              {selectedProject?.sap_no && !isEditingSapNo ? (
                <>
                  <p className="text-base font-medium max-md:text-[13px]">SAP No.</p>
                  <div className="flex h-8 items-center justify-between text-base text-gray-700">
                    {selectedProject.sap_no}
                    <Button
                      type="button"
                      variant="svgIcon"
                      size="sm"
                      className="size-5 px-1! align-middle text-gray-600 transition-none hover:text-gray-700"
                      onClick={() => {
                        setSapNoInput(selectedProject.sap_no ?? '');
                        setIsEditingSapNo(true);
                      }}>
                      <Edit className="size-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-medium max-md:text-[13px]">SAP No.</p>
                    <button
                      type="button"
                      className="cursor-pointer text-xs font-medium text-gray-600"
                      onClick={() => {
                        setIsEditingSapNo(false);
                      }}>
                      수정취소
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      maxLength={20}
                      value={sapNoInput}
                      autoFocus={isEditingSapNo}
                      onChange={(e) => setSapNoInput(e.target.value)}
                      placeholder="SAP No. 입력"
                    />

                    <Button
                      type="button"
                      variant="svgIcon"
                      size="sm"
                      className="absolute top-0 right-0 h-full w-8 px-1! text-gray-700 transition-none hover:text-gray-800"
                      onClick={() => {
                        if (sapNoInput.trim() && selectedProject) {
                          handleUpdateSapNo(selectedProject.project_id, sapNoInput.trim());
                          setIsEditingSapNo(false);
                        }
                      }}>
                      <Check className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
            <RadioGroup value={selectedSapStatus ?? undefined} onValueChange={(value) => setSelectedSapStatus(value as ProjectSapStatus)}>
              <p className="text-base font-medium max-md:text-[13px]">SAP 상태 업데이트</p>
              <div className="grid grid-cols-2 items-start gap-2">
                {sapStatusOptions
                  .filter((option) => option.value !== selectedProject?.sap_status)
                  .map((option) => (
                    <RadioButton
                      key={option.id}
                      id={option.id}
                      variant="dynamic"
                      label={option.label}
                      value={option.value}
                      size="md"
                      iconHide={true}
                    />
                  ))}
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button type="button" onClick={() => handleSapStatusChange(selectedSapStatus as ProjectSapStatus)}>
              변경사항 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
