import { useRef, useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useOutletContext } from 'react-router';
import * as XLSX from 'xlsx';
import { useUser } from '@/hooks/useUser';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { getEstimateList, type EstimateListItem, type projectEstimateParams } from '@/api';
import { formatDate, formatAmount } from '@/utils';
import { useIsMobileViewport } from '@/hooks/useViewport';

import { Badge } from '@/components/ui/badge';
import { Button } from '@components/ui/button';
import { AppPagination } from '@/components/ui/AppPagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogClose, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ProjectEstimate() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user_id } = useUser();
  const { data, members } = useOutletContext<ProjectLayoutContext>();
  const isMobile = useIsMobileViewport();

  // 상단 필터용 state
  const [registerDialog, setRegisterDialog] = useState(false); // Dialog용 State
  const [registerType, setRegisterType] = useState<'Y' | 'S' | null>(null); // Dialog Type용 State

  // API 데이터 state
  const [estimateList, setEstimateList] = useState<EstimateListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 페이지네이션
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15; // 한 페이지에 보여줄 개수

  // Excel 데이터 업로드용 Input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Excel 파일 업로드 핸들러
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, '');

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('✅ 업로드된 Excel 데이터:', jsonData);

    // 업로드 완료 후 register 페이지로 이동
    navigate('preview', { state: { registerType, estName: fileName, excelData: jsonData, excelFile: file } });
  };

  // 엑셀 업로드 버튼 클릭 시 input 트리거
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 견적서 리스트 가져오기
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params: projectEstimateParams = {
          project_id: projectId,
          page,
          size: pageSize,
        };

        const res = await getEstimateList(params);

        console.log('📦 견적서 요청 파라미터:', params);
        console.log('✅ 견적서 리스트 응답:', res);

        const sortedList = res.items.sort((a, b) => {
          if (a.est_valid === 'Y' && b.est_valid !== 'Y') return -1;
          if (a.est_valid !== 'Y' && b.est_valid === 'Y') return 1;
          return 0;
        });

        setEstimateList(sortedList);

        setTotal(res.total);
      } catch (err) {
        console.error('❌ 견적서 리스트 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const statusMap = {
    Y: <Badge>최종견적</Badge>,
    S: <Badge variant="secondary">추가견적</Badge>,
    N: <Badge variant="grayish">과거견적</Badge>,
  } as const;

  const isProjectMember = useMemo(() => members.some((m) => m.user_id === user_id), [members, user_id]);

  return (
    <>
      {isMobile ? (
        <>
          {estimateList.length ? (
            <div className="space-y-4">
              {estimateList.map((item, idx) => (
                <div className="rounded-md border border-gray-300 p-4">
                  <div className="mb-1 flex justify-between border-b border-gray-300 pb-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>#{estimateList.length - idx}</span>
                    </div>
                    {statusMap[item.est_valid as keyof typeof statusMap]}
                  </div>
                  <Link to={`${item.est_id}`}>
                    <div className="mt-2 flex items-center gap-2 overflow-hidden text-lg tracking-tight">
                      <p className="flex-1 truncate">{item.est_title}</p>
                      <strong className="shrink-0 font-medium">{formatAmount(item.est_amount)}원</strong>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <p className="shrink-0">{item.user_nm}</p>
                      <p>가용 예산 {formatAmount(item.est_budget)}원</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-50 text-center text-base text-gray-500">등록된 견적서가 없습니다.</p>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            {data.project_status === 'in-progress' && (
              <Button
                size="sm"
                onClick={() => {
                  setRegisterDialog(true);
                }}>
                견적서 등록
              </Button>
            )}
          </div>
          <Table variant="primary" align="center" className="table-fixed">
            <TableHeader>
              <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
                <TableHead className="w-[6%]">#</TableHead>
                <TableHead className="text-left">견적서 제목</TableHead>
                <TableHead className="w-[10%]">견적서 총액</TableHead>
                <TableHead className="w-[10%]">가용 예산</TableHead>
                <TableHead className="w-[8%]">작성자</TableHead>
                <TableHead className="w-[8%]">상태</TableHead>
                <TableHead className="w-[12%]">작성일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimateList.length ? (
                estimateList.map((item, idx) => (
                  <TableRow className="[&_td]:text-[13px] max-2xl:[&_td]:text-sm" key={item.est_id}>
                    <TableCell>{estimateList.length - idx}</TableCell>
                    <TableCell className="text-left">
                      <Link to={`${item.est_id}`} className="hover:underline">
                        {item.est_title}
                      </Link>
                    </TableCell>
                    <TableCell>{formatAmount(item.est_amount)}</TableCell>
                    <TableCell>{formatAmount(item.est_budget)}</TableCell>
                    <TableCell>{item.user_nm}</TableCell>
                    <TableCell>{statusMap[item.est_valid as keyof typeof statusMap]}</TableCell>
                    <TableCell>{formatDate(item.wdate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-50 text-center text-gray-500">
                    등록된 견적서가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </>
      )}

      <div className="mt-5">
        {estimateList.length !== 0 && (
          <AppPagination
            totalPages={Math.ceil(total / pageSize)}
            initialPage={page}
            visibleCount={5}
            onPageChange={(p) => setPage(p)} //부모 state 업데이트
          />
        )}
      </div>

      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신규 견적서 등록</DialogTitle>
            <DialogDescription className="leading-[1.3]">
              신규 견적서 혹은 추가 견적서 (서브 견적서)를 등록할 수 있습니다.
              <br />
              <span className="text-primary">신규 견적서를 재등록하는 경우 최종견적과 매칭된 비용이 리셋</span>됩니다. <br />
            </DialogDescription>
          </DialogHeader>
          <div className="relative py-4">
            <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="absolute h-0 w-0 text-[0]" onChange={handleExcelUpload} />
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRegisterType('Y');
                  openFileDialog();
                }}>
                신규 견적서 등록
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRegisterType('S');
                  openFileDialog();
                }}>
                추가 견적서 등록
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
