import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useOutletContext } from 'react-router';
import * as XLSX from 'xlsx';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { getEstimateList, type EstimateListItem, type projectEstimateParams } from '@/api';
import { formatKST, formatAmount } from '@/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@components/ui/button';
import { AppPagination } from '@/components/ui/AppPagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogClose, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Excel } from '@/assets/images/icons';

export default function ProjectEstimate() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data } = useOutletContext<ProjectLayoutContext>();

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

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setRegisterDialog(true);
          }}>
          견적서 등록
        </Button>
      </div>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[6%]">#</TableHead>
            <TableHead className="text-left">견적서 제목</TableHead>
            {/* <TableHead className="w-[12%]">클라이언트</TableHead> */}
            <TableHead className="w-[10%]">견적서 총액</TableHead>
            <TableHead className="w-[10%]">가용 예산</TableHead>
            <TableHead className="w-[8%]">작성자</TableHead>
            <TableHead className="w-[8%]">상태</TableHead>
            <TableHead className="w-[14%]">작성일시</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimateList.length ? (
            estimateList.map((item, idx) => (
              <TableRow className="[&_td]:text-[13px]" key={item.est_id}>
                <TableCell>{estimateList.length - idx}</TableCell>
                <TableCell className="text-left">
                  <Link to={`${item.est_id}`} className="hover:underline">
                    {item.est_title}
                  </Link>
                </TableCell>
                {/* <TableCell>{data.client_nm}</TableCell> */}
                <TableCell>{formatAmount(item.est_amount)}</TableCell>
                <TableCell>{formatAmount(item.est_budget)}</TableCell>
                <TableCell>{item.user_nm}</TableCell>
                <TableCell>{statusMap[item.est_valid as keyof typeof statusMap]}</TableCell>
                <TableCell>{formatKST(item.wdate)}</TableCell>
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
              견적서 비용 혹은 견적서 외 비용을 등록할 수 있습니다.
              <br />
              등록된 견적서가 있는데 신규 견적서를 등록하는 경우 매칭된 비용이 리셋됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setRegisterType('Y')}>
                신규 견적서 등록
              </Button>
              <Button variant="outline" onClick={() => setRegisterType('S')}>
                추가 견적서 등록
              </Button>
            </div>
            {registerType && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={openFileDialog}>
                    <Excel className="size-4.5" /> Excel 업로드
                  </Button>
                  <Button variant="outline" onClick={() => navigate('register', { state: { registerType } })}>
                    수기 입력
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="h-0 w-0 text-[0]" onChange={handleExcelUpload} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
